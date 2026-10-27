# TAB DIG

曲名からYouTube・Songsterr・Ultimate Guitarの無料公開TAB譜や動画へのURLを検索するWebアプリです。

## 機能

- ギター／ベースの切り替えと検索元別の絞り込み
- URLの個別・一括コピー、ブラウザー内へのリンク保存
- 有料専用TABの除外と、検索元に接続できない場合の表示

## 開発

Node.js 24以上を用意して実行します。

```sh
npm run install:ci
npm run dev
```

開発サーバーの既定URLは http://localhost:5173 です。APIキーは不要です。検索には外部サイトへの接続が必要です。

```sh
node --test scripts/search.test.mjs
npx tsc --noEmit
npm run build
```

React・TypeScript・Vinext・Cloudflare Workersを使用しています。画面は `app/page.tsx`、検索処理は `lib/tab-search.ts`、APIは `app/api/search/route.ts` です。

## 公開環境と秘密情報

このリポジトリの `.openai/hosting.json` は汎用の設定です。既存サイトのプロジェクトID、認証情報、ローカル実行状態、公開用アーカイブは含みません。元の公開サイトは別途管理されています。GitHubへのpushだけで、そのサイトを更新・一般公開することはありません。

独自に配置する場合の認証・アクセス制御はホスティング先で設定してください。開発時の仮ログインはループバック接続だけで使われます。

無料条件は公開情報から判定しており、動画内のTABの有無や各サイトの閲覧条件はリンク先でご確認ください。譜面の転載やペイウォールの回避は行いません。

詳細は [TAB-DIG.md](TAB-DIG.md) と [SECURITY.md](SECURITY.md) を参照してください。
