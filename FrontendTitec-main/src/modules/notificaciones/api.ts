// ============================================================================
// modules/notificaciones/api.ts
// ----------------------------------------------------------------------------
// Este módulo usa el API Gateway igual que el resto de la aplicación.
// ============================================================================

import { GATEWAY_URL } from "@/lib/env";

const BASE_PATH = "/api/notificaciones";

export type Notificacion = {
  id_notificacion: string | number;
  tipo: string;
  titulo: string;
  mensaje: string;
  estado: "no_leida" | "leida" | "eliminada";
  fecha_emision: string;
  datos: Record<string, unknown>;
};

function verificar_respuesta(res: Response, mensaje_error: string): void {
  if (res.status === 401) {
    window.location.assign("/login");
    throw new Error("La sesión expiró. Inicia sesión nuevamente.");
  }
  if (res.status === 403) {
    throw new Error("No tienes permiso para acceder a estas notificaciones.");
  }
  if (res.status === 503) {
    throw new Error("El servicio de notificaciones no está disponible temporalmente.");
  }
  if (!res.ok) {
    throw new Error(mensaje_error);
  }
}

export async function obtener_notificaciones(signal?: AbortSignal): Promise<Notificacion[]> {
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}`, {
    signal,
    credentials: "include",
  });
  verificar_respuesta(res, "Error al obtener las notificaciones del usuario");
  const notificaciones = (await res.json()) as Notificacion[];
  return notificaciones.map((notificacion) => ({
    ...notificacion,
    estado: notificacion.estado.toLowerCase() as Notificacion["estado"],
  }));
}

async function solicitar_actualizacion(
  url: string,
  method: "POST" | "DELETE",
  body?: unknown
): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  verificar_respuesta(res, "No se pudo actualizar la notificación");
}

export async function marcar_notificacion_leida(
  id_notificacion: string | number
): Promise<void> {
  await solicitar_actualizacion(
    `${GATEWAY_URL}${BASE_PATH}/${encodeURIComponent(String(id_notificacion))}/leida`,
    "POST"
  );
}

export async function marcar_todas_leidas(): Promise<void> {
  await solicitar_actualizacion(
    `${GATEWAY_URL}${BASE_PATH}/marcar-todas-leidas`,
    "POST"
  );
}

export async function eliminar_notificaciones(
  ids_notificacion: Array<string | number>
): Promise<void> {
  await Promise.all(
    ids_notificacion.map((id_notificacion) =>
      solicitar_actualizacion(
        `${GATEWAY_URL}${BASE_PATH}/${encodeURIComponent(String(id_notificacion))}`,
        "DELETE"
      )
    )
  );
}
