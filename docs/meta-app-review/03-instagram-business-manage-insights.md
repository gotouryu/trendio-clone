# Permission: `instagram_business_manage_insights`

## English

### Use Case Detailed Description

Karteia provides a customer-understanding dashboard for small-to-medium
businesses that operate Instagram Business / Creator accounts. The dashboard
displays:

- Follower count, profile views, impressions, reach (account-level)
- Follower demographics: gender ratio, age group distribution, regional
  distribution (=aggregated values only, no individual PII)
- Best time-of-day for posting (derived from past engagement timing)
- 8-week trend of likes, comments, saves, and site clicks

This permission is required because account-level insights and audience
demographics are only accessible via the Instagram Graph API insights
endpoint with this scope.

### Step-by-step User Flow

1. The user logs in to Karteia.
2. Instagram is already connected (covered by `instagram_business_basic`).
3. The user navigates to the **Dashboard** (default landing page).
4. On dashboard load, Karteia calls:
   - `GET /{ig-user-id}/insights?metric=follower_count,profile_views,impressions,reach&period=day&since=...&until=...`
   - `GET /{ig-user-id}/insights?metric=audience_gender_age,audience_city&period=lifetime`
5. The dashboard renders KPI cards (follower count, profile views, etc.) and
   demographic charts (gender pie chart, region bar chart).
6. The user can switch the period (Last 7 / 30 / 90 days) which refetches with
   updated `since`/`until` parameters.
7. The user can click &quot;Export&quot; to download a CSV / PDF of the
   insights for offline analysis.

### Screencast Cue Sheet

| # | Time | Action | What to show |
|---|---|---|---|
| 1 | 0:00 | Login at Karteia with reviewer account | Dashboard loads |
| 2 | 0:10 | KPI cards show follower count, profile views, impressions, reach | Numbers populated from the test Instagram account |
| 3 | 0:20 | Scroll down to the &quot;Interaction Trend&quot; chart | 8-week trend with likes/comments/saves visible |
| 4 | 0:30 | Show &quot;Gender Ratio&quot; donut chart | F% / M% / Other% displayed |
| 5 | 0:40 | Show &quot;Customer Regions&quot; horizontal bar chart | Top regions with %  visible |
| 6 | 0:50 | Show &quot;Interaction Time of Day&quot; line chart | Hour-of-day distribution |
| 7 | 1:00 | Change period selector to &quot;Last 7 days&quot; | KPI values refresh |
| 8 | 1:15 | (Optional) Click &quot;Export&quot; → download CSV | CSV file with the same numbers |

Duration: ~1:30. Record in English UI.

### Endpoints Used

- `GET /{ig-user-id}/insights?metric=follower_count,profile_views,reach&period=day`
  (note: `impressions` is being deprecated, migrating to `views` per Meta
  Graph API Changelog v22.0+)
- `GET /{ig-user-id}/insights?metric=audience_gender_age,audience_city&period=lifetime`

### Prerequisites Disclosed to End Users

- The connected Instagram account must have **100+ followers** for follower
  count, online_followers, and demographic insights to return values
  (per Meta&apos;s policy on small-audience privacy).
- Karteia surfaces a banner in the dashboard if the connected account has
  fewer than 100 followers, explaining the limitation.

---

## 日本語

### Use Case 説明(日本語版)

Karteia ダッシュボードで以下を表示するため、`instagram_business_manage_insights` が必要です:

- アカウント単位のフォロワー数・プロフィールアクセス・リーチ・インプレッション
- フォロワー属性:性別比・年齢層・地域分布(=集計値のみ、個別フォロワーの PII は取得しない)
- 投稿に最適な時間帯(=過去エンゲージメントから導出)
- 過去8週間のいいね・コメント・保存・サイトクリック推移

【注意】100フォロワー未満のアカウントでは Meta の仕様によりフォロワー属性が取得不可。Karteia はその場合 UI バナーで制限を明示。
