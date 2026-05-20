import Link from "next/link";

/**
 * Privacy Policy — Meta / TikTok App Review 要件網羅版
 * - Meta: 取得データ・利用目的・第三者提供・保存期間・削除手順・連絡先 を必須記載
 * - TikTok: メニュー navigation の奥に隠さない直接 URL でアクセス可
 * - ページ全体を1ファイル静的レンダーで提供(=URL ownership verification 容易)
 */
export const metadata = {
  title: "Privacy Policy | Karteia",
  description:
    "Karteia (operated by HelixPlus Inc.) Privacy Policy — data we collect from Instagram and TikTok APIs, how we use it, retention, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen auth-bg py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Privacy Policy / プライバシーポリシー
        </h1>
        <p className="text-sm text-gray-500 mb-2">
          Last updated / 最終更新日: 2026-05-21
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Operator / 運営者: HelixPlus Inc.(株式会社ヘリックスプラス)
        </p>

        {/* ============== ENGLISH ============== */}
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4 mb-12">
          <h2 className="font-semibold text-gray-900 text-base">
            1. About Karteia
          </h2>
          <p>
            Karteia is a customer engagement platform that helps small-to-medium
            businesses respond to Instagram and TikTok comments, manage customer
            records, and analyze audience insights. Karteia is operated by{" "}
            <strong>HelixPlus Inc.</strong> (the &quot;Operator&quot;).
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            2. Data We Collect
          </h2>
          <p>
            We collect the following data only when a customer of Karteia
            (&quot;User&quot;) explicitly connects their Instagram or TikTok
            account through OAuth:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Account identifiers</strong>: Instagram Business Account
              ID, TikTok open_id, account display name, profile picture URL.
            </li>
            <li>
              <strong>Access tokens</strong>: short-lived and long-lived OAuth
              access tokens issued by Meta / TikTok, stored encrypted at rest.
            </li>
            <li>
              <strong>Comments</strong>: text, timestamp, commenter username and
              profile picture URL of comments posted to the User&apos;s
              Instagram media.
            </li>
            <li>
              <strong>Insights</strong>: account-level follower count,
              impressions, reach, follower demographics (gender / age range /
              region) — aggregated values only, no individual follower PII.
            </li>
            <li>
              <strong>Karteia account info</strong>: email, company name,
              encrypted password (hashed by Supabase Auth, never visible to
              Operator), login timestamps.
            </li>
          </ul>

          <h2 className="font-semibold text-gray-900 text-base">
            3. How We Use the Data
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Display the User&apos;s account insights and audience analytics on
              the Karteia dashboard.
            </li>
            <li>
              Generate AI-assisted reply drafts for incoming comments
              (processed by Anthropic Claude API; see Section 5).
            </li>
            <li>
              Maintain a customer record (CRM) of commenters who have interacted
              with the User&apos;s account.
            </li>
            <li>
              Detect and log automated replies (subject to User-defined rules)
              for audit purposes.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> use the data for advertising, profile
            building outside Karteia, resale, or any purpose unrelated to the
            features the User has enabled.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            4. Legal Basis
          </h2>
          <p>
            We process data on the basis of (a) the User&apos;s consent given at
            OAuth time, and (b) performance of the service contract.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            5. Third-Party Processors
          </h2>
          <p>
            We share data with the following third parties strictly for service
            delivery:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Meta Platforms, Inc.</strong> — provides the Instagram
              Graph API. Subject to Meta&apos;s data policies.
            </li>
            <li>
              <strong>TikTok Pte. Ltd.</strong> — provides the TikTok API.
              Subject to TikTok&apos;s data policies.
            </li>
            <li>
              <strong>Anthropic, PBC</strong> — operates the Claude AI API used
              to generate reply drafts. Only the specific comment text and the
              User&apos;s rule configuration are sent; no account identifiers
              are forwarded.
            </li>
            <li>
              <strong>Supabase Inc.</strong> — database and authentication
              infrastructure (Tokyo region).
            </li>
            <li>
              <strong>Vercel Inc.</strong> — application hosting.
            </li>
          </ul>
          <p>
            We do not sell personal data or share it with any third party for
            advertising purposes.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            6. Retention
          </h2>
          <p>
            We retain data for as long as the User maintains an active Karteia
            account. Upon account deletion or disconnection of a SNS account, we
            delete the associated access tokens immediately and other associated
            records within <strong>30 days</strong>. Aggregated, anonymized
            statistics may be retained indefinitely for service improvement.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            7. Your Rights — Data Deletion
          </h2>
          <p>
            You may request deletion of your data at any time by:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Disconnecting your Instagram / TikTok account in{" "}
              <em>Settings → SNS Connections → Disconnect</em>; or
            </li>
            <li>
              Deleting your Karteia account by contacting our support; or
            </li>
            <li>
              For Meta users: using Meta&apos;s &quot;Apps and Websites&quot;
              settings to revoke Karteia&apos;s access. Meta will notify our{" "}
              <strong>Data Deletion Callback</strong> at{" "}
              <code className="bg-gray-100 px-1 rounded">
                /api/meta/data-deletion
              </code>{" "}
              and we will delete all associated records within 30 days.
            </li>
          </ul>

          <h2 className="font-semibold text-gray-900 text-base">8. Security</h2>
          <p>
            Access tokens are stored encrypted at rest. Passwords are hashed by
            Supabase Auth (we never store or view plaintext passwords). All
            traffic is over HTTPS. Row-Level Security ensures Users can only
            access their own data.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            9. International Transfers
          </h2>
          <p>
            Data is primarily stored in Tokyo (Supabase ap-northeast-1).
            Third-party processors (Meta, TikTok, Anthropic, Vercel) may process
            data in their respective regions.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            10. Children
          </h2>
          <p>
            Karteia is not intended for children under 18 and we do not
            knowingly collect data from them.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            11. Changes
          </h2>
          <p>
            We will notify Users of material changes by email or in-app banner
            at least 14 days before they take effect.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">12. Contact</h2>
          <p>
            Privacy questions: <strong>r.gotou@houzyu.com</strong>
            <br />
            Postal: HelixPlus Inc., Japan
          </p>
        </div>

        {/* ============== JAPANESE ============== */}
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4 pt-8 border-t border-gray-200">
          <h2 className="font-semibold text-gray-900 text-base">
            日本語版(参考)
          </h2>

          <p className="text-sm">
            株式会社ヘリックスプラス(以下「当社」)が運営する Karteia
            サービスにおいて、Instagram および TikTok の API
            を通じて取得する情報・利用目的・保管期間・削除方法を以下に定めます。詳細は上記英語版が正本となります。
          </p>

          <h3 className="font-semibold text-gray-900">取得する情報</h3>
          <p>
            利用者が明示的に OAuth で連携した場合に限り、Instagram / TikTok
            のアカウント識別子、アクセストークン(暗号化保管)、投稿コメント本文と投稿者名・アバター URL、アカウント単位の集計インサイト(フォロワー数・属性・地域分布)を取得します。個別フォロワーの PII は取得しません。
          </p>

          <h3 className="font-semibold text-gray-900">利用目的</h3>
          <p>
            (1) ダッシュボードでのインサイト表示、(2) Claude API
            による返信案生成、(3) 顧客カルテへの自動登録、(4)
            自動応答ログの監査記録、に限り使用します。広告・第三者再販・本サービス機能外の利用は行いません。
          </p>

          <h3 className="font-semibold text-gray-900">第三者提供</h3>
          <p>
            Meta、TikTok、Anthropic(Claude API)、Supabase、Vercel
            の各業務委託先に対して、サービス提供に必要な範囲でのみデータ処理を委託します。広告目的の提供は一切ありません。
          </p>

          <h3 className="font-semibold text-gray-900">保管期間と削除</h3>
          <p>
            アカウント解除時、アクセストークンは即時、その他関連データは 30
            日以内に削除します。Meta の Apps &amp; Websites
            設定からアプリ削除した場合、当社の Data Deletion Callback
            (<code className="bg-gray-100 px-1 rounded">/api/meta/data-deletion</code>)
            が起動し同様に削除します。
          </p>

          <h3 className="font-semibold text-gray-900">問い合わせ</h3>
          <p>r.gotou@houzyu.com</p>
        </div>

        <Link
          href="/login"
          className="inline-block mt-8 text-sm text-emerald-600 hover:text-emerald-700"
        >
          ← Back / 戻る
        </Link>
      </div>
    </div>
  );
}
