/**
 * DM 本文の保存時暗号化モジュール
 * アルゴリズム: AES-256-GCM
 * 鍵: ENV の DM_ENCRYPTION_KEY (base64 encoded 32 bytes)
 * 保存形式: "<iv_hex>:<ciphertext_hex>:<authTag_hex>"
 *
 * ローテーション方針:
 *   - 鍵ローテーション時は新旧両鍵をENVに保持し、旧鍵で復号→新鍵で再暗号化するバッチを実行する。
 *   - バッチスクリプトは scripts/rotate-dm-key.ts に記述する。
 *   - ローテーション後、旧鍵はENVから削除する。
 *   - E2EEは初期リリース非対象であり、後日クライアント側鍵交換方式に切り替える設計予定。
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const raw = process.env.DM_ENCRYPTION_KEY;
  if (!raw) throw new Error("DM_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32)
    throw new Error("DM_ENCRYPTION_KEY must be 32 bytes (base64 encoded)");
  return buf;
}

export function encryptDmBody(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

export function decryptDmBody(stored: string): string {
  const key = getKey();
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted DM format");
  const [ivHex, ctHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const ct = Buffer.from(ctHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ct).toString("utf8") + decipher.final("utf8");
}
