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
