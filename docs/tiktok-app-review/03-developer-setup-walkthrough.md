# TikTok Developer 開設 + App 作成 ウォークスルー(=龍さん向け)

各画面ごとに **クリックする場所** と **入力する値** を明示。

---

## STEP 1: 開発者アカウント開設

### 1-1. https://developers.tiktok.com/ にアクセス
**画面**:「開発者向けTikTok」トップ

→ 右上の **「Login」**(or 「Get Started」)をクリック

### 1-2. ログイン方式選択
3つの選択肢:
- TikTok アカウント
- Email
- Facebook / Apple アカウント

→ **TikTok アカウント** か **Email** を推奨(=Apple は後で連携面倒)
→ 龍さんの個人 TikTok アカウントでログイン
  (=会社アカウントでもOK、ただし継続管理しやすい個人推奨)

### 1-3. 開発者向け規約同意
- 「**TikTok for Developers Terms of Service**」を読んで「**I Agree**」
- メール確認(=Email 登録の場合)

### 1-4. 完了
「**Manage Apps**」画面に到達したら STEP 1 完了。
URL: `https://developers.tiktok.com/apps`

---

## STEP 2: Organization 登録(=任意だが推奨)

### 2-1. Profile → Organization
右上アバター → **「Profile」** → **「Organization」** タブ

→ 「**Create Organization**」

入力値:
- **Organization Name**: `HelixPlus Inc.`
- **Country**: Japan
- **Industry**: `Technology / SaaS`
- **Website**: `https://karteia.vercel.app`

→ 「**Submit**」

⚠️ Organization は必須ではないが、登録すると複数 App を統合管理可能 + Business Verification がスムーズ。

---

## STEP 3: Karteia App 作成

### 3-1. Manage Apps → 「Connect an app」
**画面**:Apps 一覧

→ 「**Connect an app**」 ボタン

### 3-2. App Information 入力

| フィールド | 入力値 |
|---|---|
| **App Name** | `Karteia`(=「TikTok」「Social」等の文言厳禁) |
| **Category** | `Business` |
| **Description** | docs/tiktok-app-review/00-app-dashboard-config-values.md の Description 全文 |
| **App Icon** | `~/Desktop/projects/trendio-clone/public/app-icon-1024.png` |
| **Platform** | `Web` |
| **Website URL** | `https://karteia.vercel.app` |
| **Terms of Service URL** | `https://karteia.vercel.app/terms` |
| **Privacy Policy URL** | `https://karteia.vercel.app/privacy` |

→ 「**Save**」 or 「**Submit**」

### 3-3. App Key 取得
作成成功後、Dashboard に **Client Key** と **Client Secret** が表示
→ これを後で Vercel env に登録:
- `TIKTOK_CLIENT_KEY=<Client Key>`
- `TIKTOK_CLIENT_SECRET=<Client Secret>`

---

## STEP 4: URL Ownership Verification(=2024-09-09 以降必須)

⚠️ **これを通さないと申請が確実に却下される**

### 4-1. URL properties 設定
App Dashboard → **「URL properties」**(=上部ボタン)

→ Production mode に切り替え

### 4-2. Domain 方式選択(=推奨)
- Privacy Policy URL: `https://karteia.vercel.app/privacy`
- Terms of Service URL: `https://karteia.vercel.app/terms`
- Redirect URI: `https://karteia.vercel.app/api/auth/tiktok/callback`

→ **Domain 方式** で `karteia.vercel.app` を verify

### 4-3. Verification token を受け取る
TikTok が以下のいずれかを要求:
- **HTML meta タグ**: `<meta name="tiktok-developers-site-verification" content="XXXX">`
- **テキストファイル**: `https://karteia.vercel.app/tiktok-developers-verification.txt`

→ ドビーに「TikTok から提示された verification token は **XXXX** です」と教えてください
→ ドビーが即時 Karteia コードに反映 + push で本番反映
→ TikTok 側 「Verify」 ボタンクリック → 検証完了

⚠️ DNS TXT 方式は **karteia.vercel.app** が Vercel ホスティングのため使えない(=Vercel DNS にレコード追加できない)。**HTML meta タグまたはファイル方式必須**

---

## STEP 5: Products 追加(=Login Kit + Display API のみ)

App Dashboard → 「**Products**」タブ

追加する Product:
- [x] **Login Kit**(=必須、user.info.basic 自動付与)
- [x] **Display API**(=user.info.stats, video.list)

**追加してはいけない Product:**
- [ ] ❌ **Content Posting API**(=Karteia は投稿しない、UX要件で却下確実)
- [ ] ❌ **Research API**(=学術研究者専用、商用却下確実)

→ 「**Add**」 → 「Save」

---

## STEP 6: Scopes 申請 + Submit

App Dashboard → 「**Scopes**」タブ

申請対象 3つ:
1. `user.info.basic`
2. `user.info.stats`
3. `video.list`

各 scope の「**Request access**」 → Justification 入力フォーム:

入力値は docs/tiktok-app-review/01-tiktok-scopes.md の各 Use Case English 文を貼り付け。

⚠️ Karteia の App Description に「コメント機能は TikTok API 対象外、Instagram 専用」と必ず明記。レビュアーが「video.list 取って何に使うのか」を疑問にしないよう先回り。

---

## STEP 7: Demo Video + Submit

App Review 画面で:
- **Demo Video**(.mp4、各50MB以下、最大5本)アップロード
- **Test Account**(=Karteia reviewer credentials)記入

→ 「**Submit for Review**」

---

## ⏱️ 想定スケジュール

| 段階 | 所要時間 |
|---|---|
| STEP 1 開発者アカウント | 5分 |
| STEP 2 Organization | 10分 |
| STEP 3 App 作成 | 10分 |
| STEP 4 URL ownership verification | 20分(=TikTok のtoken 待ち + ドビー反映) |
| STEP 5 Products 追加 | 5分 |
| STEP 6 Scopes 申請 | 15分 |
| STEP 7 Demo Video 撮影 + Submit | 30分(=撮影完了後) |
| TikTok Review 審査 | 数日〜2週間 |

→ **STEP 1〜5 は今日中に完了可能**

---

## 詰まったら

各 STEP で「画面が違う」「ボタンが見つからない」と感じたら、その画面のスクショを撮ってドビーに送ってください。Chrome MCP で同じページを開いて代行案内します。

特に **STEP 4 URL ownership verification の token 受け取り** はドビーが Karteia コードに反映する必要があるため、TikTok から提示されたら必ず教えてください。
