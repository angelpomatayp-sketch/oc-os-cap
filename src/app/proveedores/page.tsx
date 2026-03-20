import { ProvidersManager } from "@/components/dashboard/providers-manager";
import { ProtectedPanel } from "@/components/protected-panel";
import { getProviders } from "@/lib/local-db";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <ProtectedPanel>
      <div className="stack">
        <ProvidersManager initialProviders={providers} />
      </div>
    </ProtectedPanel>
  );
}
