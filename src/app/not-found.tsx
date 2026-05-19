import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center auth-bg px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="text-6xl font-bold text-emerald-500 mb-2">404</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          ページが見つかりません
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          お探しのページは削除されたか、URLが変更された可能性があります。
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}
