import { GATEWAY_URL } from "@/lib/env";

const BASE_PATH = "/api/notificaciones";

// Sprint 1 — Estructura inicial del módulo de Notificaciones asociado a HU3
export type EstadoNotificacion = "NO_LEIDA" | "LEIDA" | "ELIMINADA";

export type TipoNotificacion =
  | "COMPRA"
  | "RECORDATORIO"
  | "EVENTO_CAMBIO"
  | "RECUPERACION_PASSWORD";

export type Notificacion = {
  id_notificacion: string;
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  datos: {
    idEvento?: string | number;
    nombreEvento?: string;
    fechaEvento?: string;
    horaEvento?: string;
    ubicacion?: string;
    enlaceEvento?: string;
    cantidadEntradas?: number;
    nuevoEstado?: string;
    [clave: string]: unknown;
  };
  fecha_emision: string;
  estado: EstadoNotificacion;
  fecha_lectura: string | null;
  fecha_eliminacion: string | null;
  intentos_envio: number;
  error_envio: string | null;
};

// Sprint 3 — HU1: Recibir correo de compra
export type SolicitudCompra = {
  usuarioId: string;
  titulo: string;
  mensaje: string;
  datos: Notificacion["datos"] & {
    idEvento: string | number;
    nombreEvento: string;
    fechaEvento: string;
    cantidadEntradas: number;
  };
};

// Sprint 4 — HU2: Recibir recordatorio del evento
export type SolicitudRecordatorio = {
  usuarioId: string;
  titulo: string;
  mensaje: string;
  datos: Notificacion["datos"] & {
    idEvento: string | number;
    nombreEvento: string;
    fechaEvento: string;
    horaEvento?: string;
    ubicacion?: string;
    enlaceEvento?: string;
  };
};

async function notificaciones_request<T>(
  atributo_ruta: string,
  atributo_opciones?: RequestInit
): Promise<T> {
  const respuesta = await fetch(`${GATEWAY_URL}${BASE_PATH}${atributo_ruta}`, {
    ...atributo_opciones,
    headers: {
      "Content-Type": "application/json",
      ...atributo_opciones?.headers,
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      "Error al conectar con el módulo de notificaciones a través del Gateway"
    );
  }

  return respuesta.json() as Promise<T>;
}

// Sprint 2 — HU3: Ver centro de notificaciones
export async function obtener_notificaciones(
  usuarioId: string,
  signal?: AbortSignal
): Promise<Notificacion[]> {
  const respuesta = await notificaciones_request<Notificacion[]>(
    `/?usuarioId=${encodeURIComponent(usuarioId)}`,
    { signal, cache: "no-store" }
  );

  return respuesta
    .filter((notificacion) => notificacion.estado !== "ELIMINADA")
    .sort(
      (notificacion_a, notificacion_b) =>
        new Date(notificacion_b.fecha_emision).getTime() -
        new Date(notificacion_a.fecha_emision).getTime()
    );
}

// Sprint 3 — HU1: Recibir correo de compra
// Usa la ruta POST / del backend; no existe una ruta /compras.
export function recibir_notificacion_compra(solicitud: SolicitudCompra) {
  return notificaciones_request<Notificacion>("/", {
    method: "POST",
    body: JSON.stringify({ ...solicitud, tipo: "COMPRA" }),
  });
}

// Sprint 4 — HU2: Recibir recordatorio del evento
// Usa la ruta POST / del backend; el backend controla el procesamiento programado.
export function recibir_recordatorio_evento(
  solicitud: SolicitudRecordatorio
) {
  return notificaciones_request<Notificacion>("/", {
    method: "POST",
    body: JSON.stringify({ ...solicitud, tipo: "RECORDATORIO" }),
  });
}

// Sprint 1 — Estructura inicial del módulo de Notificaciones asociado a HU3
export const sprints_notificaciones_implementados = {
  // Sprint 1 — Estructura inicial del módulo de Notificaciones asociado a HU3
  sprint_1_estructura_y_recepcion: "estructura_y_recepcion",
  // Sprint 2 — HU3: Ver centro de notificaciones
  sprint_2_ver_centro_de_notificaciones: "ver_centro_de_notificaciones",
  // Sprint 3 — HU1: Recibir correo de compra
  sprint_3_recibir_notificacion_de_compra: "recibir_notificacion_de_compra",
  // Sprint 4 — HU2: Recibir recordatorio del evento
  sprint_4_recibir_recordatorio_de_evento: "recibir_recordatorio_de_evento",
} as const;

// Sprints definidos como nombres solamente; todavía no tienen implementación.
export const sprints_notificaciones_definidos = {
  // Sprint 5 — HU4: Marcar notificaciones como leídas
  sprint_5_marcar_notificaciones_como_leidas: "marcar_notificaciones_como_leidas",
  // Sprint 6 — HU5: Borrar notificaciones
  sprint_6_borrar_notificaciones: "borrar_notificaciones",
  // Sprint 7 — HU6: Recibir notificación por cancelación o cambios de evento
  sprint_7_recibir_cambios_de_evento: "recibir_cambios_de_evento",
  // Sprint 8 — HU7: Enviar correo de recuperación de contraseña
  sprint_8_enviar_correo_recuperacion: "enviar_correo_recuperacion",
  // Sprint 9 — HU8: Enviar correo de creación de cuenta Staff
  sprint_9_enviar_correo_creacion_staff: "enviar_correo_creacion_staff",
} as const;

