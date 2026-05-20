# スクリーンキャスト撮影手順ガイド

3スコープごとに **別動画** を撮影。撮影日は3本まとめて1日で完了させる前提。

## 事前準備チェックリスト

- [ ] テスト用 Instagram プロフェッショナルアカウント(=Business or Creator)
  - フォロワー **100以上**(=インサイトデモのため)
  - 公開アカウント設定
  - Facebook ページ紐付け済(=Facebook Login 系を使う場合のみ必要)
- [ ] そのテスト IG アカウントの **過去30日に最低5件のコメント** が付いている投稿
  - 営業時間の問い合わせ系コメントを1件用意(=FAQ デモ用)
  - 別アカウントからリアルタイムコメントできる準備(=自動返信デモ用)
- [ ] Karteia の **言語を English** に切替(=Settings → Language → English)
- [ ] Karteia の **テーマを Light** に設定(=スクリーンキャストの可読性向上)
- [ ] Chrome シークレットウィンドウで開く(=複数アカウントログイン経路混乱を避ける、過去経験あり)
- [ ] macOS の QuickTime Player で「新規画面収録」を準備
- [ ] **画面解像度を 1920×1080** または 1728×1080(=Karteia の領域指定 = 過去 v3 スクショと同サイズ)
- [ ] 音声不要(=無音で撮影)

## 撮影順序

1. **動画 #1**: `instagram_business_basic`(=ログイン~OAuth~Connected 表示まで、1:15)
2. **動画 #2**: `instagram_business_manage_comments`(=コメント取得~AI返信~IG反映確認、2:00)
3. **動画 #3**: `instagram_business_manage_insights`(=ダッシュボード KPI~属性チャート~期間切替、1:30)

各動画の **詳細台本** は各 permission ファイル(`01/02/03-*.md`)を参照。

## 撮影時の注意点(=過去Meta レビューで落とされる典型理由 対策)

| NG パターン | 回避策 |
|---|---|
| アプリ画面が日本語のまま | Settings → Language → English に切替してから撮影 |
| スコープ機能を実演していない | 各動画で **そのスコープ固有の機能のみ** をデモ。他スコープは別動画 |
| OAuth 同意画面を映していない | Meta の OAuth ダイアログを **クロップせず** 全画面で映す |
| 結果が Instagram 側で反映確認できない | Comments 動画では IG.com / IG アプリで実反映確認シーン必須 |
| カット編集が雑 | 各動画 **無編集の連続録画** が望ましい。シーン切替は単純な遷移のみ |

## 🎬 映してはいけない物 / 必須で映す物(=2024-2026年 開発者コミュニティ実例ベース)

### ❌ 映してはいけない物
- **個人 SNS アカウントの中身**(=実名・本物の DM・本物のフォロワー名) → テストアカウント必須
- **mock data / ダミー画面だけ**(="we couldn't see how the permission is being used" で確実却下)
- **音声ナレーション**(=公式「レビュアーは音声を聞かない」、映像内字幕で説明)
- **localhost / vercel preview URL**(=本番ドメインじゃないと却下)
- **他社ロゴ・商標**(=Instagram のロゴをガッツリ映すのは OK、他競合ロゴ NG)

### ✅ 必須で映す物
1. **アプリ名・App ID・アイコンの表示**(=動画冒頭3秒)
2. **完全なログアウト → ログイン経路**(=途中スキップ NG、Logout → Login → OAuth が連続)
3. **OAuth 同意画面の全文表示**(=permissions のチェックボックスが見える状態で **3秒以上静止**)
4. **要求する各 permission の実使用シーン**(=basic/comments/insights 別シーン、各30秒以上)
5. **Instagram 側で結果が反映される様子**(=コメント返信ならスマホ Instagram アプリ実機で返信が表示されるところを録画)
6. **マウスカーソルでの操作**(=キーボードショートカット連打 NG、Reviewer が UI 動線を理解できるよう)
7. **データ削除フロー**(=Settings → Disconnect Instagram → 確認モーダル → 完了画面、これを映すと加点)

## 📐 動画品質の具体要件

| 項目 | 推奨値 | 理由 |
|---|---|---|
| 解像度 | **1080p 以上**(=1920×1080 推奨) | 文字が潰れず読める |
| モニター幅 | **1440 px 以下** | 横長すぎると Reviewer が拡大しないと読めない |
| 長さ | **各 1〜2分、permission 別 3本に分割推奨** | 全部1本だと Reviewer が見落とす |
| ファイル形式 | **MP4 (H.264)** | 標準、再生失敗リスク低 |
| ファイルサイズ | **各 100MB 以下が無難**(=公式上限明示なしだが大きすぎると上手く反映しない事例あり) | アップロード安定性 |
| 字幕 | **英語の画面内オーバーレイ必須**(=音声なし) | "Reviewer は音声を聞かない" の前提 |
| カラー | **明度 80%以上** | UI が暗いと読みにくい |

## 🎬 過去レビュアー指摘事例(=コミュニティ実例)

