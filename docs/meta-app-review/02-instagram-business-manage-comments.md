# Permission: `instagram_business_manage_comments`

## English

### Use Case Detailed Description

Karteia provides an &quot;Unattended Reception&quot; feature (in Japanese: 無人受付)
that automatically responds to comments left on the connected Instagram
account&apos;s media posts. Small businesses operating SNS accounts often miss
incoming customer inquiries posted as comments. Karteia uses
`instagram_business_manage_comments` to:

1. **Read comments** from the user&apos;s media via
   `GET /{ig-media-id}/comments` and surface them in the Comments tab.
2. **Generate AI-assisted reply drafts** using Anthropic Claude (with
   safeguards: never finalize complaints, refunds, or legal matters
   automatically — Human-in-the-Loop).
3. **Post replies** via `POST /{ig-comment-id}/replies` either:
   - automatically, based on rules the user configures (FAQ matching,
     out-of-business-hours templates); or
   - after the user manually reviews and approves the draft.
4. **Optionally hide** spam or harmful comments via `POST /{ig-comment-id}` with
   `hide=true` to keep the brand&apos;s comment section clean.

The user controls all behavior through the Auto-Reply Rules in Settings:
business hours, FAQ keyword-reply pairs, NG-word block list, and a default
template.

### Step-by-step User Flow

1. The user logs in and connects Instagram (prerequisite covered by
   `instagram_business_basic`).
2. The user navigates to **Settings → Auto-Reply Rule Settings** and configures:
   - Business hours (e.g., Mon-Fri 09:00-18:00)
   - FAQ patterns (keyword → reply text)
   - NG-words (block list)
   - Default out-of-hours template
3. The user goes to **Comments** in the sidebar. Karteia calls
   `GET /{ig-user-id}/media` then `GET /{ig-media-id}/comments` to fetch
   recent comments.
4. For each comment, Karteia shows:
   - the commenter&apos;s @username and avatar (from
     `from{username,profile_picture_url}` field),
   - the comment text and timestamp,
   - sentiment, status, and the AI-generated reply draft.
5. The user can:
   - Click **&quot;Generate AI Reply&quot;** to call `/api/ai-reply` which uses
     Claude to draft a reply.
   - Click **&quot;Reply&quot;** to send the draft via
     `POST /{ig-comment-id}/replies`.
6. If Auto-Reply Mode is ON, Karteia&apos;s server-side worker processes new
   comments matching the rules and automatically posts replies, logging every
   action in `auto_reply_logs` (5-year retention for audit).

### Screencast Cue Sheet

| # | Time | Action | What to show |
|---|---|---|---|
| 1 | 0:00 | Login at Karteia | Dashboard with connected Instagram |
| 2 | 0:10 | Click &quot;Account Settings&quot; → scroll to &quot;Auto-Reply Rule Settings&quot; | Business hours + FAQ + NG words + default template editor visible |
| 3 | 0:25 | Add an FAQ pattern: keyword `business hours` → reply `Our hours are 10:00-18:00. DM us for details.` Save. | Toast: &quot;Auto-reply rules saved&quot; |
| 4 | 0:35 | Click sidebar &quot;Comments&quot; | List of comments loaded from Instagram |
| 5 | 0:45 | Show a real comment from the test IG account asking about business hours | Comment displayed with commenter avatar/username |
| 6 | 0:55 | Click &quot;Generate AI Reply&quot; on that comment | Loading spinner → AI-drafted reply appears |
| 7 | 1:05 | Edit the draft slightly, click &quot;Reply&quot; | Toast: &quot;Reply sent&quot; |
| 8 | 1:10 | Switch to Instagram.com or the IG mobile app, open the same post | The reply is visible under the comment on Instagram |
| 9 | 1:25 | Back in Karteia, click &quot;Auto-Reply Mode&quot; switch to ON | Toast: &quot;Auto-reply mode turned ON&quot; |
| 10 | 1:35 | Post a new test comment from another IG account on the same media (=can be pre-recorded) | Karteia auto-replies within seconds |
| 11 | 1:50 | Click &quot;Auto-Reply Logs&quot; tab | Log entry showing the automatic reply with trigger reason &quot;faq_match&quot; |

Duration: ~2:00. Record in English UI.

### Endpoints Used

- `GET /{ig-user-id}/media?fields=id,caption,media_type,permalink,timestamp`
- `GET /{ig-media-id}/comments?fields=id,text,timestamp,from{username,profile_picture_url}`
- `POST /{ig-comment-id}/replies?message=...`
- `POST /{ig-comment-id}?hide=true` (for moderation, optional)
- Webhook subscription on `comments` field (Phase 2)

---

## 日本語

### Use Case 説明(日本語版)

Karteia の中核機能「無人受付」(=IT導入補助金 共P-01 要件)を実現するため、`instagram_business_manage_comments` が必要です。

1. お客様の IG 投稿に付いたコメントを取得し、Karteia の Comments タブで一覧表示
2. Anthropic Claude を使った AI 返信案を生成(=Human-in-the-Loop 設計、クレーム・返金・法的事項は自動完結禁止)
3. ユーザー定義ルール(=営業時間外応答・FAQ マッチ・NGワード遮断)に基づき自動返信、または手動承認後に送信
4. 必要に応じてスパム的コメントを非表示化

すべての挙動は Settings の Auto-Reply Rules でユーザーが完全制御します(=営業時間・FAQ・NGワード・デフォルトテンプレ)。
