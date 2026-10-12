import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { readExample } from "./example-source.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const readJSON = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const snapshot = readJSON("src/data/standard-library.json");
const introductions = readJSON("src/data/library-modules.json");
const translations = readJSON("src/data/library-descriptions.ja.json");
const descriptionRules = readJSON("src/data/library-description-overrides.json");
const notes = readJSON("src/data/library-notes.json");
const signatureOverrides = readJSON("src/data/library-signature-overrides.json");
const fields = readJSON("src/data/library-fields.json");
const checks = readJSON("examples/library/checks.json");
const examples = readJSON("src/data/library-examples.json");
const verifyOnly = process.argv.includes("--check");
const writePage = (path, content) => {
  if (verifyOnly) {
    if (readFileSync(path, "utf8") !== content) throw new Error(`Stale generated page: ${path}. Run bun run render:library.`);
  } else writeFileSync(path, content);
};
const slugOf = (specifier) => specifier.replace(/^std\//, "").replaceAll("/", "-");
const identities = new Set(snapshot.items.flatMap((item) => [item.identity, `${item.module}::${item.name}`]));
for (const [identity, value] of Object.entries(descriptionRules.overrides)) {
  if (!identities.has(identity)) throw new Error(`Unknown description override: ${identity}`);
  if (!value.suppress && (!value.ja || !value.en)) throw new Error(`Unpaired description override: ${identity}`);
}
for (const [specifier, value] of Object.entries(notes)) {
  if (!snapshot.modules.some((module) => module.specifier === specifier && module.status !== "contract-only")) throw new Error(`Unknown notes module: ${specifier}`);
  if (!value.ja?.length || value.ja.length !== value.en?.length) throw new Error(`Unpaired module notes: ${specifier}`);
}

for (const [identity, value] of Object.entries(signatureOverrides)) {
  const original = snapshot.items.find((item) => item.identity === identity);
  if (!original || value.languageVersion !== snapshot.languageVersion || original.signature !== value.catalogSignature) throw new Error(`Review signature correction for the current release: ${identity}`);
  if (!value.signature || !value.jaNote || !value.enNote || !value.source) throw new Error(`Incomplete signature correction: ${identity}`);
}
for (const item of snapshot.items.filter((item) => item.kind === "struct")) {
  const value = fields[item.identity];
  if (!value?.declaration || !value.fields?.length || !value.source) throw new Error(`Missing public struct fields: ${item.identity}`);
  if (value.fields.some((field) => !field.name || !field.type || !field.ja || !field.en)) throw new Error(`Unpaired struct field: ${item.identity}`);
}
for (const identity of Object.keys(fields)) {
  if (!snapshot.items.some((item) => item.identity === identity && item.kind === "struct")) throw new Error(`Not a public struct: ${identity}`);
}
for (const [specifier, recipes] of Object.entries(examples)) {
  if (!snapshot.modules.some((module) => module.specifier === specifier && module.status !== "contract-only")) throw new Error(`Unknown examples module: ${specifier}`);
  const byFile = new Map();
  for (const recipe of recipes) {
    if (!recipe.jaTitle || !recipe.enTitle || !recipe.ja || !recipe.en || typeof recipe.stdout !== "string") throw new Error(`Incomplete paired recipe: ${recipe.example}`);
    if (!recipe.example.startsWith("examples/library/") || !recipe.example.includes("#")) throw new Error(`Recipe needs a checked excerpt: ${recipe.example}`);
    const snippet = readExample(recipe.example);
    if (snippet.split("\n").some((line) => line.length > 37)) throw new Error(`Recipe exceeds the mobile line budget: ${recipe.example}`);
    const [file, region] = recipe.example.split("#");
    const group = byFile.get(file) ?? [];
    group.push({ region, stdout: recipe.stdout });
    byFile.set(file, group);
  }
  for (const [file, outputs] of byFile) {
    const check = checks.find((check) => check.file === file && check.mode === "run");
    if (!check || check.stdout !== outputs.map((entry) => entry.stdout).join("")) throw new Error(`Recipe outputs differ from the run check: ${file}`);
    const regions = [...readFileSync(resolve(root, file), "utf8").matchAll(/^\s*\/\/\s*docs:start\s+([a-z][a-z0-9-]*)\s*$/gm)].map((match) => match[1]);
    if (JSON.stringify(regions) !== JSON.stringify(outputs.map((entry) => entry.region))) throw new Error(`Recipe order differs from its checked source: ${file}`);
  }
}
const groups = {
  core: ["基本の型と結果", "Core types and results", "maybe-and-either"],
  collections: ["コレクション", "Collections", "arrays-and-lists"],
  text: ["文字と文字列", "Text and Unicode", "values-and-expressions"],
  numbers: ["数値", "Numbers", "values-and-expressions"],
  data: ["BytesとJSON", "Bytes and JSON", "records-and-structs"],
  effects: ["Effectと状態", "Effects and state", "effects"],
  system: ["時刻・I/O・process", "Time, I/O, and processes", "effects"],
  web: ["Webと通信", "Web and networking", "effects"],
  testing: ["テストと性能測定", "Testing and benchmarks", "functions-and-pipelines"],
  transformers: ["Monad transformer", "Monad transformers", "type-classes"],
};
const escape = (value) => value.replaceAll("<", "&lt;").replaceAll("{", "\\{").replaceAll("}", "\\}");
const code = (value) => "```text\n" + value + "\n```\n";

// Break signatures at type boundaries, preserving every type/field/constraint.
// Parameter labels generated as arg1/arg2 are omitted from this type notation.
function splitTop(value, delimiter) {
  const result = [];
  let depth = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if ("({<".includes(char)) depth++;
    if (")}>".includes(char) && value[i - 1] !== "-") depth--;
    if (depth === 0 && value.startsWith(delimiter, i)) {
      result.push(value.slice(start, i).trim());
      i += delimiter.length - 1;
      start = i + 1;
    }
  }
  result.push(value.slice(start).trim());
  return result;
}
function pretty(value, indent = 0) {
  const padding = " ".repeat(indent);
  if (indent + value.length <= 36) return [padding + value];
  const arrows = splitTop(value, " -> ");
  if (arrows.length > 1) return arrows.flatMap((part, i) => {
    const lines = pretty(part, Math.min(indent + (i ? 3 : 0), 10));
    if (i) lines[0] = padding + "-> " + lines[0].trimStart();
    return lines;
  });
  const open = value.search(/[<{(]/);
  if (open >= 0) {
    const pairs = { "<": ">", "{": "}", "(": ")" };
    const opening = value[open], closing = pairs[opening];
    let depth = 0, end = -1;
    for (let i = open; i < value.length; i++) {
      if (value[i] === opening) depth++;
      if (value[i] === closing && value[i - 1] !== "-" && --depth === 0) { end = i; break; }
    }
    if (end > open && value.slice(open + 1, end).trim()) {
      const inner = value.slice(open + 1, end);
      const pieces = splitTop(inner, ",");
      return [padding + value.slice(0, open + 1), ...pieces.flatMap((part, i) => {
        const lines = pretty(part, Math.min(indent + 2, 10));
        if (i < pieces.length - 1) lines[lines.length - 1] += ",";
        return lines;
      }), padding + value.slice(end)];
    }
  }
  const colon = value.indexOf(": ");
  if (colon > 0) return [padding + value.slice(0, colon + 1), ...pretty(value.slice(colon + 2), Math.min(indent + 2, 10))];
  return [padding + value];
}
function signatureOf(item) {
  const value = item.signature ?? item.name;
  if (!["function", "effect-function", "constructor"].includes(item.kind)) return pretty(value).join("\n");
  let rest = value.startsWith(item.name) ? value.slice(item.name.length) : value;
  let prefix = item.name;
  if (rest.startsWith("<")) {
    let depth = 0, end = 0;
    for (; end < rest.length; end++) {
      if (rest[end] === "<") depth++;
      if (rest[end] === ">" && rest[end - 1] !== "-" && --depth === 0) break;
    }
    prefix += rest.slice(0, end + 1);
    rest = rest.slice(end + 1);
  }
  const [types, constraints] = rest.trim().split(" where ");
  const chunks = splitTop(types ?? "", " -> ").map((part) => part.replace(/^\w+:\s*/, ""));
  const lines = pretty(prefix);
  chunks.forEach((part, i) => {
    if (!part) return;
    const formatted = pretty(part, i ? 5 : 2);
    if (i) formatted[0] = "  -> " + formatted[0].trimStart();
    lines.push(...formatted);
  });
  if (constraints) lines.push("where", ...splitTop(constraints, ",").flatMap((part, i, all) => {
    const formatted = pretty(part, 2);
    if (i < all.length - 1) formatted[formatted.length - 1] += ",";
    return formatted;
  }));
  return lines.join("\n");
}
const kindLabels = {
  function: ["関数", "Function"], "effect-function": ["Effectを返す関数", "Function returning Effect"],
  constructor: ["コンストラクタ", "Constructor"], type: ["型", "Type"], struct: ["struct", "Struct"],
  "opaque-type": ["内部表現を隠した型", "Opaque type"], "opaque-struct": ["内部表現を隠したstruct", "Opaque struct"],
  alias: ["型alias", "Type alias"], trait: ["型クラス", "Type class"], value: ["値", "Value"], operator: ["演算子", "Operator"],
};
const fallback = new Set(descriptionRules.suppressDescriptions);
const memberGroups = [
  [["type", "opaque-type", "struct", "opaque-struct", "alias", "trait"], "型と型クラス", "Types and type classes"],
  [["constructor", "value"], "コンストラクタと値", "Constructors and values"],
  [["function", "effect-function", "operator"], "関数と演算子", "Functions and operators"],
];
for (const locale of ["ja", "en"]) {
  const en = locale === "en";
  const base = en ? "/en/docs" : "/docs";
  const directory = resolve(root, en ? "content/en/reference/library" : "content/docs/reference/library");
  mkdirSync(directory, { recursive: true });
  const order = ["index"];
  const available = snapshot.modules.filter((module) => module.status !== "contract-only");
  const uniqueCount = new Set(snapshot.items.map((item) => `${item.module}::${item.name}`)).size;
  let index = `---\ntitle: ${en ? "Standard library" : "標準ライブラリ"}\ndescription: ${en ? "Find modules by purpose and look up their public types, functions, constraints, and supported environments." : "用途からmoduleを選び、公開型・関数・制約・対応環境を調べる。"}\n---\n\n`;
  index += en ? `This reference covers ${uniqueCount.toLocaleString("en-US")} public names across ${available.length} standard library interfaces, including Prelude, in Seseragi ${snapshot.languageVersion}. Choose a module below, then look up its types and functions.\n\n` : `Seseragi ${snapshot.languageVersion}の標準ライブラリを、Preludeを含む${available.length}の項目に分け、${uniqueCount.toLocaleString("en-US")}の公開名を収録しています。用途からmoduleを選び、その型と関数を確認できます。\n\n`;
  index += en ? `## Read the types\n\nFunction arguments are curried. Types are listed in argument order, followed by the result. Most collection operations take their subject last, so you can use a [vertical pipeline](${base}/learn/functions-and-pipelines). A \`where\` clause lists the required [type classes](${base}/reference/type-classes). These signatures are type notation, not executable declarations.\n\n\`Effect<R, E, A>\` describes requirements, typed failure, and success. An imported module does not execute an Effect or supply its provider. See [Effect](${base}/reference/effects) and [runtime providers](${base}/reference/runtime-providers). Opaque types hide their representation; do not assume every error type has a \`Show\` instance.\n\n` : `## 型の読み方\n\n関数はカリー化されています。型は引数の順に並び、最後が結果の型です。コレクションの操作では、処理対象を最後の引数に置く関数が多く、[縦に並べたパイプライン](${base}/learn/functions-and-pipelines)へつなげられます。\`where\`は必要な[型クラス](${base}/reference/type-classes)の制約です。掲載するsignatureは型の表記であり、実行する定義ではありません。\n\n\`Effect<R, E, A>\`の型引数は、必要な環境、型付きの失敗、成功値を表します。moduleをimportしてもEffectは実行されず、providerが提供されるわけでもありません。[Effect](${base}/reference/effects)と[runtime provider](${base}/reference/runtime-providers)で境界を確認できます。内部表現を隠した型には、必ずしも\`Show\`のinstanceがあるとは限りません。\n\n`;
  index += en ? `## Execution environments\n\n\`process\` means a CLI/server process; \`browser\` means a Web app or Playground browser execution. A portable interface can still require a capability supported by the chosen provider. Check requirements and failures in each signature, not only the module's target list.\n\n` : `## 実行環境\n\n\`process\`はCLIやserverのprocess、\`browser\`はWebアプリやPlaygroundのブラウザ実行を表します。両環境のinterfaceがあっても、選んだproviderが必要な能力を提供する必要があります。moduleの対応環境だけでなく、signatureの環境と失敗型も確認してください。\n\n`;
  for (const [group, [jaTitle, enTitle]] of Object.entries(groups)) {
    const title = en ? enTitle : jaTitle;
    order.push(`---${title}---`);
    index += `## ${title}\n\n| Module | ${en ? "Purpose" : "用途"} | ${en ? "Environment" : "環境"} |\n| --- | --- | --- |\n`;
    for (const module of available.filter((module) => introductions[module.specifier].group === group)) {
      const slug = slugOf(module.specifier);
      const intro = introductions[module.specifier];
      order.push(slug);
      index += `| [\`${module.specifier}\`](${base}/reference/library/${slug}) | ${intro[locale]} | ${module.targets.join(" / ")} |\n`;
    }
    index += "\n";
  }
  index += en ? `## Contracts without an implementation\n\n\`std/http/bun\` has a specified identity but no public interface in ${snapshot.languageVersion}. It cannot be imported. For a currently available server API, use [\`std/http/server\`](${base}/reference/library/http-server).\n` : `## まだ提供されていない契約\n\n\`std/http/bun\`はidentityと契約を持ちますが、${snapshot.languageVersion}の公開interfaceはなく、importできません。現在提供されているserver APIは[\`std/http/server\`](${base}/reference/library/http-server)で確認してください。\n`;
  writePage(resolve(directory, "index.mdx"), index);
  writePage(resolve(directory, "meta.json"), JSON.stringify({ title: en ? "Standard library" : "標準ライブラリ", pages: order }, null, 2) + "\n");
  for (const module of available) {
    const slug = slugOf(module.specifier), intro = introductions[module.specifier];
    let page = `---\ntitle: ${JSON.stringify(module.specifier)}\ndescription: ${JSON.stringify(intro[locale])}\n---\n\n`;
    page += `| ${en ? "Contract" : "項目"} | ${en ? "Value" : "内容"} |\n| --- | --- |\n| ${en ? "Language version" : "言語の版"} | ${snapshot.languageVersion} |\n| ${en ? "Environment" : "対応環境"} | ${module.targets.join(" / ")} |\n`;
    if (module.services.length) page += `| ${en ? "Capability identities" : "能力のidentity"} | ${module.services.map((service) => `\`${service}\``).join("、")} |\n`;
    page += "\n";
    if (module.status === "implicit") page += en ? "Prelude names are available without an import. Purpose-specific operations live in explicit modules.\n\n" : "Preludeの名前はimportせずに使えます。用途ごとの操作は明示的なmoduleへ分けられています。\n\n";
    else {
      const declaration = `import * as ${slug.replaceAll("-", "_")}`;
      const target = `from "${module.specifier}"`;
      const snippet = `${declaration} ${target}`.length > 37 ? `${declaration}\n  ${target}` : `${declaration} ${target}`;
      page += `## ${en ? "Import" : "import"}\n\n\`\`\`seseragi\n${snippet}\n\`\`\`\n\n`;
    }
    const example = checks.find((example) => example.file.endsWith(`/${slug}.ssrg`));
    if (example) {
      page += `## ${en ? "Example" : "使ってみる"}\n\n{/* example: ${example.file} */}\n\n\`\`\`seseragi\n${readFileSync(resolve(root, example.file), "utf8").trimEnd()}\n\`\`\`\n\n${en ? "Output:" : "出力:"}\n\n${code(example.stdout.trimEnd())}\n`;
    }
    if (examples[module.specifier]?.length) {
      page += `## ${en ? "Try specific cases" : "目的から試す"}\n\n`;
      page += en ? `Each excerpt can be tried on its own inside the \`do\` block of \`main\`, using this page's import. The output below each excerpt is verified against its complete program. For the entry point and execution steps, see [your first program](${base}/learn/first-program) and [Effect](${base}/learn/effects).\n\n` : `各断片は、このページ冒頭のimportを使い、\`main\`の\`do\`ブロック内で一つずつ試せます。下に示す出力は、断片を含むプログラムで確認しています。入口と実行手順は[最初のプログラム](${base}/learn/first-program)、\`do\`の順次実行は[Effect](${base}/learn/effects)を参照してください。\n\n`;
      for (const recipe of examples[module.specifier]) {
        page += `### ${recipe[en ? "enTitle" : "jaTitle"]}\n\n${escape(recipe[locale])}\n\n{/* example: ${recipe.example} */}\n\n\`\`\`seseragi\n${readExample(recipe.example)}\n\`\`\`\n\n${en ? "Output:" : "出力:"}\n\n${code(recipe.stdout.trimEnd())}\n`;
      }
    }
    if (notes[module.specifier]) {
      page += `## ${en ? "Choosing operations" : "選び方と注意"}\n\n`;
      page += notes[module.specifier][locale].map((note) => `- ${note}`).join("\n") + "\n\n";
    }
    page += `## ${en ? "Use this reference" : "このページの読み方"}\n\n`;
    page += en ? `The signatures below show types in argument order, then the result. See [how to read library types](${base}/reference/library#read-the-types) for currying, constraints, and Effect requirements.\n\n` : `以下のsignatureは引数の順に型を並べ、最後に結果の型を示します。カリー化・制約・Effectの環境については[型の読み方](${base}/reference/library#型の読み方)で確認できます。\n\n`;
    const records = new Map();
    for (const item of snapshot.items.filter((item) => item.module === module.specifier)) {
      const previous = records.get(item.name);
      if (!previous || (item.signature && !item.signature.includes("arg1:") && previous.signature?.includes("arg1:"))) records.set(item.name, item);
    }
    for (const [kinds, jaTitle, enTitle] of memberGroups) {
      const members = [...records.values()].filter((item) => kinds.includes(item.kind)).sort((a, b) => a.name.localeCompare(b.name));
      if (!members.length) continue;
      page += `## ${en ? enTitle : jaTitle}\n\n`;
      for (const item of members) {
        const roles = [...new Set(snapshot.items.filter((row) => row.module === module.specifier && row.name === item.name).map((row) => row.kind))];
        page += `### \`${item.name}\`${item.kind === "operator" ? " / " + (item.signature?.split(" via ")[1] ?? "List cons") : ""}\n\n<small className="api-kind">${roles.map((kind) => kindLabels[kind][en ? 1 : 0]).join(" / ")}</small>\n\n`;
        const override = descriptionRules.overrides[item.identity]
          ?? descriptionRules.overrides[`${item.module}::${item.name}`];
        if (override && !override.suppress) {
          page += escape(override[locale]) + "\n\n";
        } else if (!override?.suppress && !fallback.has(item.description)) {
          if (!translations[item.description]) throw new Error(`Missing Japanese description: ${item.description}`);
          page += escape(en ? item.description : translations[item.description]) + "\n\n";
        }
        const corrected = signatureOverrides[item.identity];
        const structure = fields[item.identity];
        const signature = structure
          ? [...pretty(structure.declaration + " {"), ...structure.fields.flatMap((field, i, all) => {
              const lines = pretty(`${field.name}: ${field.type}`, 2);
              if (i < all.length - 1) lines[lines.length - 1] += ",";
              return lines;
            }), "}"].join("\n")
          : signatureOf(corrected ? { ...item, signature: corrected.signature } : item);
        const block = code(signature);
        page += signature.split("\n").length > 16 ? `<details>\n<summary>${en ? "Show the complete type" : "完全な型を表示"}</summary>\n\n${block}\n</details>\n\n` : block + "\n";
        if (corrected) page += corrected[en ? "enNote" : "jaNote"] + "\n\n";
        if (structure) page += structure.fields.map((field) => `- \`${field.name}\`: ${field[locale]}`).join("\n") + "\n\n";
      }
    }
    const lesson = module.specifier.startsWith("std/web/") || module.specifier === "std/signal"
      ? "signals" : groups[intro.group][2];
    page += `## ${en ? "Related pages" : "関連する説明"}\n\n`;
    page += `- [${en ? "Learn the underlying concepts" : "基本となる考え方を学ぶ"}](${base}/learn/${lesson})\n- [${en ? "Browse modules by purpose" : "用途からmoduleを探す"}](${base}/reference/library)\n`;
    if (module.specifier.startsWith("std/web/")) page += `- [${en ? "Web UI contract" : "Web UIの規則"}](${base}/reference/web-ui)\n`;
    if (module.specifier === "std/test") page += `- [${en ? "Test an application" : "アプリをテストする"}](${base}/guides/testing)\n`;
    if (module.specifier === "std/benchmark") page += `- [${en ? "Measure performance" : "性能を測る"}](${base}/reference/performance)\n`;
    if (module.services.length) page += `- [${en ? "Runtime requirements and providers" : "実行時の環境とprovider"}](${base}/reference/runtime-providers)\n`;
    writePage(resolve(directory, `${slug}.mdx`), page);
  }
}
console.log(verifyOnly ? "Library: generated pages match the catalog, curated descriptions, notes, and examples." : "Generated paired library pages from the committed compiler catalog and curated descriptions.");
