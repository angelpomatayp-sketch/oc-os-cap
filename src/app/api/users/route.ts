import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-crypto";
import { getUserRecords, getUsers, saveUserRecords } from "@/lib/local-db";
import type { AppUser, UserFormValues, UserRecord } from "@/modules/orders/types";

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
  return NextResponse.json(users);
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

  users.push(newUser);
  await saveUserRecords(users);

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
