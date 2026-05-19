import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen auth-bg py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">サポート</h1>
        <p className="text-sm text-gray-500 mb-8">
          ご質問・不具合報告はこちら
        </p>

        <div className="space-y-6 text-sm text-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">よくある質問</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Instagramアカウントが接続できない → Facebookビジネスアカウント連携を確認</li>
              <li>TikTokのデータが反映されない → 接続後24時間お待ちください</li>
              <li>AIコンテンツが生成されない → アカウント設定で言語を確認</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">お問い合わせ</h2>
            <p>
              support@example.com までメールでご連絡ください(=デモ用、本番運用時に実アドレスへ差し替え)。
            </p>
          </div>

          <p className="text-xs text-gray-500 pt-6 border-t border-gray-100">
            ※ このページは Trendio クローンのひな型です。
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
