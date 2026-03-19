import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getProviders, saveProviders } from "@/lib/local-db";
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
  };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = normalizeProvider((await request.json()) as ProviderFormValues);
  const providers = await getProviders();

  const index = providers.findIndex((provider) => provider.id === id);

  if (index === -1) {
    return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
  }

  const duplicate = providers.find(
    (provider) => provider.ruc === payload.ruc && provider.id !== id,
  );

  if (duplicate) {
    return NextResponse.json(
      { message: "Ya existe otro proveedor con ese RUC." },
      { status: 409 },
    );
  }

  const updatedProvider: ProviderSummary = {
    id,
    ...payload,
  };

  providers[index] = updatedProvider;
  await saveProviders(providers);

  return NextResponse.json(updatedProvider);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const providers = await getProviders();
  const nextProviders = providers.filter((provider) => provider.id !== id);

  if (nextProviders.length === providers.length) {
    return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
  }

  await saveProviders(nextProviders);
  return NextResponse.json({ ok: true });
}
