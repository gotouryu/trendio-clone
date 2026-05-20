# TikTok for Developers Dashboard 入力値リスト(=Karteia)

## App > Basic Information

| 項目 | 値 |
|---|---|
| **App Name** | `Karteia`(=ソーシャル系名称参照禁止、ブランド名のみ) |
| **App Icon** | `public/app-icon-1024.png`(=1024×1024) |
| **App Description** | `Karteia is a customer engagement platform for small-to-medium businesses operating TikTok Business or Creator accounts. It provides audience analytics (follower count, likes, video performance) and helps owners understand their audience to improve content strategy. Comment auto-reply features are not requested for TikTok.` |
| **Category** | `Productivity` または `Business` |
| **Platforms** | `Web` |
| **Website URL** | `https://karteia.vercel.app` |

## App > Privacy & Terms

| 項目 | 値 |
|---|---|
| **Privacy Policy URL** | `https://karteia.vercel.app/privacy`(=トップアクセス可、メニュー navigation の奥に置かない) |
| **Terms of Service URL** | `https://karteia.vercel.app/terms` |
| **URL Ownership Verification** | TikTok の指定する HTML meta タグまたは TXT ファイルで verification(=本ファイル末尾の検証手順参照) |

## App > Login Kit / Display API Settings

| 項目 | 値 |
|---|---|
| **Redirect URI** | `https://karteia.vercel.app/api/auth/tiktok/callback` |
| **Web Domain Verified** | `karteia.vercel.app` |

## 申請するスコープ(=3つ、コメント機能は申請しない)

| Scope | Karteia 機能 | Justification |
|---|---|---|
| `user.info.basic` | OpenID, avatar, display_name | 接続したTikTokアカウントの基本情報をダッシュボード サイドバーに表示するため |
| `user.info.stats` | followers, following, likes, video count | お客様の TikTok アカウントの KPI を Karteia ダッシュボードに表示するため |
| `video.list` | 公開動画の一覧と各動画の view/like/comment/share count | お客様の動画パフォーマンスを Karteia ダッシュボードで可視化するため |

⚠️ **コメント取得・返信 API は TikTok 公式に存在しない**ため、Karteia の TikTok 連携は「インサイト+動画分析」のみに絞り、コメント自動応答機能は Instagram 専用と明示する。

## URL Ownership Verification 手順(=TikTok 必須)

TikTok Dashboard で Privacy / Terms URL を入力すると、TikTok が以下のいずれかを要求:

### Option A: HTML meta タグ
```html
<meta name="tiktok-developers-site-verification" content="<TikTok から提示されるトークン>" />
```
を `https://karteia.vercel.app/` の `<head>` に追加。

### Option B: ファイルアップロード
TikTok が指定するファイル名(例:`tiktok-developers-verification.txt`)を
`public/` 配下に置き、`https://karteia.vercel.app/tiktok-developers-verification.txt`
で 200 OK で返るようにする。

→ **TikTok から具体的トークンを受け取った段階で、ドビーがコード反映 + push する**。
