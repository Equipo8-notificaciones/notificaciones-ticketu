import { redirect } from "next/navigation";

// No existe un segundo administrador TITEC: las altas se hacen en Keycloak.
export default function ProvisionPage() {
  redirect("/auth/admin/login");
}
