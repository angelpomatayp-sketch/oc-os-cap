import { redirect } from "next/navigation";

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
        <UsersManager />
      </div>
    </ProtectedPanel>
  );
}
