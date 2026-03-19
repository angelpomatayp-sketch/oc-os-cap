import { redirect } from "next/navigation";

import { SectionHeading } from "@/components/dashboard/section-heading";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProtectedPanel } from "@/components/protected-panel";
import { getCurrentUser } from "@/lib/auth";

export default async function ApprovalsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <ProtectedPanel>
      <div className="stack">
        <SectionHeading
          eyebrow="Aprobaciones"
          title="Aprobaciones"
          description="Revision de documentos pendientes."
        />

        <div className="panel">
          <EmptyState
            title="No hay documentos pendientes"
            description="Cuando existan ordenes enviadas a aprobacion se mostraran en este modulo."
          />
        </div>
      </div>
    </ProtectedPanel>
  );
}
