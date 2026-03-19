import type { DocumentSummary } from "@/modules/orders/types";
import { EmptyState } from "@/components/dashboard/empty-state";

const statusTone: Record<DocumentSummary["status"], string> = {
  Borrador: "status-pill status-pill--draft",
  "Pendiente de aprobacion": "status-pill status-pill--pending",
  Aprobado: "status-pill status-pill--approved",
  Emitido: "status-pill status-pill--issued",
  Anulado: "status-pill status-pill--cancelled",
};

export function DocumentsTable({ documents }: { documents: DocumentSummary[] }) {
  if (documents.length === 0) {
    return (
      <div className="table-card">
        <EmptyState
          title="No hay ordenes registradas"
          description="Cuando registres ordenes de compra u ordenes de servicio apareceran aqui."
        />
      </div>
    );
  }

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Proveedor</th>
            <th>Area</th>
            <th>Estado</th>
            <th>Moneda</th>
            <th>Total</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="text-strong">{document.code}</td>
              <td>
                <div>
                  <p className="text-strong">{document.providerName}</p>
                  <p className="text-muted">{document.requester}</p>
                </div>
              </td>
              <td>{document.area}</td>
              <td>
                <span className={statusTone[document.status]}>{document.status}</span>
              </td>
              <td>{document.currency}</td>
              <td className="text-strong">
                {document.currency === "PEN" ? "S/" : "$"} {document.totalAmount.toFixed(2)}
              </td>
              <td>{document.issueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
