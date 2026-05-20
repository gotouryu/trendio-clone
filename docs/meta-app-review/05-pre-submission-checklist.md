# Meta App Review 提出前セルフチェック 25項目 + 却下対応テンプレ

**【ドビーが2024-2026年の開発者コミュニティ実例・Meta公式・実体験ブログを横断調査して抽出】**
このリスト全項目を✓してから Submit ボタンを押すこと。一発承認を狙う。

---

## 📋 25項目セルフチェックリスト

### A. アプリ設定(6項目)

- [ ] **A1**. App Icon 1024×1024 PNG 登録済(=Karteia は `public/app-icon-1024.png` 完了済)
- [ ] **A2**. Privacy Policy URL 登録、HTTPS、公開アクセス可、パスワード保護なし、IP/地域ブロックなし
- [ ] **A3**. Terms of Service URL 登録(=任意だが推奨)
- [ ] **A4**. Business Email 登録(=独自ドメイン推奨、`r.gotou@houzyu.com`)
- [ ] **A5**. App Category 適切(=「Business and Pages」)
- [ ] **A6**. Data Deletion Callback URL 登録 + HTTPS + 署名検証実装済(=`/api/meta/data-deletion`)

### B. Business Verification(4項目)

- [ ] **B1**. Business Manager と Karteia 運営法人(=ヘリックスプラス)が一致
- [ ] **B2**. Business Verification 通過済(=法人登記簿等)
- [ ] **B3**. Tech Provider Agreement 署名済
- [ ] **B4**. App Dashboard の Business Use = **「Provide services to other businesses」** に設定

⚠️ B4 を「For myself or my own business」のままにすると、3スコープ通過しません。Tech Provider 設定必須。

### C. スクリーンキャスト(8項目)

- [ ] **C1**. アプリ UI が **英語** になっている(=Settings → Language → English で切替)
- [ ] **C2**. 動画冒頭にアプリ名・App ID・アイコンが映る
- [ ] **C3**. 完全な logout → login → OAuth 同意 → 機能利用の流れ(=途中スキップ NG)
- [ ] **C4**. **OAuth 同意画面が3秒以上静止**して permissions リストが読める
- [ ] **C5**. 各 permission を使うシーンが **独立して** 映る(=basic / comments / insights 別シーン)
- [ ] **C6**. Instagram **実機(スマホ or instagram.com)で反映確認シーン**あり(=コメント返信が IG 側に表示される瞬間を映す)
- [ ] **C7**. マウスカーソル操作、キーボードショートカット連打なし
- [ ] **C8**. 1080p 以上、MP4、字幕オーバーレイあり、音声不要

### D. Use Case Description + Step-by-step(4項目)

- [ ] **D1**. 各 permission の Use Case が **who / what / why / how の4要素** を含む(=01-/02-/03- ファイル参照)
- [ ] **D2**. Step-by-step instructions が screencast のシーンと **一字一句整合**(=ボタン名・画面名が完全一致)
- [ ] **D3**. Reviewer 用 test user credentials が記載(=IG-7 で発行する `reviewer@karteia.example`)
- [ ] **D4**. 「Karteia は **Tech Provider** である」と明記(=他社の IG Business Account を扱う旨)

### E. アプリ実機状態(3項目)

- [ ] **E1**. 本番 URL から誰でもアクセスできる(=`https://karteia.vercel.app` 公開、IP制限・ベーシック認証なし → 確認済)
- [ ] **E2**. Test user で IG 接続から機能利用まで **実際に動く**(=Connect ボタン → OAuth → 戻り → 機能画面)
- [ ] **E3**. Permission 拒否時のエラーハンドリングが UI に実装(=「この機能には IG 接続が必要です」+ 再接続ボタン)

---

## 🚫 典型却下理由 TOP 8 + 対策(=これだけ潰せば 90% 通る)

### 却下理由 #1:「we couldn't see how the permission is being used」(=最頻出)
- **原因**: 該当 permission の機能が screencast に明確に映っていない
- **対策**: スコープ別に 30秒〜1分の独立シーンを必ず入れる。文字オーバーレイで「[Demonstrating instagram_business_manage_comments]」と明示

### 却下理由 #2:「We were unable to test [feature]」
- **原因**: Reviewer が test user でログインしても、機能ボタンが見えない or 押しても動かない
- **対策**: Test user に **事前に Instagram Business Account を接続済みの状態** で渡す(=Reviewer は接続ボタン押下後すぐ機能利用できる)

