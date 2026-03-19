import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { verifyPassword } from "@/lib/auth-crypto";
import { getUserRecords } from "@/lib/local-db";
import type { AppUser, UserRecord } from "@/modules/orders/types";

const SESSION_COOKIE = "coti_cap_session";
const AUTH_SECRET = process.env.AUTH_SECRET ?? "coti-cap-dev-secret";

function publicUser(user: UserRecord): AppUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
  };
}

function signValue(value: string) {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("hex");
}

function encodeSession(userId: string) {
  return `${userId}.${signValue(userId)}`;
}

function decodeSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [userId, signature] = value.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expected = signValue(userId);

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  return userId;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;
  const userId = decodeSession(sessionValue);

  if (!userId) {
    return null;
  }

  const users = await getUserRecords();
  const user = users.find((item) => item.id === userId);

  return user ? publicUser(user) : null;
}

export async function authenticateUser(email: string, password: string) {
  const users = await getUserRecords();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return publicUser(user);
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
