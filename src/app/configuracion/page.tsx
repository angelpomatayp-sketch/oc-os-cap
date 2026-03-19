import { redirect } from "next/navigation";

import { SettingsManager } from "@/components/dashboard/settings-manager";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { ProtectedPanel } from "@/components/protected-panel";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/local-db";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  const settings = await getSettings();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <ProtectedPanel>
      <div className="stack">
        <SectionHeading
          eyebrow="Configuracion"
          title="Configuracion"
          description="Parametros generales de empresa e impuestos."
        />

        <SettingsManager initialSettings={settings} currentUser={currentUser} />
      </div>
    </ProtectedPanel>
  );
}
