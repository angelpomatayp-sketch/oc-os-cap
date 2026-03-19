import { OrdersManager } from "@/components/dashboard/orders-manager";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { ProtectedPanel } from "@/components/protected-panel";
import { getCurrentUser } from "@/lib/auth";
import { getOrders, getProviders, getSettings } from "@/lib/local-db";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const currentUser = await getCurrentUser();
  const [orders, providers, settings] = await Promise.all([
    getOrders(),
    getProviders(),
    getSettings(),
  ]);

  if (!currentUser) {
    return null;
  }

  return (
    <ProtectedPanel>
      <div className="stack">
        <SectionHeading
          eyebrow="Ordenes"
          title="Ordenes de compra y servicio"
          description="Gestion y consulta de ordenes registradas."
        />

        <OrdersManager
          initialOrders={orders}
          initialProviders={providers}
          currentUser={currentUser}
          settings={settings}
        />
      </div>
    </ProtectedPanel>
  );
}
