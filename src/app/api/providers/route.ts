import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createProvider, getProviders } from "@/lib/local-db";
import type { ProviderFormValues, ProviderSummary } from "@/modules/orders/types";

function normalizeProvider(payload: ProviderFormValues): ProviderFormValues {
  return {
    businessName: payload.businessName.trim(),
    ruc: payload.ruc.trim(),
    fiscalAddress: payload.fiscalAddress.trim(),
    contactName: payload.contactName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    bankName: payload.bankName.trim(),
    bankAccount: payload.bankAccount.trim(),
    bankCci: payload.bankCci.trim(),
    detraccionAccount: payload.detraccionAccount.trim(),
    isRetentionAgent: Boolean(payload.isRetentionAgent),
  };
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const providers = await getProviders();
  return NextResponse.json(providers);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const payload = normalizeProvider((await request.json()) as ProviderFormValues);

  if (!payload.businessName || !payload.ruc) {
    return NextResponse.json(
      { message: "La razon social y el RUC son obligatorios." },
      { status: 400 },
    );
  }

  const providers = await getProviders();

  if (providers.some((provider) => provider.ruc === payload.ruc)) {
    return NextResponse.json(
      { message: "Ya existe un proveedor con ese RUC." },
      { status: 409 },
    );
  }

  const newProvider: ProviderSummary = {
    id: crypto.randomUUID(),
    ...payload,
  };

  await createProvider(newProvider);

  return NextResponse.json(newProvider, { status: 201 });
}
