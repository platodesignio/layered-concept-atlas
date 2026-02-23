import { encryptDmBody, decryptDmBody } from "../lib/crypto/dm";

// Set test encryption key (32 bytes base64)
process.env.DM_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64");

describe("DM encryption", () => {
  test("encrypt and decrypt roundtrip", () => {
    const plaintext = "こんにちは、これはテストメッセージです。";
    const encrypted = encryptDmBody(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(":")).toHaveLength(3);
    const decrypted = decryptDmBody(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test("different encryptions of same plaintext produce different ciphertext", () => {
    const plaintext = "test message";
    const enc1 = encryptDmBody(plaintext);
    const enc2 = encryptDmBody(plaintext);
    expect(enc1).not.toBe(enc2); // different IVs
    expect(decryptDmBody(enc1)).toBe(plaintext);
    expect(decryptDmBody(enc2)).toBe(plaintext);
  });

  test("tampered ciphertext throws", () => {
    const encrypted = encryptDmBody("test");
    const parts = encrypted.split(":");
    parts[1] = "deadbeef" + parts[1].slice(8);
    expect(() => decryptDmBody(parts.join(":"))).toThrow();
  });
});
