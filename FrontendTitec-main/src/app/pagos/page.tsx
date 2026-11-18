import { Suspense } from "react";
import CheckoutPage from "@/modules/pagos/components/CheckoutPage";

// Página de "Pagos" — GRUPO 4
//
// Checkout del módulo de Pagos. Entradas redirige aquí desde el modal de la reserva:
//   /pagos?idReserva=<hold_id>&total=<monto>&cantidad=<n>
// y Pagos verifica esa reserva con Entradas (a través del API Gateway) antes de cobrar.
// También acepta /pagos?id_pago=<id> para retomar un pago ya creado.
// Toda la lógica vive en src/modules/pagos/.
//
// useSearchParams (lectura de la URL) necesita un límite de Suspense en Next.js.

export default function PagosPage() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}
