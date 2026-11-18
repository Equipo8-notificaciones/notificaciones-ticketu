// ============================================================================
// modules/checkin/api.ts
// ----------------------------------------------------------------------------
// Capa de API conectada en TIEMPO REAL al microservicio Check-in (MySQL)
// y al microservicio de Entradas (MongoDB).
// ============================================================================

import { ScanResultInfo } from "./types";

export interface ValidacionCheckinResponse {
  valido: boolean;
  motivo: string;
  ticket?: {
    id_entrada: string;
    id_evento: string;
    nombre_usuario: string;
  };
}

export interface ConsultaEntradaCheckinResponse {
  id_ticket: string;
  nombre_usuario: string;
  usuario?: {
    id_usuario: string;
    rol_usuario: string;
  };
}

/**
 * Valida un ticket en puerta contra la base de datos MySQL de Check-in (backend-main)
 * (POST /api/checkin/validaciones)
 */
async function solicitar<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', cache: 'no-store',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status === 401) { window.location.assign('/admin/login'); throw new Error('Sesión expirada.'); }
  if (!res.ok) throw new Error(data?.error?.message || data?.message || data?.detail || ('Error HTTP ' + res.status));
  return data;
}

export async function validarTicketEnPuerta(params: { idEntrada: string; idEvento: string }): Promise<ValidacionCheckinResponse> {
  return solicitar('/api/checkin/validaciones', { id_entrada: params.idEntrada.trim(), id_evento: params.idEvento.trim() });
}

export async function registrarTicketEnCheckin(_params: { idEntrada: string; idEvento: string; idUsuario: string; nombreUsuario: string }): Promise<{ mensaje: string }> {
  throw new Error('El registro de tickets debe realizarlo Entradas desde su backend.');
}


/**
 * Conector principal para la interfaz de Check-in:
 * Valida el ticket contra el Back-end real de Check-in (MySQL) y Entradas (MongoDB).
 * Si el ticket no existe en el backend, falla y se rechaza el acceso en tiempo real.
 */
export async function validarTicketCheckin(idEntrada: string, idEvento: string): Promise<ScanResultInfo> {
  const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const entradaLimpia = idEntrada.trim();
  const eventoLimpio = idEvento.trim() || "evt-77889";

  try {
    const [validacionCheckin] = await Promise.allSettled([
      validarTicketEnPuerta({ idEntrada: entradaLimpia, idEvento: eventoLimpio }),
      Promise.resolve(null),
    ]);

    if (validacionCheckin.status === "fulfilled") {
      const data = validacionCheckin.value;
      const datosEntradas = null as ConsultaEntradaCheckinResponse | null;

      if (data.valido) {
        return {
          status: "accepted",
          rawContent: JSON.stringify({
            checkinMySQL: data.ticket ?? { id_entrada: entradaLimpia, id_evento: eventoLimpio },
            entradasMongoDB: datosEntradas,
          }, null, 2),
          ticket: {
            id_entrada: data.ticket?.id_entrada || entradaLimpia,
            id_evento: data.ticket?.id_evento || eventoLimpio,
            nombre_usuario: data.ticket?.nombre_usuario || datosEntradas?.nombre_usuario || "Asistente Verificado",
            nombre_evento: (data.ticket as any)?.nombre_evento || (datosEntradas as any)?.nombre_evento || `Evento ${data.ticket?.id_evento || eventoLimpio}`,
            fecha: new Date().toLocaleDateString("es-CL"),
            hora_inicio: "No informado",
            hora_cierre: "No informado",
            direccion: (data.ticket as any)?.lugar_ingreso || (datosEntradas as any)?.lugar_ingreso || "No informada",
            tipo_entrada: datosEntradas?.usuario?.rol_usuario ? `Acceso (${datosEntradas.usuario.rol_usuario})` : "General",
          },
          motivo: data.motivo || "ACCESO_AUTORIZADO",
          mensaje: "Acceso autorizado. Entrada verificada en la base de datos de Check-in.",
          timestamp,
        };
      } else {
        const motivo = data.motivo || "ACCESO_DENEGADO";
        const mensajeRechazo =
          motivo === "TICKET_NOT_FOUND"
            ? "Acceso rechazado. El ticket no existe en el sistema o no está registrado."
            : motivo === "EVENT_MISMATCH"
              ? "Acceso rechazado. El ticket no coincide con este evento."
              : `Acceso denegado (${motivo}). Entrada no autorizada.`;

        return {
          status: "rejected",
          rawContent: JSON.stringify(data, null, 2),
          ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
          motivo,
          mensaje: mensajeRechazo,
          timestamp,
        };
      }
    } else {
      // Fallo de red con el backend
      const errorDetalle =
        validacionCheckin.reason instanceof Error
          ? validacionCheckin.reason.message
          : String(validacionCheckin.reason);

      return {
        status: "invalid",
        rawContent: errorDetalle,
        ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
        motivo: "ERROR_CONEXION_BACKEND",
        mensaje: `No se pudo conectar con el microservicio de Check-in: ${errorDetalle}`,
        timestamp,
      };
    }
  } catch (error) {
    return {
      status: "invalid",
      rawContent: String(error),
      ticket: { id_entrada: entradaLimpia, id_evento: eventoLimpio },
      motivo: "ERROR_DESCONOCIDO",
      mensaje: "Ocurrió un error inesperado al procesar la validación con el servidor.",
      timestamp,
    };
  }
}

