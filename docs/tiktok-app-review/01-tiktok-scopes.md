# TikTok 申請スコープごとの Use Case + 台本

## 1. `user.info.basic` + `user.info.profile`

### Use Case (English)
Karteia displays the connected TikTok account&apos;s username, avatar, and
verification status in the sidebar so users can confirm which account they are
managing. Without `user.info.basic`, Karteia cannot identify the connected
account.

### Use Case (日本語)
連携した TikTok アカウントのユーザー名・アバター・認証バッジを Karteia
サイドバーに表示するため必要。

### Screencast 台本
1. 0:00 Karteia にログイン → Settings → SNS Connections
2. 0:10 TikTok の Connect ボタンをクリック
3. 0:15 TikTok の OAuth 同意画面が表示
4. 0:25 Reviewer の TikTok テストアカウントで承認
5. 0:35 Karteia に戻り、Settings に「TikTok Connected」表示
6. 0:45 サイドバーに TikTok username が表示される

---

## 2. `user.info.stats`

### Use Case (English)
Karteia&apos;s Dashboard shows the connected TikTok account&apos;s
follower_count, following_count, likes_count, and video_count as KPI cards.
This lets the business owner monitor account growth alongside Instagram metrics
in one place.

### Use Case (日本語)
Karteia ダッシュボードに TikTok のフォロワー数・フォロー数・累計いいね・動画数
を KPI カードで表示し、Instagram と並べた SNS 統合分析を提供。

### Screencast 台本
1. 0:00 Karteia ログイン → Dashboard
2. 0:10 TikTok 統計セクションが KPI カードで表示
3. 0:20 フォロワー数・累計いいね数・動画数が連携した TikTok アカウントの実数値で表示されていることを確認
4. 0:30 (任意)TikTok.com で同じアカウントを開き、数値が一致することを確認

---

## 3. `video.list`

### Use Case (English)
Karteia retrieves the user&apos;s public video list with engagement metrics
(view_count, like_count, comment_count, share_count) to render a video
performance ranking. This helps the business owner identify top-performing
content and improve future posts.

### Use Case (日本語)
ユーザーの公開動画一覧と各動画のエンゲージメント指標(再生数・いいね数・コメント数・シェア数)を取得し、Karteia ダッシュボードで動画パフォーマンス
ランキングを表示。

### Screencast 台本
1. 0:00 Karteia → Dashboard → TikTok セクション
2. 0:10 「動画パフォーマンス」エリアに最新動画リストが表示
3. 0:20 各動画行に view_count / like_count / comment_count / share_count
   の数値が表示されていることを示す
4. 0:30 ソート機能で view_count 降順に並び替えて、上位動画を確認

---

## 共通注意

- スクリーンキャストは **英語UI**(=Settings → Language → English)
- TikTok 公式 OAuth dialog は **英語の場合と各言語の場合がある**(=TikTok 側の設定)
- 各動画 **50MB 以下**、最大 5本提出可
- 撮影 Sandbox 環境推奨(=Production 切替前)
- ドメインは申請 URL と一致(=`karteia.vercel.app`)

## 落ちやすい理由 上位

1. **Privacy Policy / ToS URL 所有権未検証**(2024-09-09 以降のアプリで頻発)→ HTML meta タグ or テキストファイルで verify
2. **Privacy Policy がメニュー navigation の奥**にある → 直接 `https://karteia.vercel.app/privacy` でアクセス可能、リンクをログイン画面フッターに配置(=Karteia は対応済)
3. **デモビデオで全スコープ表示不足** → 3スコープ別動画を提出
4. **ビデオドメインと申請 URL 不一致** → 全動画 `karteia.vercel.app` で撮影
5. **App description が開発中・テスト段階を示唆** → 「Karteia is a customer engagement platform」(現在形)で記述
