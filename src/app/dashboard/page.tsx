import { DocumentsTable } from "@/components/dashboard/documents-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { ProtectedPanel } from "@/components/protected-panel";
import { getCurrentUser } from "@/lib/auth";
import { getOrders, getProviders } from "@/lib/local-db";
import type { MetricCard as MetricCardType } from "@/modules/orders/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const [orders, providers] = await Promise.all([getOrders(), getProviders()]);
  const visibleOrders =
    !currentUser || currentUser.role === "ADMIN"
      ? orders
      : orders.filter((order) => order.userId === currentUser.id);
  const metrics: MetricCardType[] = [
    {
      label: "Proveedores activos",
      value: String(providers.length),
      helper: providers.length === 0 ? "Sin registros" : "Registros cargados",
      accent: "blue",
      icon: "PR",
    },
    {
      label: "Ordenes de compra",
      value: String(visibleOrders.filter((order) => order.type === "OC").length),
      helper: "Registros cargados",
      accent: "amber",
      icon: "OC",
    },
    {
      label: "Ordenes de servicio",
      value: String(visibleOrders.filter((order) => order.type === "OS").length),
      helper: "Registros cargados",
      accent: "green",
      icon: "OS",
    },
    {
      label: "Pendientes",
      value: String(
        visibleOrders.filter((order) => order.status === "Pendiente de aprobacion").length,
      ),
      helper: "Pendientes de revision",
      accent: "red",
      icon: "AP",
    },
  ];

  return (
    <ProtectedPanel>
      <div className="stack">
        <SectionHeading
          eyebrow="Dashboard"
          title="Dashboard"
          description="Resumen general del sistema."
        />

        <section className="metrics-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="stack">
          <div>
            <h3 className="subheading">Ordenes recientes</h3>
            <p className="subcopy">Listado de ordenes registradas.</p>
          </div>
          <DocumentsTable documents={visibleOrders.slice().reverse().slice(0, 8)} />
        </section>
      </div>
    </ProtectedPanel>
  );
}