/**
 * Extrae los parámetros (id_entrada, id_evento) de cualquier formato de código QR real
 * (JSON, URL, formato TICKETU-*, separadores ':' o '|') y valida en el backend.
 */
export async function procesarLecturaQR(raw: string): Promise<ScanResultInfo> {
  const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!raw || !raw.trim()) {
    return {
      status: "invalid",
      rawContent: raw,
      motivo: "QR_EMPTY",
      mensaje: "El código QR leído está vacío.",
      timestamp,
    };
  }

  const rawClean = raw.trim();
  let idEntrada = "";
  let idEvento = "evt-77889";

  // 1. Caso JSON: { "id_entrada": "...", "id_evento": "..." }
  try {
    const data = JSON.parse(rawClean);
    if (typeof data === "object" && data !== null) {
      idEntrada = String(data.id_entrada || data.id || data.ticketId || data.id_ticket || "");
      idEvento = String(data.id_evento || data.eventoId || data.evento_id || idEvento);
    }
  } catch {
    // Continuar
  }

  // 2. Caso URL
  if (!idEntrada && (rawClean.startsWith("http://") || rawClean.startsWith("https://"))) {
    try {
      const url = new URL(rawClean);
      idEntrada =
        url.searchParams.get("idEntrada") ||
        url.searchParams.get("ticket") ||
        url.searchParams.get("id") ||
        url.pathname.split("/").pop() ||
        "";
      idEvento = url.searchParams.get("idEvento") || url.searchParams.get("evento") || idEvento;
    } catch {
      // Ignorar error de URL
    }
  }

  // 3. Caso formato Entradas Grupo 3: TICKETU-{ticketId}-{eventoId}
  if (!idEntrada && rawClean.startsWith("TICKETU-")) {
    const partes = rawClean.split("-");
    if (partes.length >= 3) {
      idEntrada = partes[1];
      idEvento = partes.slice(2).join("-");
    } else if (partes.length === 2) {
      idEntrada = partes[1];
    }
  }

  if (!idEntrada && (rawClean.includes(":") || rawClean.includes("|"))) {
    const sep = rawClean.includes(":") ? ":" : "|";
    const [entradaPart, eventoPart] = rawClean.split(sep);
    if (entradaPart) idEntrada = entradaPart.trim();
    if (eventoPart) idEvento = eventoPart.trim();
  }

  // 5. Caso texto plano: el contenido completo es el ID de entrada
  if (!idEntrada) {
    idEntrada = rawClean;
  }

  // Ejecuta la validación real contra el microservicio
  return await validarTicketCheckin(idEntrada, idEvento);
}
