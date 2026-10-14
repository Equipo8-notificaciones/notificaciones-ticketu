// ============================================================================
// modules/notificaciones/api.ts
// ----------------------------------------------------------------------------
// Todas las llamadas de este módulo pasan por el API Gateway, nunca
// directo al microservicio de notificaciones. El Gateway es quien enruta
// internamente la petición al servicio correcto según el path.
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
  return res.json();
}

async function solicitar_actualizacion(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("No se pudo actualizar la notificación");
  }
}

export async function marcar_notificacion_leida(
  id_notificacion: string | number
): Promise<void> {
  await solicitar_actualizacion(
    `${GATEWAY_URL}${BASE_PATH}/${encodeURIComponent(String(id_notificacion))}`,
    { estado: "leida" }
  );
}

export async function marcar_todas_leidas(usuarioId: string): Promise<void> {
  await solicitar_actualizacion(`${GATEWAY_URL}${BASE_PATH}/marcar-leidas`, {
    usuarioId,
  });
}

export async function eliminar_notificaciones(
  usuarioId: string,
  ids_notificacion: Array<string | number>
): Promise<void> {
  await solicitar_actualizacion(`${GATEWAY_URL}${BASE_PATH}/eliminar`, {
    usuarioId,
    ids_notificacion,
    estado: "eliminada",
  });
}
