# TikTok App Review 提出前セルフチェック 25項目 + 却下対応テンプレ

**【ドビーが2024-2026年公式 + GitHub Issues + 開発者ブログを横断調査して抽出】**
TikTok は Meta より厳しい(=URL ownership verification 必須化、再申請 ban リスクあり)。
このリスト全項目✓してから Submit。一発承認を狙う。

---

## 📋 25項目セルフチェックリスト

### A. URL & ドメイン(5項目)

- [ ] **A1**. **本番ドメイン** で全URL設定(=`karteia.vercel.app`、Vercel preview URL `xxx-git-main.vercel.app` は NG)
- [ ] **A2**. **URL ownership verification 完了**(2024-09-09 以降必須、Production mode、Domain 方式推奨)
- [ ] **A3**. Privacy Policy URL がフッターから **1クリック** で開ける位置
- [ ] **A4**. Terms of Service URL がフッターから **1クリック** で開ける位置
- [ ] **A5**. Redirect URI が HTTPS、本番ドメイン配下、設定値と完全一致

⚠️ A2 の URL ownership は **2024-09-09 以降に作成したアプリ全件で必須**。手順:
1. Developer Portal アプリ画面上部「URL properties」
2. Production mode に切り替え
3. Domain 方式 → DNS TXT 追加 or `karteia-developers-verification.txt` を public 配下に
4. TikTok 側「Verify」クリック → 反映確認(=DNS は伝播に数時間)

### B. App 基本情報(5項目)

- [ ] **B1**. App Name に「TikTok」「Instagram」「Social」等の他社/カテゴリ名称なし
- [ ] **B2**. App Name に「Beta」「Test」「Demo」「v0.1」等の未完成示唆なし
- [ ] **B3**. App Icon 1024×1024 PNG、他著名ブランドと類似なし
- [ ] **B4**. App Description にスコープ用途を **1行ずつ明記**(=`user.info.basic` 〜 `video.list`)
- [ ] **B5**. App Description に **「コメント機能は TikTok API 対象外、Instagram 専用」と明記**(=レビュアーの誤解を先回り防止)

### C. スコープ・プロダクト選択(4項目)

- [ ] **C1**. 申請プロダクトは **Login Kit + Display API** のみ
- [ ] **C2**. **Content Posting API、Research API にチェックなし**(=Karteia は不要、誤って選択すると UX 要件で却下確実)
- [ ] **C3**. スコープは `user.info.basic`、`user.info.stats`、`video.list` のみ
- [ ] **C4**. 各スコープに justification 英語文(なぜ必要か)記入済

### D. デモビデオ(7項目)

- [ ] **D1**. **Sandbox 環境** で撮影(=初回審査時、Production 切替前)
- [ ] **D2**. 動画内ドメイン = 申請ドメイン **完全一致**(=`localhost`、`vercel.app preview`、`ngrok` 全部 NG)
- [ ] **D3**. 動画 UI は **英語表示**(=日本語UI のみだとレビュアーが読めず却下)
- [ ] **D4**. Login → OAuth consent → callback 復帰 の **完全フロー** あり
- [ ] **D5**. `user.info.basic` のデータ表示画面あり(=display_name + avatar)
- [ ] **D6**. `user.info.stats` のデータ表示画面あり(=follower/video count 数値)
- [ ] **D7**. `video.list` のデータ表示画面あり(=動画リスト + view/like/comment/share 数値)
- [ ] **D8**. 各ファイル **50MB 以下**、合計 **5本以内**

⚠️ D2 の **ドメイン一致は厳密**:
> "make sure the domain of the website shown in the demo video matches the website URL you provide" — TikTok 公式

### E. Privacy / データ管理(4項目)

