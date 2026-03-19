import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hashBuffer = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (hashBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, storedBuffer);
}
