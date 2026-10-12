# Seseragi Docs

Seseragiの学習サイト。Astroで静的ページを生成し、Fumadocsでナビゲーション、目次、検索、コード表示を提供します。日本語の学習導線と見た目を確認するための最初の公開版です。

## ローカル開発

Node.js 24.14以上、Bun 1.3.11を使います。

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run build
bun run preview
```

## 構成

- `src/pages/index.astro`: トップページ
- `content/docs`: 概要、Learn、Reference。本文はMDXで管理
- `src/components/docs.tsx`: Fumadocsのレイアウトと共通設定
- `src/pages/api/search.ts`: ビルド時に生成する静的検索インデックス
- `examples/parcel.ssrg`: 学習ページとトップに掲載する実行例

言語の実装、Playground、仕様の正本は[Seseragi](https://github.com/KentaroMorishita/seseragi)が管理します。このリポジトリではコンパイラを再実装しません。

## 公開

GitHubの`main`をVercelの`seseragi-docs-site`へ接続します。`vercel.json`に静的ビルドの設定を記載しています。秘密情報や外部データベースは不要です。

旧サイト用のVercelプロジェクト`seseragi-docs`とは別プロジェクトです。

## 出典と検証

初期構成はFumadocs公式Astroテンプレートに基づきます。ロゴ、SNS画像、TextMate文法はSeseragiリポジトリの`assets/brand`、`extensions/seseragi/syntaxes/seseragi.tmLanguage.json`から取得しています。

`examples/parcel.ssrg`はSeseragi 0.61.25で実行を確認済みです。検証結果と次の読者レビュー項目は`docs/validation.md`へ記録します。

日本語を標準とし、英語版は`/en`で公開します。本文は`content/docs`と`content/en`に分け、ページごとに言語を切り替えます。検索も言語別の静的インデックスを使います。
