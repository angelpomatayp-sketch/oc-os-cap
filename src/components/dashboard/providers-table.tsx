import type { ProviderSummary } from "@/modules/orders/types";
import { EmptyState } from "@/components/dashboard/empty-state";

export function ProvidersTable({ providers }: { providers: ProviderSummary[] }) {
  if (providers.length === 0) {
    return (
      <div className="table-card">
        <EmptyState
          title="No hay proveedores registrados"
          description="Cuando registres proveedores manualmente apareceran listados en esta tabla."
        />
      </div>
    );
  }

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Razon social</th>
            <th>RUC</th>
            <th>Contacto</th>
            <th>Correo</th>
            <th>Telefono</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id}>
              <td className="text-strong">{provider.businessName}</td>
              <td>{provider.ruc}</td>
              <td>{provider.contactName}</td>
              <td>{provider.email}</td>
              <td>{provider.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
