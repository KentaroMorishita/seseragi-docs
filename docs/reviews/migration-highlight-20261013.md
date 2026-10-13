# TypeScript比較とハイライトの確認

2026-10-13。言語の対象は正式配布版Seseragi 0.61.26、commit `7f271f690349c831f3eadf71e5bfc98a9b94b819`。配布archiveのSHA-256を照合し、専用のbinaryを`SESERAGI_CLI`で指定した。手元の既定CLIは変更していない。サイトの対象版とAPI snapshotも今回の範囲では変更していない。

## 比較ページ

TypeScriptからSeseragiへのガイドを8節から18節へ拡充した。呼び出し、数値、グループ化、部分適用、ラムダ、パイプライン、条件式、レコード、不変更新、型の別名、ADT、Maybe、Either、Effect、Reactのprops・状態・イベントを扱う。日英の54マーカー、76コード・出力ブロックが一致し、全行37文字以内である。

同じ入力と結果を比べ、IntとFloat、値の不在と空文字列、Promiseと遅延したEffectのように異なる動作は別に説明した。letと`<-`の違いは、Effectを一回実行して得た整数を二回読む独立例で確認した。標準のFloat比較、HtmlのAction型の一致、React reducerとSeseragi updateの引数順、top-level awaitのmodule条件も補った。

Seseragiの構文と意味は、正式tagの仕様と実行例を照合した。TypeScriptの基本型・objectとReactのprops・reducer・不変更新は各公式ドキュメントを参照した。型、宣言、main内の抜粋、CLIのプログラム、Web用package、Reactの型確認を本文で区別している。

## 実行と更新の条件

`verify:release --reviewed`は180件成功した。内訳はSeseragi実行140、build8、test2、期待する診断11、TypeScript実行18、Reactの型確認1。TypeScriptの19ファイルはstrict型チェックも通した。Node 24.14.0、Bun 1.3.11、TypeScript 6.0を使った。React TSXのコンポーネントは型チェックであり、Reactアプリのブラウザ実行とは区別する。

新しいSeseragiのcounterはWeb向けにビルドし、Chromeの375pxタッチ操作で0→1→2を確認した。ページとapp assetsはHTTP200、JavaScript例外は0。既定HTMLのfaviconは作例に配置していないため、faviconのHTTP404はアプリの実行結果から区別した。

比較するTypeScript/TSXもexamples配下で管理し、表示コードを検証ソースに対応付けた。TSXを検証入力のhashへ追加し、変更時に対応版の再検証を要求する。正式CLIを別pathから指定する場合も、版・commit・tag・channel・clean状態の照合を維持する。

## ハイライト

画像のEffect宣言はtext指定だったため無色になっていた。日英28のLearn/Referenceページの50fenceと、日英126のLibraryページの2,902型signatureをseseragi指定へ変更した。本文とコードの差分はなく、実行結果の94fenceはtextのまま維持した。Libraryは生成処理だけを変更し、ページを再生成した。

サイトの実設定を使う5つの回帰テストは成功した。Seseragi/ssrg、TypeScript/TSX、JSON、TOML、shell、JavaScript、HTMLを両テーマで確認した。記事のソースは対応する言語指定を必要とし、宣言とstdoutの区別も検査する。今回の比較ページの108ソースブロックにも、ライト・ダークの色が付くことを確認した。版管理の7テストと合わせて12件成功。

## サイトの確認

`bun run check`は0 errors、0 warnings、0 hints。`bun run build`は223ページを生成した。公開対象は222ページと404。既知のFumadocs検索用CSSの最適化警告は、検索の操作確認と区別した。

Chromeでローカルのproduction buildの222ルートと日英metadata・sitemap・robots・404を確認した。375pxでは全222ページで型の詳細を開き、折り返しを無効にしてもコードの見切れ、コピー表示の重なり、ページの横はみ出し、負の字間が0件。JavaScript例外・console errorも0。検索・コピー・配色の保存・言語切替・スマホメニュー・no-JS本文も成功した。

日英比較ページの全表示ソースは検証fixtureと一致。画像にあるEffectのcompact/contract、TypeScript、React TSX、生成したmapの型signatureは、スマホのライト・ダークで24の色検査に成功した。stdoutがプレーンテキストのままであることも確認した。結果は`/tmp/seseragi-docs-migration-browser-local/report.json`。公開後はcanonical domainを別に確認する。

これは実行・表示と、エージェントの読者想定レビューの記録である。初見読者による理解の評価とは区別する。
