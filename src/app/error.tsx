"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center auth-bg px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-lg w-full">
        <div className="text-5xl mb-3">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          エラーが発生しました
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          予期しないエラーが発生しました。再読み込みするか、しばらく時間を置いてからお試しください。
        </p>
        {error.message && (
          <pre className="bg-gray-50 text-xs text-gray-700 p-3 rounded-lg mb-4 overflow-x-auto whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
          >
            再試行
          </button>
          <a
            href="/dashboard"
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium text-center"
          >
            ダッシュボードへ
          </a>
        </div>
      </div>
    </div>
  );
}