- [ ] **E1**. Privacy Policy に **収集 TikTok データ項目を明記**(=open_id, display_name, avatar_url, follower_count, video_count, video metadata)
- [ ] **E2**. Privacy Policy に **データ保管期間を日数で明記**(=「アカウント削除後30日以内に削除」など曖昧禁止 → Karteia 完了済)
- [ ] **E3**. データ削除フロー(=Settings → SNS Connections → Disconnect)が実装+ Privacy に明記
- [ ] **E4**. **TikTok Partner Privacy Policy** へのリンク を Karteia Privacy 内に追加: `https://www.tiktok.com/legal/page/global/partner-privacy-policy/en`

---

## 🚫 典型却下理由 TOP 6 + 対策

### 却下理由 #1:URL ownership 未検証
- **原因**: 2024-09-09 以降のアプリで Privacy Policy / Terms / Redirect URI の検証完了前に Submit
- **対策**: TikTok 側「URL properties」で全URL verify → DNS or ファイル検証完了を確認してから Submit

### 却下理由 #2:ドメイン不一致(=デモ動画と申請URL)
- **原因**: デモ動画が `localhost:3000` や Vercel preview URL で撮影されている
- **対策**: **本番ドメイン**(=`karteia.vercel.app`)で全部撮影。録画前に URL バー確認

### 却下理由 #3:Privacy / Terms がメニュー奥に隠れている
- **原因**: トップページのフッターから直接リンクが見えない、ハンバーガーメニュー奥にある
- **対策**: Karteia はログイン画面フッターに `/privacy` `/terms` の直接リンク配置済(=確認)

### 却下理由 #4:アプリ名・説明に他社名称
- **原因**: 「TikTok」「Social Media」「Instagram」を含む App Name
- **対策**: `Karteia` 単体で登録、Description で「TikTok 連携で...」と書くのは OK

### 却下理由 #5:Content Posting API を誤申請
- **原因**: スコープ選択時に Content Posting API にチェック入れた → UX Guidelines 違反で却下(=Postiz 事例)
- **対策**: Karteia は投稿しない、Login Kit + Display API のみ

### 却下理由 #6:fake or incomplete data
- **原因**: ダミー URL、lorem ipsum テキスト、開発中の文言
- **対策**: 全フィールドを本番品質で記入。「TBD」「coming soon」禁止

⚠️ **同じ却下理由で3回以上再申請するとアカウント永久 ban リスク**。初回提出の完成度が勝負。

---

## 📝 レビュアー応答テンプレ(=却下後の再申請)

```
Hello TikTok Review Team,

Thank you for the feedback on our submission for Karteia (App ID: XXX).
We have addressed the points raised in your review:

1. [Issue cited]: We have updated [specific section/URL] to
   [specific change]. The change is now live at [URL] and
   demonstrated in the updated demo video (timestamp 0:XX-0:XX).

2. [Same format for each issue]

To clarify our scope usage:
- We use user.info.basic, user.info.stats, and video.list strictly
  for read-only analytics on the linked user's own TikTok account.
- We do not post content, do not access other users' data, and
  comment-related features are out of scope for our TikTok
  integration (those features are Instagram-only in our product).

Demo accounts for your review:
- Karteia URL: https://karteia.vercel.app/login
- Email: reviewer@karteia.example
- Password: [see submission form]
- Linked TikTok Business account: @karteia_test_business
  (already authorized, reviewer can immediately access analytics)

Please let us know if any additional information would help.

Best regards,
HelixPlus Inc. — Karteia Team
```

---

## 提出当日の最終チェック

1. [ ] `https://karteia.vercel.app/login` シークレットウィンドウで Reviewer credentials ログイン成功
2. [ ] Settings → SNS Connections に TikTok Connect ボタンが表示
3. [ ] Connect → OAuth → 戻り → ダッシュボードに follower/video 数値表示
4. [ ] `https://karteia.vercel.app/privacy` でフッター直接アクセス可能
5. [ ] `https://karteia.vercel.app/terms` で同様
6. [ ] URL ownership verification が「Verified」状態
7. [ ] デモ動画3本が `.mp4`、英語UI、ドメイン一致、各50MB以下

これ全部✓してから Submit。
