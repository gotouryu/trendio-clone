import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen auth-bg py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">利用規約</h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日:2026年5月19日</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <h2 className="font-semibold text-gray-900">第1条(適用)</h2>
          <p>
            本規約は、Karteia(以下「本サービス」)の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
          </p>

          <h2 className="font-semibold text-gray-900">第2条(アカウント)</h2>
          <p>
            ユーザーは正確な情報でアカウントを登録し、第三者に譲渡してはなりません。
          </p>

          <h2 className="font-semibold text-gray-900">第3条(禁止事項)</h2>
          <p>
            法令違反、他者への迷惑行為、本サービスの運営妨害を禁止します。
          </p>

          <h2 className="font-semibold text-gray-900">第4条(免責)</h2>
          <p>
            本サービスは現状有姿で提供され、運営者は損害について一切の責任を負いません。
          </p>

          <h2 className="font-semibold text-gray-900">第5条(変更)</h2>
          <p>
            本規約は予告なく変更される場合があります。
          </p>

          <p className="text-xs text-gray-500 pt-6 border-t border-gray-100">
            ※ 本ページは Karteiaのデモ用ひな型です。本番運用時は法務確認の上で正式な利用規約に置き換えてください。
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
