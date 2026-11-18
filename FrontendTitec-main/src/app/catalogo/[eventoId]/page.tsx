// Página de detalle de UN evento — GRUPO 2 (Catálogo)
//
// Acá se muestra la info del evento (nombre, fecha, promociones,
// entradas disponibles). El link/sección de reseñas vive en la
// subcarpeta ./resenas — ESE archivo es del Grupo 6, no lo editen.

import DetalleEventoPlaceholder from "@/modules/catalogo/components/DetalleEventoPlaceholder";
import ResenasPlaceholder from "@/modules/resenas/components/ResenasPlaceholder";

export const dynamic = "force-dynamic";

export default function DetalleEventoPage({
  params,
}: {
  params: { eventoId: string };
}) {
  return (
    <div>
      <DetalleEventoPlaceholder eventoId={params.eventoId} />
      <ResenasPlaceholder eventoId={params.eventoId} />
    </div>
  );
}
