# Seseragi Docs

Seseragiの公式ドキュメントサイト。日本語を標準に、英語でも同じ章・コード・条件を提供します。Astroで静的ページを生成し、Fumadocsでナビゲーション、目次、検索、コード表示を提供します。

言語の実装、Playground、仕様は[Seseragi](https://github.com/KentaroMorishita/seseragi)が管理します。このリポジトリはドキュメントと、検証する掲載コードを所有します。

## ローカル開発

Node.js24.22.1、Bun1.4.4を使います。

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run build
bun run preview
```

ビルドにCLIやコンパイラのcheckoutは不要です。実行例の検証には、本文が対象とする版のSeseragi CLIを使います。

```sh
bun run check:examples
```

手元の既定CLIと対象版が異なる場合は、対象版の正式配布binaryを別の場所に置き、`SESERAGI_CLI=/absolute/path/seseragi bun run check:examples`のように指定できます。`sync:library`と`verify:release`も同じ指定を使います。版・commit・release tagの照合は省略されません。既定CLIを入れ替える必要はありません。

比較用のTypeScriptは`checks.json`の`typescript`でstrict型チェックとNode.jsによる出力の検証を行います。ReactのTSXなど、実行せず型だけを調べる抜粋は`typecheck`で登録します。TSXも対応版の検証入力へ含め、変更後は`verify:release`をやり直します。

表示と操作は、ビルドしたサイトをブラウザで確認します。macOSではインストール済みChromeを使い、それ以外ではPlaywrightのChromiumを用意します。

```sh
bunx playwright install chromium
bun run preview --host 127.0.0.1 --port 4322
# 別のターミナルで実行
bun run check:browser
```

## 構成

- `content/docs`と`content/en`: 概要、Learn、用途別ガイド、言語リファレンス、標準ライブラリ
- `meta.json`: 日英で揃えた章立てと読む順番
- `examples`: 掲載コードと、出力・ビルド・テストの検証条件
- `src/data`: コンパイラのAPI情報、moduleの説明、日本語のAPI説明
- `src/components/docs.tsx`: Fumadocsのレイアウトと共通ナビゲーション
- `src/pages/api/search*.ts`: 言語別の静的検索インデックス
- `scripts/check-content.mjs`: 言語対応、章、リンク、見出し、掲載コード、パイプライン、API網羅の検査
- `docs/content-architecture.md`: 読者、章の役割、正確さと更新の基準
- `docs/validation.md`と`docs/reviews`: 実行・表示・構成の確認記録

実行するコードのfenceには、対応するファイルを示すMDXコメントを付けます。

````mdx
{/* example: examples/parcel.ssrg */}

```seseragi
ここへ検証ファイルと同じコードを掲載する
```
````

signatureだけの断片、期待する診断、ブラウザ用ビルドを、実行済みプログラムとして扱わないでください。

ソースには対応する言語のfenceを使います。Seseragiの宣言・型・式の断片も`seseragi`で表示し、`text`は出力や通常のテキストに使います。TypeScriptは`typescript`、ReactのJSX付きコードは`tsx`です。`check:highlight`はサイトの実設定を使い、両テーマの色とLibrary生成時のsignature・stdoutの区別を確認します。`check`と`build`でもこの検査を実行します。

必要な数行だけを掲載するときは、検証ファイルの`// docs:start name`と`// docs:end name`で範囲を囲み、`{/* example: examples/path.ssrg#name */}`で参照します。共通の字下げを除いたコードをそのまま掲載してください。範囲の重複や入れ子、未登録の検証ファイル、本文との不一致は検査で拒否します。短い式、関数の宣言、`main`へ置く断片、独立したプログラムを本文で区別します。

一章の例を一つに制限せず、入力の違い、空や該当なし、失敗、操作の使い分けに応じて補います。一つの例で初めて扱う概念は絞り、結果との対応を同じ節で説明してください。

## 対応版の更新

サイトが対象とする版は`src/data/standard-library.json`の`languageVersion`、出典は`languageCommit`に集約しています。版番号は各ページ上部の共通表示だけに出し、本文・APIの表・検索内容には入れません。本文へ番号や版表示用コンポーネントを入れると、手書き・生成ページのどちらも検査で拒否します。サンプルコードのpackage versionと、過去の検証記録は別の意味を持つため保持します。ビルド時に最新リリースを取得する方式ではなく、検証した版を公開します。

言語を更新するときは、正式リリースのCLIと同じtagを用意し、まずcatalogを同期します。`sync:library`は指定したcheckoutを変更せず、そのtagのファイルを読みます。

```sh
bun run sync:library ../seseragi
```

次に、リリース差分と本文を読み比べます。CLIのコマンドは`reference/cli.mdx`、package loaderの対応範囲は`reference/project-configuration.mdx`、compilerの制約は`reference/functions.mdx`と`reference/type-classes.mdx`に記載しています。日英ともに、解消された制約は注記と期待する診断の例を更新してください。

`library-signature-overrides.json`の補正は、対象版と元のsignatureが一致しなければ生成を止めます。新しいcatalogと仕様・runtimeを照合し、必要な補正だけを更新します。版番号の一括置換でこの検査を通さないでください。

説明と補正を見直した後、生成と実行確認を行います。`--reviewed`は上の見直しを済ませたことを記録する指定です。

```sh
bun run render:library
bun run verify:release -- --reviewed
bun run check:release
bun run check
bun run build
```

`verify:release`はCLIの版・commit・release tagをcatalogと照合し、すべての実行・ビルド・テスト・期待する診断を確認します。成功した場合だけ、版・commit・検証入力のハッシュ・CLI helpのハッシュ・確認日時を`release-verification.json`へ保存します。catalogの版や出典、例や検証条件がこの記録と異なると、`check`と`build`が停止します。記録を手で書き換えず、確認をやり直してください。Providerの版変更でサンプルのlockが古くなった場合は、該当packageを確認して`seseragi lock update PATH`を明示実行し、差分を確認してから再検証します。

最後にpreviewで`check:browser`を実行し、版の表示、日英の検索、表示幅、操作を確認して公開します。過去の検証記録にある版は履歴として残します。サンプルpackageの`version`や`package.language`のrangeは別の意味を持つため、配布版に合わせて置換しません。

`sync:library`は正規CLIとtagのcommitを照合し、API情報とregistryを取得します。WASMのartifact versionがリリースと異なる場合は、両版のcompiler cratesが同一であることを要求します。ビルドはコミット済みsnapshotと検証記録を使い、CLIやネットワークを必要としません。

## 標準ライブラリの生成

公開名と型はsnapshotから、日英の説明は別の辞書から生成します。説明の補正は`library-description-overrides.json`、使い分けと注意点は`library-notes.json`で管理します。公開structのフィールドは`library-fields.json`、版を固定した型情報の補正は`library-signature-overrides.json`に出典とともに記録します。生成結果が元データと異なる場合や、新しい説明・moduleが欠落した場合は検査で停止します。`contract-only`のmoduleには利用可能なAPIページを生成しません。

目的別の短い例は`library-examples.json`で日英の説明・出力・ソース範囲を管理します。掲載順と各出力の連結が、対応する`examples/library/checks.json`の実行条件と一致することを要求します。作例を増やすときも、生成ページを直接編集しません。

## 公開

公開URLは`https://seseragi-docs.vercel.app`です。GitHubの`main`をVercelの`seseragi-docs-site`へ接続しています。`vercel.json`に静的ビルドと旧ドメインからの転送を設定し、記事のパスとクエリを保って新URLへ移動します。言語ごとのURL、canonicalとhreflang、sitemapを静的に生成します。

旧サイト用のVercelプロジェクト`seseragi-docs`は別プロジェクトです。

## 出典と読者レビュー

レイアウトはFumadocs公式Astroテンプレートを基にしています。ロゴ、SNS画像、TextMate文法はSeseragiリポジトリの`assets/brand`、`extensions/seseragi/syntaxes/seseragi.tmLanguage.json`から取得しています。

APIの出典と版は`src/data/standard-library.json`、教材の仕様対応は`docs/reviews`に記録しています。自動検証とエージェントの読者想定レビューを、実際の初見読者による評価と区別しています。
