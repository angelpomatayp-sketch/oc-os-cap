import { OrdersManager } from "@/components/dashboard/orders-manager";
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
