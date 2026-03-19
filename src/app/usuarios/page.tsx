import { redirect } from "next/navigation";

import { SectionHeading } from "@/components/dashboard/section-heading";
import { UsersManager } from "@/components/dashboard/users-manager";
import { ProtectedPanel } from "@/components/protected-panel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <ProtectedPanel>
      <div className="stack">
        <SectionHeading
          eyebrow="Usuarios"
          title="Usuarios de registro"
          description="Administracion de usuarios internos que registran ordenes por area."
        />

        <UsersManager />
      </div>
    </ProtectedPanel>
  );
}
