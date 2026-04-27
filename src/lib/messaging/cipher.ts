/**
 * Encryption seam for messaging. v1 stores plaintext (key_version=0) so the
 * surrounding product can ship; flipping on real client-side E2EE later is a
 * matter of swapping these two functions and adding a key publish step on
 * first login. Schema (body_ciphertext, iv, key_version columns) and the
 * user_keys table are already in place to make that drop-in.
 */

export type StoredMessageRow = {
  body_plaintext: string | null;
  body_ciphertext: string | Buffer | null;
  iv: string | Buffer | null;
  key_version: number;
};

export type EncryptedPayload = {
  body_plaintext: string | null;
  body_ciphertext: Buffer | null;
  iv: Buffer | null;
  key_version: number;
};

export async function encryptForStorage(
  plaintext: string
): Promise<EncryptedPayload> {
  return {
    body_plaintext: plaintext,
    body_ciphertext: null,
    iv: null,
    key_version: 0,
  };
}

export async function decryptFromStorage(
  row: StoredMessageRow
): Promise<string> {
  if (row.key_version === 0) {
    return row.body_plaintext ?? "";
  }
  // Future versions will derive a per-conversation symmetric key via ECDH and
  // AES-GCM-decrypt body_ciphertext using iv. Until that's wired up, render a
  // placeholder rather than leaking a stale plaintext fallback.
  return "(encrypted message — open in a supported client)";
}
