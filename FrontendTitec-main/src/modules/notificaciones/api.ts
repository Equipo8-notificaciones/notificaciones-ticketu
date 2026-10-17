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

export async function obtener_notificaciones(
  usuarioId: string,
  signal?: AbortSignal
): Promise<Notificacion[]> {
  const query = new URLSearchParams({ usuarioId });
  const res = await fetch(`${GATEWAY_URL}${BASE_PATH}?${query}`, { signal });
  if (!res.ok) {
    throw new Error("Error al obtener las notificaciones del usuario");
  }
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
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    throw new Error("No se pudo actualizar la notificación");
  }
}

export async function marcar_notificacion_leida(
  id_notificacion: string | number
): Promise<void> {
  await solicitar_actualizacion(
    `${GATEWAY_URL}${BASE_PATH}/${encodeURIComponent(String(id_notificacion))}/leida`,
    "POST"
  );
}

export async function marcar_todas_leidas(usuarioId: string): Promise<void> {
  await solicitar_actualizacion(
    `${GATEWAY_URL}${BASE_PATH}/marcar-todas-leidas`,
    "POST",
    { usuarioId }
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
