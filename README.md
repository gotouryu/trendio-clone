# Trendio Clone — SNS運用効率化プラットフォーム

Instagram・TikTok の分析、AIコンテンツ生成、トレンド発見、コメント管理を一元化する SaaS のクローン実装。

## 技術スタック

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Chart.js + react-chartjs-2**
- **Supabase** (PostgreSQL + Auth)
- **Anthropic Claude API** (Sonnet 4.6)
- **Instagram Graph API** (Meta)
- **TikTok for Developers API**
- **Vercel** (本番ホスティング)

## ローカル起動

```bash
npm install
cp .env.example .env.local   # 環境変数を埋める(全部未設定でもMock応答で動作)
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く → `/login` にリダイレクト → 任意のメール・パスワードで Sign In(=ローカルストレージ仮認証)。

## 環境変数

`.env.example` を参照。APIキーが未設定の場合:

| 機能 | 未設定時の挙動 |
|---|---|
| Supabase | localStorage で仮セッション(=本番不可だがUI確認OK) |
| Claude API | `/api/ai-content` / `/api/ai-report` が Mock JSON を返す |
| Instagram Graph API | `/api/instagram/insights` が `mockKPI` を返す |
| TikTok API | `/api/tiktok/insights` が 0 を返す |

## データベース

Supabase で `db/schema.sql` を SQL Editor から実行すると以下のテーブルが作成される(全テーブル RLS 有効):

- `profiles` — auth.users 拡張(会社名・言語)
- `sns_accounts` — Instagram/TikTok 接続トークン
- `analytics_snapshots` — 日次KPIロールアップ
- `ig_comments` — Instagramコメント+返信状態
- `saved_content_ideas` — AI生成コンテンツ保存
- `ai_reports` — AIインサイトレポート保存
- `trend_cache` — 業界別トレンド結果キャッシュ

## ディレクトリ構造

```
src/
├ app/
│  ├ (auth)/           # login, signup, forgot-password
│  ├ (dashboard)/      # dashboard, comments, discover-trends, ai-content, settings
│  ├ api/              # ai-content, ai-report, instagram/insights, tiktok/insights
│  ├ terms, privacy, support
│  ├ error.tsx         # エラーバウンダリ
│  ├ not-found.tsx     # 404
│  └ layout.tsx
├ components/
│  ├ Sidebar.tsx
│  └ charts/           # FollowerTrend / ActionTrend / GenderByPeriod / GenderDoughnut / FollowerRegion / PostTime
├ lib/
│  ├ env.ts            # 環境変数アクセス
│  ├ authClient.ts     # Supabase Auth ラッパ
│  ├ claudeClient.ts   # Anthropic SDK ラッパ(prompt cache対応)
│  ├ instagram.ts      # Graph API クライアント
│  ├ tiktok.ts         # TikTok API クライアント
│  ├ mockData.ts       # 開発・デモ用ダミー
│  ├ types.ts
│  └ supabase/         # client.ts / server.ts / middleware.ts
└ middleware.ts        # Supabase セッション更新(Next.js 16 では proxy へ移行予定)
```

## デプロイ

1. GitHub にプッシュ
2. Vercel で New Project → リポジトリ選択
3. 環境変数(=`.env.example`の中身)を Vercel Dashboard に登録
4. Deploy

`vercel.json` で `hnd1`(東京)リージョン指定済み。

## 実装フェーズ

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | プロジェクト初期化 | ✅ |
| 1 | 認証UI(localStorage仮+Supabase Auth骨組み) | ✅ |
| 2 | ダッシュボードUI(Chart.js全種) | ✅ |
| 3 | Account Settings | ✅ |
| 4 | Comments / Discover Trends / AI Content UI | ✅ |
| 5 | Instagram Graph API 連携 | 🔧 骨組み完了。Meta App登録+トークン後にUI接続 |
| 6 | TikTok API 連携 | 🔧 骨組み完了。TikTok Developer登録後にUI接続 |
| 7 | AI Content (Claude API) | ✅ API Route 完成、Claude キー入手で即実AI生成 |
| 8 | AIレポート生成 | ✅ API Route 完成 |
| 9 | Vercel 本番デプロイ | ⏳ アカウント取得待ち |
