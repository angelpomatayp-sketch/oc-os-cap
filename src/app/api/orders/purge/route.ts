import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deleteAllOrders } from "@/lib/local-db";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  await deleteAllOrders();
  return NextResponse.json({ ok: true });
}
