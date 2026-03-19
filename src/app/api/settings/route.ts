import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/local-db";
import type { SystemSettings } from "@/modules/orders/types";

function normalizeSettings(payload: SystemSettings): SystemSettings {
  return {
    companyName: payload.companyName.trim(),
    companyRuc: payload.companyRuc.trim(),
    companyAddress: payload.companyAddress.trim(),
    companyContact: payload.companyContact.trim(),
    companyEmail: payload.companyEmail.trim(),
    companyPhone: payload.companyPhone.trim(),
    companyCell: payload.companyCell.trim(),
    igvRate: Number(payload.igvRate) || 0,
    retentionRate: Number(payload.retentionRate) || 0,
    retentionEnabled: Boolean(payload.retentionEnabled),
    retentionThreshold: Number(payload.retentionThreshold) || 0,
  };
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const payload = normalizeSettings((await request.json()) as SystemSettings);
  await saveSettings(payload);

  return NextResponse.json(payload);
}
