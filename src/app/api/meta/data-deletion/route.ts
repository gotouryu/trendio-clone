/**
 * POST /api/meta/data-deletion
 *
 * Meta の Data Deletion Callback。
 * ユーザーが Facebook の「Apps and Websites」設定で Karteia を削除した時、
 * Meta が signed_request を本エンドポイントに POST する。
 *
 * 仕様:https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 *
 * 処理フロー:
 *   1. signed_request を SHA256-HMAC で検証(=META_APP_SECRET と照合)
 *   2. user_id(=Meta の app-scoped user id)を取り出す
 *   3. sns_accounts に該当する Karteia ユーザーを特定 → access_token を削除
 *      ※ 同じ Meta user が複数 Karteia アカウントに連携している場合、全部削除
 *   4. confirmation_code(=削除ジョブの追跡番号)を含む JSON を返却
 *
 * 検証:Meta App Dashboard の「Data Deletion Callback URL」に本ルートを設定すると、
 * 「Send Sample Request」ボタンでテスト可能。
 */
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

/** base64url → base64 変換(=Meta の signed_request は base64url 形式) */
function b64urlToB64(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/");
}

function decodeBase64Url(s: string): string {
  return Buffer.from(b64urlToB64(s), "base64").toString("utf8");
}

/**
 * Meta signed_request の検証 + payload 取り出し。
 * Format: <base64url signature>.<base64url payload>
 * Signature は HMAC-SHA256(payload, app_secret) を base64url
 */
function parseSignedRequest(
  signedRequest: string,
  appSecret: string,
): { user_id: string } | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  const [sigB64Url, payloadB64Url] = parts;

  const expectedSig = createHmac("sha256", appSecret)
    .update(payloadB64Url)
    .digest("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  // timing-safe 比較(=Phase 3 Wave-B 発見、`!==` はタイミング攻撃を許容)
  const a = Buffer.from(expectedSig);
  const b = Buffer.from(sigB64Url);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(payloadB64Url)) as {
      user_id?: string;
      algorithm?: string;
    };
    if (payload.algorithm !== "HMAC-SHA256") return null;
    if (!payload.user_id) return null;
    return { user_id: payload.user_id };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 6000) {
    return NextResponse.json(
      { error: "signed_request_too_large" },
      { status: 413 },
    );
  }

  const appSecret = env.metaAppSecret;
  if (!appSecret) {
    return NextResponse.json(
      { error: "meta_not_configured" },
      { status: 503 },
    );
  }

  // Meta は application/x-www-form-urlencoded で `signed_request=<...>` を POST
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }
  const signedRequest = form.get("signed_request");
  if (typeof signedRequest !== "string") {
    return NextResponse.json(
      { error: "signed_request_missing" },
      { status: 400 },
    );
  }
  if (signedRequest.length > 5000) {
    return NextResponse.json(
      { error: "signed_request_too_large" },
      { status: 413 },
    );
  }

  const parsed = parseSignedRequest(signedRequest, appSecret);
  if (!parsed) {
    return NextResponse.json(
      { error: "signed_request_invalid" },
      { status: 401 },
    );
  }

  const confirmationCode = randomUUID();

  // Service Role で Karteia 内の該当 SNS 連携を削除
  // (=RLS バイパス必須。Meta から送られてくる user_id は ASID (App-Scoped User ID))
  if (env.supabaseUrl && env.supabaseServiceRole) {
    const sb = createClient(env.supabaseUrl, env.supabaseServiceRole, {
      auth: { persistSession: false },
    });

    // Phase 3 Wave-B 修正:Meta は ASID(=App-Scoped User ID)を渡してくる。
    // sns_accounts には ig_user_id(=instagram_business_account.id)を保存しているが、
    // 新カラム `meta_asid` を併用して両方で照合する(=schema migration を Wave-E で追加)。
    // 当面は ig_user_id にも入っている可能性のあるパターンを試し、両方マッチで削除。
    await sb
      .from("sns_accounts")
      .delete()
      .eq("platform", "instagram")
      .or(
        `external_account_id.eq.${parsed.user_id},meta_asid.eq.${parsed.user_id}`,
      );

    // 監査用に削除リクエストを記録
    try {
      await sb.from("data_deletion_requests").insert({
        confirmation_code: confirmationCode,
        meta_user_id: parsed.user_id,
        requested_at: new Date().toISOString(),
      });
    } catch {
      // テーブル未作成は無視
    }
  }

  // Meta の仕様で必須:url + confirmation_code を JSON で返す
  // url はユーザーが削除状況を確認できるページ
  const statusUrl = `${env.appUrl}/privacy?deletion=${confirmationCode}`;
  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
}

/**
 * GET — App Dashboard で「Send Sample Request」テスト時にエンドポイントの
 * 存在確認に GET が来る場合がある。簡易応答。
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    purpose: "Meta Data Deletion Callback endpoint. POST signed_request here.",
  });
}
