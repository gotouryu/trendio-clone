import Link from "next/link";

/**
 * Terms of Service — Meta / TikTok App Review 要件
 * - TikTok: URL ownership verification 必須(=トップレベルアクセス可)
 * - メニュー navigation の奥に置かない直接アクセス可能な静的ページ
 */
export const metadata = {
  title: "Terms of Service | Karteia",
  description:
    "Karteia Terms of Service — operated by HelixPlus Inc. for Instagram and TikTok-integrated customer engagement.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen auth-bg py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Terms of Service / 利用規約
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
            1. Acceptance
          </h2>
          <p>
            By accessing or using Karteia (the &quot;Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree, do not
            use the Service. The Service is operated by HelixPlus Inc.
            (&quot;we&quot;, &quot;us&quot;).
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            2. Account
          </h2>
          <p>
            Karteia accounts are issued by the Operator. You must (a) provide
            accurate information, (b) keep your password confidential, (c) not
            share or transfer your account, and (d) be authorized to manage the
            Instagram / TikTok account you connect.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            3. Acceptable Use
          </h2>
          <p>You agree NOT to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Use the Service to violate any law, the Meta Platform Terms, the
              TikTok Developer Terms, or any third-party rights.
            </li>
            <li>
              Use the Service to send spam, harass commenters, or post deceptive
              content.
            </li>
            <li>
              Attempt to bypass rate limits, access tokens of other Users, or
              otherwise circumvent security controls.
            </li>
            <li>
              Use the Service for any purpose other than legitimate customer
              engagement and analytics for the connected business account.
            </li>
          </ul>

          <h2 className="font-semibold text-gray-900 text-base">
            4. SNS Account Connection
          </h2>
          <p>
            You authorize Karteia to access your Instagram / TikTok account via
            OAuth solely to provide the features you have enabled (comment
            retrieval, AI-assisted replies, insights). You may revoke access at
            any time from Settings or from the platform&apos;s Apps and Websites
            page. See our{" "}
            <Link href="/privacy" className="text-emerald-600 underline">
              Privacy Policy
            </Link>{" "}
            for data handling details.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            5. AI-Assisted Replies — Human in the Loop
          </h2>
          <p>
            Karteia&apos;s automatic reply mode generates draft responses using
            Anthropic Claude based on rules you configure. You are responsible
            for reviewing your auto-reply rules and the content of replies sent
            on your behalf. We strongly recommend the Human-in-the-Loop
            approach: the Service will never finalize sensitive matters
            (complaints, refunds, legal questions) automatically and routes them
            to manual review.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            6. Intellectual Property
          </h2>
          <p>
            The Service, including software, design, and content, is owned by
            HelixPlus Inc. You retain ownership of content you upload or
            generate. You grant us a non-exclusive, worldwide license to use
            such content solely to provide the Service.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            7. Fees
          </h2>
          <p>
            Pricing, billing, and refunds (if applicable) are described in your
            order form or invoice. Free trials may be offered subject to
            separate terms.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            8. Disclaimers
          </h2>
          <p>
            The Service is provided &quot;AS IS&quot; without warranty. We do
            not guarantee uninterrupted availability, accuracy of AI-generated
            content, or compatibility with future Meta / TikTok API changes.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            9. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, HelixPlus Inc.&apos;s total
            liability shall not exceed the fees you paid for the Service in the
            12 months prior to the event giving rise to the claim.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            10. Termination
          </h2>
          <p>
            We may suspend or terminate accounts that violate these Terms or the
            Meta / TikTok platform terms. Upon termination, we will delete
            associated data per the Privacy Policy.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            11. Changes
          </h2>
          <p>
            We may update these Terms. Material changes will be notified to
            Users at least 14 days in advance.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            12. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of Japan. Exclusive
            jurisdiction lies with the Tokyo District Court.
          </p>

          <h2 className="font-semibold text-gray-900 text-base">
            13. Contact
          </h2>
          <p>r.gotou@houzyu.com — HelixPlus Inc., Japan</p>
        </div>

        {/* ============== JAPANESE ============== */}
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4 pt-8 border-t border-gray-200">
          <h2 className="font-semibold text-gray-900 text-base">
            日本語版(参考)
          </h2>
          <p className="text-sm">
            英語版が正本となります。本日本語版は要約参考です。
          </p>

          <h3 className="font-semibold text-gray-900">第1条(同意)</h3>
          <p>
            本利用規約に同意した上で Karteia
            をご利用ください。本サービスは株式会社ヘリックスプラスが運営します。
          </p>

          <h3 className="font-semibold text-gray-900">第2条(アカウント)</h3>
          <p>
            アカウントは運営者から発行されます。パスワードの管理・アカウントの譲渡禁止・連携する
            SNS アカウントの管理権限を保有していることが必要です。
          </p>

          <h3 className="font-semibold text-gray-900">第3条(禁止事項)</h3>
          <p>
            法令違反、Meta Platform Terms 違反、TikTok Developer Terms
            違反、スパム送信、なりすまし、レート制限回避、他人のアクセストークンへの不正アクセスを禁止します。
          </p>

          <h3 className="font-semibold text-gray-900">
            第4条(SNS アカウント連携)
          </h3>
          <p>
            OAuth により Karteia が Instagram / TikTok
            の有効な機能のみアクセスすることを承諾するものとします。連携解除は
            Settings から、または各プラットフォームの「アプリと Web
            サイト」設定から可能です。
          </p>

          <h3 className="font-semibold text-gray-900">第5条(AI 返信案)</h3>
          <p>
            AI 自動応答はユーザーが設定したルールに従い動作します。送信内容の最終責任はユーザーにあります。クレーム・返金・法的事項などのセンシティブ案件は AI 単独で完結せず、必ず人手レビューを経る Human-in-the-Loop
            設計です。
          </p>

          <h3 className="font-semibold text-gray-900">第13条(連絡先)</h3>
          <p>r.gotou@houzyu.com</p>
        </div>

        <div className="mt-8 flex gap-6 text-sm">
          <Link
            href="/login"
            className="text-emerald-600 hover:text-emerald-700"
          >
            ← Back / 戻る
          </Link>
          <Link
            href="/privacy"
            className="text-emerald-600 hover:text-emerald-700"
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
