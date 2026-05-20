import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen auth-bg py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日:2026年5月19日</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900">取得する情報</h2>
          <p>
            メールアドレス・会社名、および Instagram / TikTok のアカウントID と API アクセストークン(ユーザーが明示的に接続した場合のみ)。
          </p>

          <h2 className="font-semibold text-gray-900">利用目的</h2>
          <p>
            本サービスの提供・分析機能・AIコンテンツ生成のために利用します。第三者への提供は行いません(=AI機能用に Anthropic Claude API への問い合わせ送信を除く)。
          </p>

          <h2 className="font-semibold text-gray-900">第三者提供</h2>
          <p>
            法令に基づく場合を除き、本人の同意なく第三者へ個人情報を提供しません。
          </p>

          <h2 className="font-semibold text-gray-900">保管期間</h2>
          <p>
            アカウント削除後、合理的な期間内に消去します。
          </p>

          <h2 className="font-semibold text-gray-900">お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは <Link href="/support" className="text-emerald-600">サポートページ</Link>からお願いします。
          </p>

          <p className="text-xs text-gray-500 pt-6 border-t border-gray-100">
            ※ 本ページは Karteiaのデモ用ひな型です。本番運用時は法務確認の上で正式なポリシーに置き換えてください。
          </p>
        </div>

        <Link
          href="/login"
          className="inline-block mt-8 text-sm text-emerald-600 hover:text-emerald-700"
        >
          ← 戻る
        </Link>
      </div>
    </div>
  );
}
