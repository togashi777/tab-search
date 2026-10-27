# TAB DIG

曲名からYouTube・Songsterr・Ultimate Guitarの無料公開TABへのURLを探すサイトです。

## 使い方

ギター／ベースを選択し、曲名を入力して検索します。必要に応じてアーティスト名を添えてください。
結果は検索元で絞り込みでき、URLを個別またはまとめてコピーできます。ブックマークと検索履歴はブラウザーのlocalStorageに保存します。

## 開発

- Node.js 24以上
- `npm run dev`：開発プレビュー
- `npm run build`：本番ビルド
- `node --test scripts/search.test.mjs`：有料除外・楽器選択・接続障害のテスト
- `node node_modules/typescript/bin/tsc --noEmit`：型検査
- `node scripts/verify-live.mjs`：実サイトへの検索確認（外部通信が必要）

検索処理：`lib/tab-search.ts`、検索API：`app/api/search/route.ts`、画面：`app/page.tsx`、スタイル：`app/globals.css`。

## 無料判定と制限

- YouTube：TABを題名に含む公開動画。タイトル・検索スニペットに有料販売の記載がある候補を除外します。動画内の譜面の有無、完全性、地域制限などは確認できません。
- Songsterr：閲覧可能なTABへのリンク。速度変更・印刷・ダウンロード等のPlus機能は対象外です。
- Ultimate Guitar：`public`指定のテキストTABのみ。Official、Pro、試用プラン、コード譜を除外します。
- 外部サービスの公開検索に依存します。仕様変更やアクセス制限時にはその検索元を利用不可として表示し、残りの結果を維持します。APIキーは不要です。
- 各ソース最大8件。TAB本文の転載・ダウンロード、ペイウォールの回避は行いません。
- 検索の完全性や各ページの無料条件を保証するものではありません。楽曲が見つからない場合は表記を変えて検索してください。
- 新規の公開先は所有者限定です。自分のブラウザーでの登録は不要ですが、公開URLの閲覧には所有者のChatGPTサインインが必要です。
