# Permission: `instagram_business_basic`

## English (= for Meta App Review submission)

### Use Case Detailed Description

Karteia is a customer engagement platform for small-to-medium businesses that
operate Instagram Business or Creator accounts. To display the connected
account&apos;s basic profile (username, profile picture, business category) on
the Karteia dashboard, we need to read the Instagram User node fields.

After the user completes OAuth and consents, Karteia stores the Instagram
Business Account ID and a long-lived access token. We call
`GET /{ig-user-id}?fields=username,profile_picture_url,name,biography,website`
once per session to refresh the cached profile and render it in the sidebar and
greeting header (&quot;Welcome back, @username&quot;).

This permission is fundamental to identifying which account the user has
connected. Without it, Karteia cannot personalize the dashboard or
contextualize the comments and insights features.

### Step-by-step User Flow

1. The user signs up for a Karteia account via the admin portal (admin issues
   ID/PW).
2. The user logs in at `https://karteia.vercel.app/login`.
3. The user navigates to **Settings → SNS Account Connections**.
4. The user clicks the **&quot;Connect&quot;** button next to Instagram. This
   triggers `GET /api/auth/instagram/start` which redirects to Meta&apos;s OAuth
   dialog.
5. Meta&apos;s OAuth dialog prompts the user to authenticate with Facebook and
   consent to the requested permissions.
6. Upon approval, Meta redirects back to
   `https://karteia.vercel.app/api/auth/instagram/callback?code=...&state=...`.
7. Karteia exchanges the code for a long-lived access token.
8. Karteia calls `me/accounts` then resolves the Instagram Business Account
   linked to the user&apos;s Facebook Page.
9. Karteia calls `GET /{ig-user-id}?fields=username,profile_picture_url,name`
   to fetch the basic profile and stores it in `sns_accounts.display_name`.
10. The dashboard now displays the connected account profile in the sidebar.

### Screencast Cue Sheet (= 録画台本、英語UIで実演)

| # | Time | Action | What to show |
|---|---|---|---|
| 1 | 0:00 | Open `https://karteia.vercel.app/login` | Karteia login page (English UI) |
| 2 | 0:05 | Enter reviewer credentials, click &quot;Login&quot; | Successful login → Dashboard |
| 3 | 0:15 | Click sidebar &quot;Account Settings&quot; | Settings page loads |
| 4 | 0:20 | Scroll to &quot;SNS Account Connections&quot; section | Instagram row visible (not connected) |
| 5 | 0:25 | Click the &quot;Connect&quot; button on the Instagram row | Browser navigates to Facebook OAuth dialog |
| 6 | 0:35 | Authenticate with Facebook (=reviewer&apos;s test FB account) | Meta consent screen showing `instagram_business_basic` permission |
| 7 | 0:50 | Approve the permission | Browser redirects back to `/settings?connected=instagram` |
| 8 | 0:55 | Show the &quot;Instagram connected&quot; toast | Connected status visible |
| 9 | 1:00 | Click sidebar &quot;Dashboard&quot; | Dashboard shows the connected account&apos;s username + profile picture in the greeting header |
| 10 | 1:10 | (Optional) Show the username matches the Instagram account on instagram.com | Visual confirmation |

Duration: ~1:15. Record in English UI (Settings → Language → English).

---

## 日本語(=ドビーが申請文起草用に保存)

### Use Case 説明(日本語版)

Karteia は中小企業の Instagram Business / Creator アカウントを対象とした顧客対応プラットフォームです。連携した IG アカウントの基本プロフィール(ユーザー名・プロフィール画像・カテゴリ)を Karteia ダッシュボードに表示するため、Instagram User ノードを取得する権限が必要です。OAuth 完了後、`/{ig-user-id}?fields=username,profile_picture_url` で基本情報を取得し、サイドバーと挨拶ヘッダー(=「お疲れさまです、@username さん」)に表示します。この権限なしでは、どのアカウントが接続されたかをユーザーに示せず、コメント・インサイト機能の文脈化もできません。

### 提出時メモ

- スクリーンキャストの **言語**:英語UI(=Settings の Language で English 選択後に撮影)
- **必須シーン**:Karteia ログイン→Settings→Connect ボタン→Facebook OAuth→許可→戻りトースト→Dashboard の username 表示
- 所要:約 1分15秒