| Reviewer コメント | 原因 | Karteia での対策 |
|---|---|---|
| "We are not able to test requested permissions" | Test user の IG 接続フローが画面に無い・接続できる導線が無い | Test user に **事前に IG Business Account を接続済み**で渡す |
| "While we were able to login... we were unable to test the steps to connect an Instagram business account" | IG 接続ボタンが見当たらない or 押しても何も起こらない | Settings の Connect ボタンを目立つ位置に配置、OAuth フローが本番で動作する状態で提出 |
| "Could not test the functionalities" | Permission を使う機能が UI に出ていない(=未実装と判定) | 撮影前に **本番URLで各機能の動作確認**(=管理者ログイン →各機能順に操作) |
| "Privacy Policy doesn't include required information" | 取得データ・第三者提供・削除手順 のいずれかが抜けている | Karteia は Meta必須12項目網羅済(=完了) |

## 🎬 録画 cue sheet (=共通テンプレ、各 permission ファイルの台本と組み合わせて使う)

### 開始 cue
```
[0:00] 画面に Karteia アイコン + テキスト "Karteia App Review - <permission name>"
[0:03] Karteia ログイン画面表示、URL バーに karteia.vercel.app が見える
[0:05] 字幕オーバーレイ: "Step 1: Login with reviewer credentials"
```

### OAuth セクション cue
```
[X:00] Connect ボタン押下、Meta OAuth ダイアログ表示
[X:02] 字幕: "Step N: OAuth consent — please review the requested permissions"
[X:03] ダイアログを **3秒静止**(=Reviewer が permissions リストを読める)
[X:06] マウスカーソルを Allow ボタンに移動 → クリック
[X:07] Karteia /settings?connected=instagram に戻り
[X:08] 字幕: "Connected successfully"
```

### 反映確認 cue(=Comments の場合)
```
[Y:00] 別タブで instagram.com を開く(=事前に開いて該当投稿に navigate 済み)
[Y:02] 該当投稿のコメント欄にスクロール
[Y:04] 字幕: "The reply sent from Karteia is now visible on Instagram"
[Y:06] Karteia から送った返信文がコメントとして見える
[Y:08] 字幕オーバーレイ: "Permission instagram_business_manage_comments fully functional"
```

## ⚙️ macOS QuickTime での録画開始/停止 手順

1. **Cmd + Shift + 5** (=画面収録ツールバー表示)
2. **「選択部分を収録」** を選択
3. Karteia の Chrome ウィンドウだけを矩形指定(=URL バー込み)
4. オプション → 内蔵マイク は **OFF**(=音声不要)
5. オプション → クリックを表示 **ON**(=マウスポインタが見える)
6. 「収録」ボタン → 録画開始
7. 撮影完了後、停止ボタン → 自動で `~/Desktop/` に保存
8. ファイル名を `01-instagram_business_basic.mov` 等にリネーム
9. (=必要なら) HandBrake で MP4 + 100MB 以下に圧縮

## 📋 録画前 最終チェック(=これ忘れると撮り直し)

- [ ] Karteia の言語が **English** に切り替わっている
- [ ] テーマが **Light**(=暗いと文字読みづらい)
- [ ] Chrome 拡張機能の通知 OFF(=録画中にポップアップ出ない)
- [ ] 別のアプリ通知音 OFF(=macOS の通知を「集中モード」に)
- [ ] Reviewer credentials でログインテスト済(=動作確認)
- [ ] テスト IG アカウントが Karteia に **事前に接続済み**(=or 接続フローを撮影に含める)
- [ ] テスト投稿に **コメントが付いた状態**(=過去30日に5件以上)
- [ ] (Comments 動画用)別 IG アカウントから新規コメント送信できる準備(=自動応答デモ用)
- [ ] instagram.com を別タブで該当投稿に navigate 済み(=反映確認用)
- [ ] 画面解像度 1920×1080 設定
- [ ] バッテリー残量 50%以上 or 電源接続済

## 各動画の保存場所

```
~/Desktop/karteia-app-review-2026-05-21/
  ├── 01-instagram_business_basic.mov          (~10-30 MB)
  ├── 02-instagram_business_manage_comments.mov (~20-50 MB)
  └── 03-instagram_business_manage_insights.mov (~15-40 MB)
```

Meta App Review の Submission アップロード時、各 permission の Screencast 欄に
それぞれの動画をアップロード。

## OAuth Facebook 認証時に龍さんが入力するもの

- テスト用 Facebook アカウントの **email + password**
- もし2段階認証が ON なら SMS コード入力

→ Facebook OAuth ダイアログが出た瞬間だけ龍さんが入力、それ以外は Karteia 側の操作はドビーが Chrome MCP で代行可能。

## Instagram 側の反映確認シーン

撮影中に「Karteia から返信したコメントが Instagram に実際に投稿された」を映す必要あり。

オプション:
- (a) **PC ブラウザで instagram.com を別タブ** で開いて、該当投稿のコメント欄にスクロール → 返信が表示されているのを映す
- (b) **iPhone の画面ミラーリング** で IG アプリを Mac に映して撮る

(a) が最も簡単。撮影直前に instagram.com の該当投稿 URL を Karteia と同じ Chrome 窓の隣タブで開いておく。
