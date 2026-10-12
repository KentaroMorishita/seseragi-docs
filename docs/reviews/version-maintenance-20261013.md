# 対応版の管理と更新の確認

確認対象は正式配布版Seseragi 0.61.26、commit `7f271f690349c831f3eadf71e5bfc98a9b94b819`。この番号は今回の検証履歴として固定する。サイトの現在の対象版は`src/data/standard-library.json`で管理する。

## 直書きの監査

見出しは既にcatalogの共通値、標準ライブラリのページは同じcatalogからの生成だった。一方、手書きの本文とコード見出しには日英合わせて18箇所の直書きが残っていた。本文は`<LanguageVersion />`へ置き換え、コード見出しは「対象版で拒否される形」とした。検索用のMDX解析でも同じ値を解決する。

moduleの説明と型補正の注記にあった番号も除いた。型補正データの`languageVersion`は、補正を新しい版へ持ち越す前に確認するための条件として残す。生成ページ、過去の検証記録、packageのversionとlanguage rangeは別に扱う。

手書きの本文・コード見出し・moduleの説明・型補正の注記に版を直書きすると、内容検査が拒否する。日英の版参照の数も照合する。生成したAPIページの番号は、rendererの鮮度検査でcatalogとの一致を確認する。

## 正式リリースでの確認

`sync:library`でtagから0.61.26のAPI情報を取得した。0.61.25からのcompiler cratesの変更はなく、公開APIの元signatureも変わっていなかった。CLIのhelpとpackage loaderの実装範囲を確認し、現在のコマンドとlocal/path projectに関する説明を維持した。

`std/effect`のtimeout、timeoutFail、retry、repeatは、catalogが結果型の元の環境Rを省く補正対象のままだった。正式tagのruntimeが返す型にRとClockの両方が必要であることを確認し、4件の補正条件を更新した。

直接のoperator適用を拒否する制約は既存の診断例で確認した。Effect関数内でArrayのdoを直接pure letへ置く制約にも診断例を追加した。将来これらの形がコンパイルできるようになれば、期待する診断の検査が失敗し、注記と例の見直しが必要になる。

Providerを使うClockの例では、旧配布版のruntimeを選ぶlockが`SES-K0102`で拒否された。`seseragi lock update`を明示実行し、runtimeのpackage version/sourceだけが更新された差分を確認した。再検証は146件すべて成功した。

## 公開前の条件

`verify:release --reviewed`は、版ごとの説明と補正の見直しを済ませたうえで実行する。CLIの版・commit・tag・release channel・clean状態を照合し、全例が成功した場合だけ検証記録を保存する。例、manifest、lock、検証条件とcheckerのハッシュも記録する。

`check`と`build`は、catalogの版・commitと検証記録が一致し、検証入力のハッシュが変わっていないことを要求する。CLIやネットワークがないVercelのビルドでも同じ条件を確認する。新しい版や入力を記録なしに公開することはできない。

更新漏れ、別commitのCLI、古い検証記録、code内の未解決component、package versionとの混同を対象とした7件の回帰テストが成功した。Astroの型検査と静的ビルドも成功した。手順はREADMEの「対応版の更新」にまとめた。

ブラウザでは日英の該当8ページずつについて、見出しと本文の版を照合し、検索インデックスにも実際の番号が入ることを確認する。既存の全222ルート、検索・コピー・配色・言語切替・no-JS本文・スマホ表示の検査も使用する。この記録は実行・管理方法の確認であり、実際の初見読者による評価とは区別する。
