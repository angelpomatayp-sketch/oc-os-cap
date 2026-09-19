import { OrdersManager } from "@/components/dashboard/orders-manager";
import { ProtectedPanel } from "@/components/protected-panel";
import { getCurrentUser } from "@/lib/auth";
import { getOrders, getProviders, getSettings } from "@/lib/local-db";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const [orders, providers, settings] = await Promise.all([
    getOrders(currentUser.role === "ADMIN" ? undefined : currentUser.id),
    getProviders(),
    getSettings(),
  ]);

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
