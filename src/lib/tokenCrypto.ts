/**
 * SNS access_token 暗号化ヘルパ(=H2 残対応)
 *
 * 設計:
 * - AES-256-GCM(=認証付き暗号、認証タグで改竄検知)
 * - 鍵は環境変数 TOKEN_ENCRYPTION_KEY(=hex 64 文字 / 32 バイト)から取得
 * - 暗号化文字列のフォーマット:`enc:v1:<base64(iv|ciphertext|authTag)>`
 *   - prefix が無ければ平文として扱う(=既存平文データの後方互換)
 * - 鍵未設定時:暗号化要求は throw(=本番投入前に必ず env 設定が必要)
 *
 * 利用箇所:
 * - 書き:src/app/api/auth/instagram/callback/route.ts、src/app/api/auth/tiktok/callback/route.ts
 * - 読み:src/app/api/instagram/insights/route.ts、src/app/api/tiktok/insights/route.ts
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENC_PREFIX = "enc:v1:";
const IV_BYTES = 12; // GCM 推奨
const TAG_BYTES = 16;
const KEY_BYTES = 32; // 256-bit

function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  // hex 64 文字を期待。それ以外は無効扱い。
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes / 256-bit)",
    );
  }
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== KEY_BYTES) {
    throw new Error("TOKEN_ENCRYPTION_KEY decoded length mismatch");
  }
  return buf;
}

export function hasTokenEncryption(): boolean {
  return !!process.env.TOKEN_ENCRYPTION_KEY;
}

/**
 * 平文 token を AES-256-GCM で暗号化し、`enc:v1:<base64>` 形式で返す。
 * 鍵未設定なら平文をそのまま返す(=開発時の利便性、本番では必ず env 設定)。
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext;
  // 既に暗号化済みなら二重暗号化しない(=冪等)
  if (plaintext.startsWith(ENC_PREFIX)) return plaintext;
  const key = getKey();
  if (!key) {
    // 鍵未設定 → 平文のまま保存(=本番投入前に必ず env を入れる前提)
    // console.warn でログに残し、運用者が気付けるようにする
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[tokenCrypto] TOKEN_ENCRYPTION_KEY not set in production — storing plaintext",
      );
    }
    return plaintext;
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, ct, tag]);
  return ENC_PREFIX + blob.toString("base64");
}

/**
 * `enc:v1:<base64>` を復号して平文 token を返す。
 * prefix が無ければ平文として扱う(=既存平文データ救済)。
 * 復号失敗時は throw(=改竄 or 鍵不一致)。
 */
export function decryptToken(stored: string): string {
  if (!stored) return stored;
  if (!stored.startsWith(ENC_PREFIX)) {
    // 平文(=既存データ or 鍵未設定で保存されたもの)
    return stored;
  }
  const key = getKey();
  if (!key) {
    throw new Error(
      "Encrypted token found but TOKEN_ENCRYPTION_KEY is not set",
    );
  }
  const blob = Buffer.from(stored.slice(ENC_PREFIX.length), "base64");
  if (blob.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted token blob too short");
  }
  const iv = blob.subarray(0, IV_BYTES);
  const tag = blob.subarray(blob.length - TAG_BYTES);
  const ct = blob.subarray(IV_BYTES, blob.length - TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
