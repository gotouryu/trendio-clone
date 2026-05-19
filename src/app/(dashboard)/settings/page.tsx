"use client";

import { useState, useEffect } from "react";
import { Pencil, RefreshCw, Link2, Instagram, Lightbulb, Check } from "lucide-react";
import { getSession } from "@/lib/authClient";

export default function SettingsPage() {
  const [language, setLanguage] = useState("ja");
  const [companyName, setCompanyName] = useState("サンプル");
  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState(companyName);
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [tiktokConnected, setTiktokConnected] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setCompanyName(session.companyName);
      setEditingName(session.companyName);
    }
  }, []);

  function saveCompany() {
    setCompanyName(editingName);
    setEditing(false);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">アカウント設定</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        SNSアカウントの接続と設定を管理する
      </p>

      {/* Language */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">言語</h2>
        <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Language</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Select your preferred language
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      {/* Company Info */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          会社情報
        </h2>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Company / Organization Name
              </div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={saveCompany}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditingName(companyName);
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-900">
                  {companyName}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                サイドバーに表示される名前です
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SNS Connections */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          SNSアカウント接続
        </h2>

        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-3">
          <div className="flex items-center gap-4">
            <div className="ig-icon-bg w-12 h-12 rounded-xl flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Instagram</span>
                {instagramConnected && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">
                    Connected
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Followers: ・ Last sync:
              </div>
            </div>
            {instagramConnected ? (
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync
                </button>
                <button
                  onClick={() => setInstagramConnected(false)}
                  className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setInstagramConnected(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="tt-icon-bg w-12 h-12 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">TikTok</span>
                {tiktokConnected && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">
                    Connected
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                TikTok Businessアカウントを接続する
              </div>
            </div>
            {tiktokConnected ? (
              <button
                onClick={() => setTiktokConnected(false)}
                className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => setTiktokConnected(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Connection Tips */}
      <section className="mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Connection Tips
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>InstagramはFacebookビジネスアカウントと連携している必要があります</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>TikTokはビジネスまたはクリエイターアカウントが必要です</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>データの同期は接続後最大24時間かかる場合があります</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
