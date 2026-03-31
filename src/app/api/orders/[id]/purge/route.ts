import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deleteOrderById, getOrderById } from "@/lib/local-db";

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

  await deleteOrderById(id);
  return NextResponse.json({ ok: true });
}
