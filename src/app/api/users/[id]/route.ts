import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-crypto";
import { getOrders, getUserRecords, saveUserRecords } from "@/lib/local-db";
import type { AppUser, UserFormValues, UserRecord } from "@/modules/orders/types";

function normalizeUser(payload: UserFormValues): UserFormValues {
  return {
    name: payload.name.trim(),
    role: payload.role,
    email: payload.email.trim(),
    password: payload.password,
  };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const payload = normalizeUser((await request.json()) as UserFormValues);
  const users = await getUserRecords();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
  }

  const duplicate = users.find((user) => user.email === payload.email && user.id !== id);

  if (duplicate) {
    return NextResponse.json(
      { message: "Ya existe otro usuario con ese correo." },
      { status: 409 },
    );
  }

  if (payload.password && payload.password.length < 8) {
    return NextResponse.json(
      { message: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const updatedUser: UserRecord = {
    id,
    name: payload.name,
    role: payload.role,
    email: payload.email,
    passwordHash:
      payload.password && payload.password.length >= 8
        ? hashPassword(payload.password)
        : users[index].passwordHash,
  };

  users[index] = updatedUser;
  await saveUserRecords(users);

  return NextResponse.json({
    id: updatedUser.id,
    name: updatedUser.name,
    role: updatedUser.role,
    email: updatedUser.email,
  } satisfies AppUser);
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
  const [users, orders] = await Promise.all([getUserRecords(), getOrders()]);

  if (orders.some((order) => order.userId === id)) {
    return NextResponse.json(
      { message: "No puedes eliminar un usuario con ordenes registradas." },
      { status: 400 },
    );
  }

  const nextUsers = users.filter((user) => user.id !== id);

  if (nextUsers.length === users.length) {
    return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 });
  }

  await saveUserRecords(nextUsers);
  return NextResponse.json({ ok: true });
}
