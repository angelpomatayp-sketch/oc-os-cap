import { NextResponse } from "next/server";

import { authenticateUser, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = payload.email?.trim() ?? "";
    const password = payload.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Correo y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { message: "Credenciales invalidas." },
        { status: 401 },
      );
    }

    await createSession(user.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Login error", error);

    return NextResponse.json(
      { message: "Error interno al iniciar sesion." },
      { status: 500 },
    );
  }
}
