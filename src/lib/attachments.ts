import "server-only";

import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ATTACHMENTS_DIR = process.env.ATTACHMENTS_DIR ?? "/app/storage/attachments";

export type SavedAttachment = {
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
};

async function ensureDir() {
  await mkdir(ATTACHMENTS_DIR, { recursive: true });
}

export function getAttachmentPath(orderId: string, originalName: string) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(ATTACHMENTS_DIR, `${orderId}_${safeName}`);
}

export async function saveAttachment(
  orderId: string,
  file: File,
): Promise<SavedAttachment> {
  await ensureDir();
  const filePath = getAttachmentPath(orderId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    filePath,
    fileName: file.name,
    mimeType: file.type || "application/pdf",
    size: buffer.length,
  };
}

export async function removeAttachment(filePath: string) {
  if (!filePath) return;
  try {
    await stat(filePath);
  } catch {
    return;
  }
  await rm(filePath, { force: true });
}
