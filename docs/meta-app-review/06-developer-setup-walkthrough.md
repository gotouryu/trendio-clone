# Meta Developer 開設 + App 作成 ウォークスルー(=龍さん向け)

各画面ごとに **クリックする場所** と **入力する値** を明示。

---

## STEP 1: 開発者アカウント開設(=今ここ)

### 1-1. https://developers.facebook.com/ にアクセス済
**画面**:「ソーシャルテクノロジー | Meta」トップページ

→ 右上の **「開始する」**(=黒いボタン)をクリック

### 1-2. Facebook ログイン
画面遷移後、Facebook 個人アカウントでログインを求められる。
→ 龍さんの個人 Facebook で **「ログイン」**

⚠️ **注意**:Facebook の個人アカウントが必要。会社共有アカウントだと後で揉める可能性。**龍さん個人の Facebook** でログイン推奨。

### 1-3. 「アカウントを登録する」画面
- 「**I accept the Meta Platform Terms**」にチェック
- 「**I accept the Developer Policies**」にチェック
- **「Continue」** をクリック

### 1-4. 携帯電話番号 SMS 認証
- 携帯番号入力(=日本の場合 `+81` 国番号 + 先頭 0 を除く)
- 「**Send Code**」 → SMS に 6桁コード到着
- コード入力 → 「Verify」

### 1-5. 役割選択
- **「Developer」** を選択(=「Marketer」「Game Developer」等の中から)
- 「**Complete Registration**」

### 1-6. 完了
「**My Apps**」画面に到達したら STEP 1 完了。
URL は `https://developers.facebook.com/apps/` になっているはず。

---

## STEP 2: Business Manager 設定

⚠️ ここから **ヘリックスプラスのビジネスマネージャ** が必要。既に持っていれば 2-3 にスキップ。

### 2-1. Business Manager 確認 / 作成
`https://business.facebook.com/` にアクセス。

- 既存の Business Manager(=ヘリックスプラスの管理画面)があれば選択
- なければ「**Create Account**」で新規作成
  - Business Name: `HelixPlus Inc.` または `株式会社ヘリックスプラス`
  - Your Name: `Ryu Goto`
  - Business Email: `r.gotou@houzyu.com`

### 2-2. Business Verification 開始
Business Manager → **Security Center** → **Business Verification**

必要書類(=事前に用意):
- [ ] **法人登記簿謄本**(=履歴事項全部証明書、**3ヶ月以内発行**) — 法務局 or オンライン申請
- [ ] **代表者の本人確認書類**(=運転免許 or マイナンバーカード両面)
- [ ] **会社の電話番号**(=代表電話、Meta が SMS or 通話で認証)
- [ ] **会社の住所確認書類**(=公共料金請求書 or 銀行口座明細、3ヶ月以内)

審査期間:数日〜2週間。**Karteia App 作成と並行で進められる**ので、書類提出は STEP 3 と並行着手 OK。

### 2-3. Business Manager にアプリをリンク準備
STEP 3 で App 作成後、ここで App とビジネスをリンクする。

---

## STEP 3: Karteia App 作成

### 3-1. https://developers.facebook.com/apps/ で「Create App」
**画面**:右上に紫色の「Create App」ボタン

→ クリック

### 3-2. 「App Details」画面
- **App Name**: `Karteia`
- **App Contact Email**: `r.gotou@houzyu.com`
- **Business Portfolio**: 上で作成した HelixPlus Inc. を選択

→ 「**Next**」

### 3-3. 「Use Case」選択
複数選択肢が出る。Karteia は **「Other」** を選ぶ。
→ 「Next」

(=「Authenticate and request data from users with Facebook Login」を選ぶと自動で Facebook Login 設定が走るが、Karteia は Instagram Login 系のため Other を選び、後で個別追加する)

### 3-4. 「App Type」選択
- **「Business」** を選択

→ 「Next」 → 「Create App」

### 3-5. App Dashboard 着地
これで Karteia の App Dashboard が見える状態に。
**App ID**(=数字)が表示される → これを後で `META_APP_ID` として Vercel に登録する。

---

