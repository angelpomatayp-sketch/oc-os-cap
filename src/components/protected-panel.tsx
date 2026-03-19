import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";

export async function ProtectedPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
