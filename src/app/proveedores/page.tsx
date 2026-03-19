import { ProvidersManager } from "@/components/dashboard/providers-manager";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { ProtectedPanel } from "@/components/protected-panel";
import { getProviders } from "@/lib/local-db";

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <ProtectedPanel>
      <div className="stack">
        <SectionHeading
          eyebrow="Proveedores"
          title="Catalogo maestro de proveedores"
          description="Gestion y consulta de proveedores registrados."
        />

        <ProvidersManager initialProviders={providers} />
      </div>
    </ProtectedPanel>
  );
}
