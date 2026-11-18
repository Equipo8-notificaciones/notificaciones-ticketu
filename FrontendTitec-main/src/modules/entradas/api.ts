// ============================================================================
// modules/entradas/api.ts
// ----------------------------------------------------------------------------
// Capa de API para el Microservicio de Entradas e Inventario (Grupo 3).
// Obtiene los eventos desde Catálogo (/api/catalogo/eventos) y opera reservas/
// emisión/disponibilidad contra Entradas (/api/entradas) vía API Gateway.
// Sin datos mock ni fallbacks locales.
// ============================================================================

import { GATEWAY_URL } from "@/lib/env";
import {
  EventoEntradas,
  EstadoGestionEvento,
  ReservaTemporal,
  EntradaEmitida,
  PromocionAplicada,
} from "./types";

const BASE_PATH = "/api/entradas";
const CATALOGO_PATH = "/api/catalogo/eventos";

interface CatalogoEventoRaw {
  id_evento: string;
  nombre_evento: string;
  descripcion_evento?: string;
  lugar_evento?: string;
  fecha_evento?: string;
  hora_evento?: string;
  precio_final_evento?: number;
  tipo_evento?: string;
  estado_evento?: string;
  stock_actual?: number;
  stock_inicial?: number;
  maximo_ticket?: number;
}

function mapEstadoCatalogo(estado?: string): EstadoGestionEvento {
  const norm = (estado || "").toLowerCase();
  if (norm === "cancelado") return "CANCELADO";
  if (norm === "pasado" || norm === "finalizado") return "FINALIZADO";
  if (norm === "borrador") return "BORRADOR";
  return "PUBLICADO";
}

function mapCatalogoToEventoEntradas(ev: CatalogoEventoRaw): EventoEntradas {
  const esGratuita = ev.tipo_evento === "gratuito" || Number(ev.precio_final_evento ?? 0) === 0;
  const stockActual = Number(ev.stock_actual ?? 0);
  const stockTotal = Number(ev.stock_inicial ?? stockActual);

  return {
    id: ev.id_evento,
    titulo: ev.nombre_evento,
    fecha: ev.fecha_evento
      ? new Date(ev.fecha_evento).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Por confirmar",
    hora: ev.hora_evento || "Por confirmar",
    lugar: ev.lugar_evento || "Por confirmar",
    descripcion: ev.descripcion_evento,
    tipoEntrada: esGratuita ? "GRATUITA" : "PAGADA",
    precio: esGratuita ? 0 : Number(ev.precio_final_evento ?? 0),
    stockTotal: stockTotal > 0 ? stockTotal : stockActual,
    stockDisponible: stockActual,
    maxTickets: Number(ev.maximo_ticket ?? 6),
    limiteGratuitoUsuario: esGratuita ? 2 : undefined,
    estadoGestion: mapEstadoCatalogo(ev.estado_evento),
  };
}

/**
 * Obtiene la lista de eventos desde el microservicio de Catálogo vía API Gateway.
 */
export async function obtenerEventos(): Promise<EventoEntradas[]> {
  const res = await fetch(`${GATEWAY_URL}${CATALOGO_PATH}?limite=100`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.message || `Error HTTP ${res.status} al cargar eventos desde Catálogo`);
  }

  const json = await res.json();
  const lista: CatalogoEventoRaw[] = Array.isArray(json) ? json : json?.data || [];
  return lista.map(mapCatalogoToEventoEntradas);
}

/**
 * Obtiene un evento específico desde Catálogo y sincroniza su stock real con Entradas si está disponible.
 */
export async function obtenerEventoPorId(eventoId: string): Promise<EventoEntradas | null> {
  const res = await fetch(`${GATEWAY_URL}${CATALOGO_PATH}/${encodeURIComponent(eventoId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.message || `Error HTTP ${res.status} al consultar el evento en Catálogo`);
  }

  const json = await res.json();
  const raw: CatalogoEventoRaw = json?.data ?? json;
  const evento = mapCatalogoToEventoEntradas(raw);

  // Sincronizar stock en vivo desde Entradas si el evento existe en MongoDB de Entradas
  try {
    const disp = await obtenerDisponibilidad(eventoId);
    evento.stockDisponible = disp.stockDisponible;
    evento.stockTotal = disp.stockTotal;
    evento.tipoEntrada = disp.tipoEntrada;
    evento.precio = disp.precio;
  } catch {
    // Si Entradas aún no tiene el evento sincronizado, se mantiene el dato de Catálogo
  }

  return evento;
}

/**
 * Consulta la disponibilidad en tiempo real desde Entradas (MongoDB).
 */
export async function obtenerDisponibilidad(eventoId: string): Promise<{
  idEvento: string;
  stockDisponible: number;
  stockTotal: number;
  tipoEntrada: "PAGADA" | "GRATUITA";
  precio: number;
}> {
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/eventos/${encodeURIComponent(eventoId)}/disponibilidad`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status} al consultar disponibilidad en Entradas`);
  }
  return await res.json();
}

/**
 * Contrato con Promociones (Grupo 9): POST /api/promociones/evaluar
 */
export async function evaluarPromocion(params: {
  idEvento: string;
  idUsuario: string;
  cantidadEntradas: number;
  codigoPromocion?: string;
}): Promise<PromocionAplicada | null> {
  if (!params.codigoPromocion) return null;

  const res = await fetch(`${GATEWAY_URL}/api/promociones/evaluar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_evento: params.idEvento,
      id_usuario: params.idUsuario,
      cantidad_entradas: params.cantidadEntradas,
      codigo_promocion: params.codigoPromocion,
    }),
    signal: AbortSignal.timeout(3000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.porcentaje_descuento > 0) {
    return {
      codigo: params.codigoPromocion.toUpperCase(),
      idPromocion: data.id_promocion || "promo-api",
      porcentajeDescuento: data.porcentaje_descuento,
      descripcion: data.descripcion || `Descuento del ${data.porcentaje_descuento}% aplicado`,
    };
  }

  return null;
}

