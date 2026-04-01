import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";

import { getCurrentUser } from "@/lib/auth";
import { getOrderById, updateOrderAttachment, clearOrderAttachment } from "@/lib/local-db";
import { removeAttachment, saveAttachment } from "@/lib/attachments";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ message: "Orden no encontrada." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && order.userId !== currentUser.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Archivo inválido." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ message: "Solo se permite PDF." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "El PDF supera el tamaño permitido." }, { status: 400 });
  }

  if (order.attachmentPath) {
    await removeAttachment(order.attachmentPath);
  }

  const saved = await saveAttachment(order.id, file);
  await updateOrderAttachment(order.id, {
    path: saved.filePath,
    name: saved.fileName,
    mime: saved.mimeType,
    size: saved.size,
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ message: "Orden no encontrada." }, { status: 404 });
  }

  if (currentUser.role !== "ADMIN" && order.userId !== currentUser.id) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  if (!order.attachmentName) {
    return NextResponse.json({ message: "No hay archivo adjunto." }, { status: 404 });
  }

  const buffer = await readFile(order.attachmentPath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": order.attachmentMime || "application/pdf",
      "Content-Disposition": `inline; filename="${order.attachmentName}"`,
    },
  });
}

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
  return NextResponse.json({ ok: true });
}