## STEP 4: App Dashboard 設定値入力

App Dashboard 左メニュー → 「**App settings → Basic**」

以下の値を入力:

| フィールド | 入力値 |
|---|---|
| Display Name | `Karteia` |
| App Domains | `karteia.vercel.app` |
| Contact Email | `r.gotou@houzyu.com` |
| **Privacy Policy URL** | `https://karteia.vercel.app/privacy` |
| **Terms of Service URL** | `https://karteia.vercel.app/terms` |
| **User Data Deletion** | 「URL」モードを選んで `https://karteia.vercel.app/api/meta/data-deletion` を入力 |
| **App Icon** | `~/Desktop/projects/trendio-clone/public/app-icon-1024.png` をアップロード |
| **Category** | `Business and Pages` |

→ 「**Save changes**」

### 4-1. App Secret 確認
同じ「Basic」画面下部に「App Secret」 → 「Show」 → コピー
- これを後で `META_APP_SECRET` として Vercel に登録(=口外厳禁)

### 4-2. Business Manager にリンク
App settings → Basic → **Business Account** セクション → 「Add to Business Portfolio」 → HelixPlus Inc. を選択

---

## STEP 5: Instagram API with Instagram Login 追加

App Dashboard → 左メニュー上部「**Add Products**」

→ 「**Instagram**」を探す → 「**Set up**」

→ 「**Instagram API with Instagram Login**」を選択(=「Instagram API with Facebook Login」じゃない方)

設定値:
| フィールド | 入力値 |
|---|---|
| **OAuth Redirect URIs** | `https://karteia.vercel.app/api/auth/instagram/callback` |
| **Deauthorize Callback URL** | `https://karteia.vercel.app/api/meta/data-deletion` |
| **Data Deletion Request URL** | `https://karteia.vercel.app/api/meta/data-deletion` |
| **Embedded Browser Redirect URLs** | (空欄でOK) |

→ 「**Save**」

---

## STEP 6: App Review 申請(=Business Verification 通過後)

App Dashboard → 左メニュー「**App Review** → **Permissions and Features**」

申請対象の3つを **個別に** Submit:
1. `instagram_business_basic`
2. `instagram_business_manage_comments`
3. `instagram_business_manage_insights`

各 permission の「Request Advanced Access」をクリック → Submission フォームに以下を貼り付け:

- **Use Case Detailed Description**: `docs/meta-app-review/01-/02-/03-` の各 English 文を貼り付け
- **Step-by-step User Flow**: 同上ファイルの Step Flow セクション
- **Test Credentials**: `reviewer@karteia.example` + Password(=IG-7 で発行する値)
- **Screencast**: 撮影した 3本の .mp4 をアップロード

⚠️ **B4 注意**:App settings → Basic → **「Business Use」** が **「Provide services to other businesses」** になっているか確認。「For myself or my own business」のままだと 3 permission 全部通らない。

---

## ⏱️ 想定スケジュール

| 段階 | 所要時間 | 同期/非同期 |
|---|---|---|
| STEP 1 開発者アカウント | 5分 | 同期 |
| STEP 2-1 Business Manager | 5分 | 同期 |
| STEP 2-2 Business Verification 書類提出 | 30分準備 + 数日〜2週審査 | 非同期 |
| STEP 3 Karteia App 作成 | 5分 | STEP 2-1 後 |
| STEP 4 Dashboard 設定 | 10分(=docs 00- の値貼り付け) | STEP 3 後 |
| STEP 5 Instagram Login 追加 | 5分 | STEP 4 後 |
| STEP 6 App Review 申請 | 30分(=Submission フォーム入力) | STEP 2-2 通過 + 撮影完了後 |
| Meta App Review 審査 | 数日〜数週間 | 非同期 |

→ **STEP 1〜5 は今日中に完了可能**(=書類提出と書類審査は非同期)。STEP 6 は撮影完了後。

---

## 詰まったら

各 STEP で「画面が違う」「ボタンが見つからない」と感じたら、その画面のスクショを撮ってドビーに送ってください。Chrome MCP で同じページを開いて代行案内します。
