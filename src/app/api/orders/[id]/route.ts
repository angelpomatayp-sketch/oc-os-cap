import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { amountToWords, calculateOrderTotals } from "@/lib/order-calculations";
import {
  generateOrderCode,
  getOrders,
  getProviders,
  getSettings,
  getUsers,
  saveOrders,
} from "@/lib/local-db";
import type { OrderFormValues, OrderItem, OrderRecord } from "@/modules/orders/types";

function normalizeItems(items: OrderFormValues["items"] | undefined): OrderItem[] {
  return (items ?? [])
    .map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;

      return {
        id: item.id || crypto.randomUUID(),
        quantity,
        description: item.description.trim(),
        unitPrice,
        amount: Number((quantity * unitPrice).toFixed(2)),
      };
    })
    .filter((item) => item.description && item.quantity > 0);
}

function normalizeOrder(
  payload: OrderFormValues,
  settings: Awaited<ReturnType<typeof getSettings>>,
): OrderFormValues {
  const items = normalizeItems(payload.items);
  const totals = calculateOrderTotals(items, settings, payload.applyRetention);

  return {
    type: payload.type,
    userId: payload.userId,
    workUnit: payload.workUnit.trim(),
    providerId: payload.providerId,
    status: payload.status,
    currency: payload.currency,
    items,
    applyRetention: totals.applyRetention,
    totalAmount: totals.totalAmount,
    issueDate: payload.issueDate,
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
  const settings = await getSettings();
  const payload = normalizeOrder((await request.json()) as OrderFormValues, settings);
  const [orders, providers, users] = await Promise.all([
    getOrders(),
    getProviders(),
    getUsers(),
  ]);
  const totals = calculateOrderTotals(payload.items, settings, payload.applyRetention);

  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    return NextResponse.json({ message: "Orden no encontrada." }, { status: 404 });
  }

  const currentOrder = orders[index];

  if (currentUser.role !== "ADMIN" && currentOrder.userId !== currentUser.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  if (currentOrder.status !== "Borrador") {
    return NextResponse.json(
      { message: "Solo se pueden editar ordenes en borrador." },
      { status: 400 },
    );
  }

  if (payload.items.length === 0) {
    return NextResponse.json(
      { message: "Debes registrar al menos un item en la orden." },
      { status: 400 },
    );
  }

  const provider = providers.find((item) => item.id === payload.providerId);
  const user = users.find((item) => item.id === payload.userId);

  if (!provider) {
    return NextResponse.json({ message: "Proveedor no encontrado." }, { status: 404 });
  }

  if (!user || user.role === "ADMIN") {
    return NextResponse.json(
      { message: "Debes seleccionar un usuario de area valido." },
      { status: 404 },
    );
  }

  const updatedOrder: OrderRecord = {
    ...currentOrder,
    code: generateOrderCode(payload.type, user.role, payload.issueDate, orders, currentOrder.id),
    type: payload.type,
    area: user.role,
    userId: user.id,
    userName: user.name,
    workUnit: payload.workUnit,
    providerId: payload.providerId,
    providerName: provider.businessName,
    requester: user.name,
    status: payload.status,
    currency: payload.currency,
    items: payload.items,
    subtotalAmount: totals.subtotalAmount,
    igvAmount: totals.igvAmount,
    retentionAmount: totals.retentionAmount,
    payableAmount: totals.payableAmount,
    applyRetention: totals.applyRetention,
    amountInWords: amountToWords(totals.payableAmount, payload.currency),
    totalAmount: payload.totalAmount,
    issueDate: payload.issueDate,
  };

  orders[index] = updatedOrder;
  await saveOrders(orders);

  return NextResponse.json(updatedOrder);
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
  const orders = await getOrders();
  const targetOrder = orders.find((order) => order.id === id);

  if (!targetOrder) {
    return NextResponse.json({ message: "Orden no encontrada." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && targetOrder.userId !== currentUser.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const nextOrders = orders.filter((order) => order.id !== id);

  await saveOrders(nextOrders);
  return NextResponse.json({ ok: true });
}