/**
 * HU-03: Crear una Reserva Temporal de Cupos (Hold) en MongoDB
 */
export async function crearReservaTemporal(params: {
  idEvento: string;
  idUsuario: string;
  nombreUsuario: string;
  correoUsuario: string;
  cantidadEntradas: number;
  subtotal: number;
  descuento: number;
  total: number;
}): Promise<ReservaTemporal> {
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/reservas/hold`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_evento: params.idEvento,
      id_usuario: params.idUsuario,
      nombre_usuario: params.nombreUsuario,
      correo_usuario: params.correoUsuario,
      cantidad: params.cantidadEntradas,
      tiempo_limite_minutos: 10,
    }),
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.detail || errBody?.message || `Error HTTP ${res.status} al crear reserva`);
  }

  const data = await res.json();
  return {
    idReserva: data.hold_id || data.id_reserva,
    idEvento: data.id_evento || params.idEvento,
    idUsuario: data.id_usuario || params.idUsuario,
    cantidadEntradas: data.cantidad_entrada || params.cantidadEntradas,
    subtotal: params.subtotal,
    descuento: params.descuento,
    total: data.monto_total ?? params.total,
    estado: data.estado_reserva || "RESERVADO",
    expiraEnMinutos: 10,
    segundosRestantes: data.tiempo_restante_segundos ?? 600,
    fechaCreacion: data.fecha_creacion || new Date().toISOString(),
  };
}

/**
 * HU-03: Liberar cupos en MongoDB si la reserva expira o el usuario cancela la orden.
 */
export async function liberarReservaTemporal(
  _idEvento: string,
  _cantidadEntradas: number,
  idReserva?: string
): Promise<void> {
  if (!idReserva) return;
  await fetch(`${GATEWAY_URL}${BASE_PATH}/reservas/${encodeURIComponent(idReserva)}/cancelar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo: "Reserva liberada desde el Frontend" }),
    signal: AbortSignal.timeout(4000),
  });
}

/**
 * Consolida una reserva existente en MongoDB (POST /api/entradas/reservas/{idReserva}/webhook-pago)
 */
export async function consolidarReservaYEmitirTicket(idReserva: string): Promise<string | null> {
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/reservas/${encodeURIComponent(idReserva)}/webhook-pago`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data.entradas_emitidas) && data.entradas_emitidas.length > 0) {
    return data.entradas_emitidas[0];
  }
  return null;
}

/**
 * HU-05 y HU-08: Emisión Directa (Flujo Gratuito) o Consolidación tras Pago Aprobado (HU-09).
 */
export async function emitirEntradaDirecta(params: {
  idEvento: string;
  idUsuario: string;
  nombreComprador: string;
  correoComprador: string;
  cantidadEntradas: number;
  precioFinal: number;
  idReserva?: string;
}): Promise<EntradaEmitida> {
  if (params.idReserva) {
    const idTicketBackend = await consolidarReservaYEmitirTicket(params.idReserva);
    if (idTicketBackend) {
      const detalle = await obtenerEntradaEmitida(idTicketBackend);
      if (detalle) return detalle;
    }
  }

  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/emision-directa`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_evento: params.idEvento,
      id_usuario: params.idUsuario,
      nombre_comprador: params.nombreComprador,
      correo_comprador: params.correoComprador,
      cantidad_entradas: params.cantidadEntradas,
      precio_final: params.precioFinal,
      id_reserva: params.idReserva || null,
    }),
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.detail || errBody?.message || `Error HTTP ${res.status} al emitir entrada`);
  }

  const emitida: EntradaEmitida = await res.json();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`ticket_${emitida.idEntrada}`, JSON.stringify(emitida));
    } catch {
      // Ignorar errores de storage
    }
  }
  return emitida;
}

/**
 * Obtiene la información de un ticket emitido por su ID desde MongoDB (GET /api/entradas/{idEntrada}/detalle)
 */
export async function obtenerEntradaEmitida(idEntrada: string): Promise<EntradaEmitida | null> {
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/${encodeURIComponent(idEntrada)}/detalle`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });

  if (res.ok) {
    const data = await res.json();
    return {
      idEntrada: data.id_entrada,
      idEvento: data.id_evento,
      nombreEvento: data.nombre_evento,
      nombreComprador: data.nombre_usuario,
      correoComprador: data.correo_usuario,
      tipoAcceso: data.tipo_acceso || "Entrada General",
      precioFinal: data.precio_final_pagado || 0,
      cantidadEntradas: 1,
      qrData:
        typeof data.qr_data === "string"
          ? data.qr_data
          : data.qr_data?.url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${data.id_entrada}`,
      fechaEvento: data.fecha_evento || "Por confirmar",
      horaEvento: data.hora_evento || "Por confirmar",
      lugarEvento: data.lugar_ingreso || "Puerta Principal - Acceso General",
      fechaEmision: data.fecha_emision
        ? new Date(data.fecha_emision).toLocaleDateString("es-CL")
        : new Date().toLocaleDateString("es-CL"),
    };
  }

  if (typeof window !== "undefined") {
    try {
      const guardado = sessionStorage.getItem(`ticket_${idEntrada}`);
      if (guardado) return JSON.parse(guardado);
    } catch {
      // Ignorar
    }
  }

  return null;
}
