import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-crypto";
import { createUserRecord, getOrders, getUserRecords, getUsers } from "@/lib/local-db";
import type { AppUser, UserFormValues, UserRecord, UserSummary } from "@/modules/orders/types";

function normalizeUser(payload: UserFormValues): UserFormValues {
  return {
    name: payload.name.trim(),
    role: payload.role,
    email: payload.email.trim(),
    password: payload.password,
  };
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const users = await getUsers();
  const orders = await getOrders();
  const emitted = orders.filter((order) => order.status === "Emitido");

  const totalsByUser = new Map<string, UserSummary["totals"]>();
  for (const order of emitted) {
    const current =
      totalsByUser.get(order.userId) ?? {
        ocPen: 0,
        osPen: 0,
        ocUsd: 0,
        osUsd: 0,
      };
    const isOc = order.type === "OC";
    const isPen = order.currency === "PEN";
    if (isOc && isPen) current.ocPen += order.payableAmount;
    if (isOc && !isPen) current.ocUsd += order.payableAmount;
    if (!isOc && isPen) current.osPen += order.payableAmount;
    if (!isOc && !isPen) current.osUsd += order.payableAmount;
    totalsByUser.set(order.userId, current);
  }

  const response: UserSummary[] = users.map((user) => ({
    ...user,
    totals:
      totalsByUser.get(user.id) ?? { ocPen: 0, osPen: 0, ocUsd: 0, osUsd: 0 },
  }));

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const payload = normalizeUser((await request.json()) as UserFormValues);

  if (!payload.name || !payload.email) {
    return NextResponse.json(
      { message: "Nombre y correo son obligatorios." },
      { status: 400 },
    );
  }

  const users = await getUserRecords();

  if (users.some((user) => user.email === payload.email)) {
    return NextResponse.json(
      { message: "Ya existe un usuario con ese correo." },
      { status: 409 },
    );
  }

  if (!payload.password || payload.password.length < 8) {
    return NextResponse.json(
      { message: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    name: payload.name,
    role: payload.role,
    email: payload.email,
    passwordHash: hashPassword(payload.password),
  };

  await createUserRecord(newUser);

  return NextResponse.json(
    {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
    } satisfies AppUser,
    { status: 201 },
  );
}