### 却下理由 #3:「Privacy Policy URL does not meet our requirements」
- **原因**: ポリシーが Vercel preview URL、IP制限、メニュー奥に隠れている、必須項目が抜けている
- **対策**: トップレベル `karteia.vercel.app/privacy` で誰でも読める + 取得データ・利用目的・第三者提供・保存期間・削除手順・連絡先 すべて記載(=Karteia は完了済)

### 却下理由 #4:「Data Deletion endpoint does not respond correctly」
- **原因**: 署名検証していない / レスポンス形式が違う / HTTPS じゃない
- **対策**: `{ "url": "...", "confirmation_code": "..." }` JSON 返却必須、SHA256-HMAC で signed_request 検証(=Karteia 完了済)

### 却下理由 #5:「App is still in development」
- **原因**: App Description に「Beta」「Demo」「Test」等の語がある / 主要機能が未実装
- **対策**: Description は現在形で「Karteia is a customer engagement platform...」と書く(=Karteia 完了済)

### 却下理由 #6:「Test credentials don't work」
- **原因**: 提出した reviewer 用 ID/PW で実際にログインできない / 期限切れ
- **対策**: 提出前日にもう一度ログインテスト。Reviewer 用は **永続パスワード** で発行(=自動失効しない)

### 却下理由 #7:「Use of permission is unclear」
- **原因**: Use Case Description が抽象的、機能と permission の対応が不明
- **対策**: 「On the [Screen Name] screen, we call [API endpoint] using [permission] to [user-facing benefit]」のフォーマットで書く

### 却下理由 #8:「Login flow doesn't show OAuth consent properly」
- **原因**: OAuth 同意画面が一瞬しか映らない / クロップされている
- **対策**: 同意画面を **3秒以上、permissions リストが全部見える状態で静止** + ユーザーが「Allow」ボタンを押す瞬間を映す

---

## 📝 レビュアー応答テンプレ(=却下フィードバック後の再申請時)

```
Hi Meta App Review Team,

Thank you for the feedback on our submission for Karteia (App ID: XXX).
We have addressed the points raised in your review:

**Previous feedback**: "[却下文を引用]"

**Root cause identified**:
[具体原因。例:Test user did not have an Instagram Business Account
linked, so the Connect Instagram button was hidden until manual setup.]

**Changes made**:
1. We have pre-linked an Instagram Business Account to the provided
   reviewer credentials. Reviewers can now access the Comments Inbox
   immediately after login.
2. The screencast at timestamp 0:25–0:50 now explicitly shows the
   OAuth consent dialog with all requested permissions visible.
3. Step-by-step instructions section 3 has been updated to clarify
   the flow from login to comment retrieval.

**Updated reviewer credentials** (please use these for re-review):
- URL: https://karteia.vercel.app/login
- Email: reviewer@karteia.example
- Password: [redacted, see submission form]
- The reviewer account already has an Instagram Business Account
  connected (handle: @karteia_test_business).

**Updated screencast**: We re-recorded the entire flow.
Key changes: [簡潔に変更点リスト]

Please let us know if any additional clarification would help.

Best regards,
HelixPlus Inc. — Karteia Team
```

---

## ⚠️ Karteia 固有の最大リスク

**【推論】** `instagram_business_manage_insights` が最も却下されやすい。理由:

- インサイトデータが見える状態にするには **テスト用 IG アカウントが 100フォロワー以上** 必須(=Meta 仕様)
- レビュアーが「数値が出てない」と判定すると即却下

**対策**:Test 用 IG プロアカウントは **フォロワー 100人以上** を必ず確保。100人ない場合は、知人に頼んでフォロー数水増し or 撮影前に告知して集める。

---

## 提出当日の最終チェック(=押す直前にやる)

1. [ ] `https://karteia.vercel.app/login` をシークレットウィンドウで開く → Reviewer credentials でログイン成功する
2. [ ] そのまま `/settings` → Instagram Connect ボタンが見える
3. [ ] (=test user が IG 未接続の場合)Connect → OAuth → 戻りまで動作する
4. [ ] `/dashboard` で KPI 数値が表示される(=mock じゃなく実データ)
5. [ ] `/comments` でコメント一覧表示 → AI Reply 生成 → Reply 送信 → IG 反映確認できる
6. [ ] `https://karteia.vercel.app/privacy` が普通に開く
7. [ ] `https://karteia.vercel.app/api/meta/data-deletion` に GET で `{"status":"ok"}` 返る
8. [ ] スクリーンキャスト3本が `.mp4`、各 100MB 以下、英語UI、字幕あり

これ全部✓してから Submit。
