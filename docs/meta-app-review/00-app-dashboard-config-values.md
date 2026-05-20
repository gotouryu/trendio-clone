# Meta App Dashboard 入力値リスト(=Karteia)

App Dashboard の各セクションに **そのままコピペする値** を全て列挙。

## App > Settings > Basic

| 項目 | 値 |
|---|---|
| **Display Name** | `Karteia` |
| **App Domains** | `karteia.vercel.app` |
| **Contact Email** | `r.gotou@houzyu.com` |
| **Privacy Policy URL** | `https://karteia.vercel.app/privacy` |
| **Terms of Service URL** | `https://karteia.vercel.app/terms` |
| **User Data Deletion** | URL: `https://karteia.vercel.app/api/meta/data-deletion`(Callback URL モード) |
| **Category** | `Business and Pages` |
| **App Icon** | `public/app-icon-1024.png`(=1024×1024、Karteia ロゴ) |

## App > Settings > Advanced > Security

| 項目 | 値 |
|---|---|
| **Require App Secret** | ON |
| **Server IP allow list** | (空欄、Vercel の動的 IP のため未設定) |
| **Update Settings IP allow list** | (空欄) |

## Use Case: Instagram API with Instagram Login

Add → Instagram API with Instagram Login を選択。

### Permissions(=申請対象スコープ)

| Permission | Karteia 機能 | 申請理由 |
|---|---|---|
| `instagram_business_basic` | アカウント基本情報(=username, profile picture)取得 | お客様のIGアカウント基本情報を Karteia ダッシュボードに表示するため |
| `instagram_business_manage_comments` | コメント取得・自動返信 | 共P-01「無人受付」要件:お客様の投稿に付いたコメントをAIで自動応答するため |
| `instagram_business_manage_insights` | フォロワー数・属性・地域・リーチ取得 | お客様のSNS運用 KPI をダッシュボードで可視化するため |

### Business Login Settings

| 項目 | 値 |
|---|---|
| **OAuth Redirect URIs** | `https://karteia.vercel.app/api/auth/instagram/callback` |
| **Deauthorize Callback URL** | `https://karteia.vercel.app/api/meta/data-deletion`(=ユーザーが連携解除した時の通知先、同 endpoint で受ける) |
| **Data Deletion Request URL** | `https://karteia.vercel.app/api/meta/data-deletion` |
| **Embed Domains** | `karteia.vercel.app` |

## Webhooks(=リアルタイム化、本申請通過後に追加)

| Object | Field | Callback URL |
|---|---|---|
| Instagram | `comments` | `https://karteia.vercel.app/api/webhooks/instagram`(Phase 2 実装) |
| Instagram | `messages` | 同上(DM 機能申請後) |

## App Review > Test Users

App Reviewer に渡すテスト用認証情報(=Submission 入力欄に記載):

```
Karteia URL: https://karteia.vercel.app/login

[Reviewer Account]
Email:    reviewer@karteia.example
Password: <発行後ここに記載>
※会社名「Meta Reviewer」、フォロワー 100以上のテスト用Instagram プロアカウントを連携済の状態で渡す

[Admin Portal — optional, 申請には基本不要]
URL:      https://karteia.vercel.app/portal-helix-2026/login
Email:    r.gotou@houzyu.com
Password: <既存>
```

## Business Verification

ヘリックスプラスのビジネスマネージャ → Security Center > Business Verification:

| 必要書類 | 用途 |
|---|---|
| **法人登記簿謄本(=履歴事項全部証明書、3ヶ月以内発行)** | 法人実在性確認 |
| **代表者の本人確認書類**(=運転免許 or マイナンバーカード両面) | 代表者確認 |
| **会社の電話番号**(=代表電話、Meta が SMS or 通話で認証) | 連絡先確認 |
| **会社の銀行口座 or 公共料金請求書**(=住所確認) | 所在地確認 |

審査期間:【公式記載なし】= 数日〜2週間が一般的。
