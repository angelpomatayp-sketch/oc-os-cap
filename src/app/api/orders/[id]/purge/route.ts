import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deleteOrderById, getOrderById, clearOrderAttachment } from "@/lib/local-db";
import { removeAttachment } from "@/lib/attachments";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ message: "Orden no encontrada." }, { status: 404 });
  }

  if (order.attachmentPath) {
    await removeAttachment(order.attachmentPath);
  }

  await clearOrderAttachment(id);
  await deleteOrderById(id);
  return NextResponse.json({ ok: true });
}
