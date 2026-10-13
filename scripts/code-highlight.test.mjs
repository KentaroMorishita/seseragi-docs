import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import config from "../astro.config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
// Use the site's configured Fumadocs grammar and dual-theme renderer, rather
// than a separate Shiki setup that could pass while the site stays uncolored.
const renderer = await config.markdown.processor.createRenderer({ syntaxHighlight: false });
const fences = (source) => [...source.matchAll(/^```([^\s`]+)([^\n]*)\n([\s\S]*?)\n```/gm)]
  .map((match) => ({ language: match[1], meta: match[2], source: match[3] }));
const read = (path) => readFileSync(resolve(root, path), "utf8");
const render = async (language, source) => (await renderer.render("```" + language + "\n" + source + "\n```")).code;
const codeHtml = (html) => html.match(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/)?.[1] ?? "";
const colors = (html, theme) => new Set([...codeHtml(html).matchAll(new RegExp(`--shiki-${theme}:([^;\"]+)`, "g"))].map((match) => match[1].toLowerCase()));

async function assertHighlighted(language, source, label = language) {
  const html = await render(language, source);
  assert.ok(codeHtml(html), `${label}: no rendered code`);
  for (const theme of ["light", "dark"]) {
    assert.ok(colors(html, theme).size > 1, `${label}: ${theme} tokens lost their syntax colors`);
  }
  return html;
}

test("the configured renderer highlights Seseragi and the other source languages", async () => {
  const sources = {
    seseragi: "fn add x: Int -> y: Int -> Int =\n  x + y",
    ssrg: "pub effect fn main =\n  println \"Hello\"",
    typescript: "const answer: number = 42;",
    tsx: "export function Hello() {\n  return <p>Hello</p>;\n}",
    javascript: "const answer = 42;",
    toml: '[package]\nname = "hello"\nversion = "0.1.0"',
    json: '{ "name": "hello", "count": 2 }',
    sh: 'seseragi run "hello.ssrg"',
    bash: 'seseragi run "hello.ssrg"',
    html: '<button type="button">Run</button>',
  };
  for (const [language, source] of Object.entries(sources)) await assertHighlighted(language, source);
});

test("both effects references color compact and contract declarations", async () => {
  const paired = [];
  for (const locale of ["docs", "en"]) {
    const declarations = fences(read(`content/${locale}/reference/effects.mdx`))
      .filter((fence) => /title="(?:compact form|contract form)"/i.test(fence.meta));
    assert.equal(declarations.length, 2);
    for (const declaration of declarations) {
      assert.equal(declaration.language, "seseragi", declaration.meta);
      assert.ok(declaration.source.split("\n").every((line) => line.length <= 37));
      const html = await assertHighlighted("seseragi", declaration.source, declaration.meta);
      // The image report concerned the whole declaration becoming gray.
      // Require the keyword, function name, and String type to retain tokens.
      for (const token of ["effect", "fn", "greet", "String"]) {
        assert.match(html, new RegExp(`<span style="[^\"]*--shiki-dark:[^\"]+">\\s*${token}</span>`));
      }
    }
    paired.push(declarations.map((fence) => fence.source));
  }
  assert.deepEqual(paired[0], paired[1]);
});

test("authored declarations and type fragments cannot silently become text fences", () => {
  const fragmentStarts = /^(?:(?:pub\s+)?(?:effect\s+)?fn\b|(?:pub\s+)?(?:type|struct|alias|trait|operator|let|match)\b|Effect<)/m;
  for (const locale of ["docs", "en"]) {
    for (const section of ["learn", "reference"]) {
      const directory = resolve(root, `content/${locale}/${section}`);
      for (const name of readdirSync(directory).filter((name) => name.endsWith(".mdx"))) {
        const path = `content/${locale}/${section}/${name}`;
        for (const fence of fences(read(path))) {
          if (fence.language !== "text") continue;
          assert.ok(!fragmentStarts.test(fence.source), `${path}: source fragment mislabeled as text`);
        }
      }
    }
  }
});

test("stdout and plaintext keep their plain token appearance", async () => {
  // Syntax-looking output is still output; never guess its language.
  const source = 'True\nPoint { x: 1, y: 2 }\nfn is printed text';
  for (const language of ["text", "plaintext"]) {
    const html = await render(language, source);
    assert.ok(codeHtml(html));
    assert.equal(colors(html, "light").size, 0);
    assert.equal(colors(html, "dark").size, 0);
  }
});

test("the library generator highlights signatures while preserving plaintext output", async (context) => {
  // Run the real generator in a scratch repository, leaving shared generated
  // pages untouched. This catches accidentally coloring stdout or retaining
  // text fences in the signature call site, not just in a helper's unit test.
  const temporary = mkdtempSync(resolve(tmpdir(), "seseragi-highlight-"));
  try {
    mkdirSync(resolve(temporary, "scripts"));
    mkdirSync(resolve(temporary, "src/lib"), { recursive: true });
    for (const name of ["render-library.mjs", "example-source.mjs"]) cpSync(resolve(root, "scripts", name), resolve(temporary, "scripts", name));
    cpSync(resolve(root, "src/lib/docs-version.mjs"), resolve(temporary, "src/lib/docs-version.mjs"));
    cpSync(resolve(root, "src/data"), resolve(temporary, "src/data"), { recursive: true });
    cpSync(resolve(root, "examples/library"), resolve(temporary, "examples/library"), { recursive: true });
    const result = spawnSync(process.execPath, [resolve(temporary, "scripts/render-library.mjs")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    let signatures = 0, outputs = 0;
    for (const locale of ["docs", "en"]) {
      const directory = resolve(temporary, `content/${locale}/reference/library`);
      for (const name of readdirSync(directory).filter((name) => name.endsWith(".mdx"))) {
        const source = readFileSync(resolve(directory, name), "utf8");
        const signatureSections = source.split(/^### `[^`]+`[^\n]*$/m).slice(1);
        for (const section of signatureSections) {
          const signature = fences(section)[0];
          assert.ok(signature, `${locale}/${name}: missing signature`);
          assert.equal(signature.language, "seseragi", `${locale}/${name}: signature is plaintext`);
          signatures++;
        }
        for (const output of source.matchAll(/^(?:出力|Output):\n\n```([^\n]+)\n([\s\S]*?)\n```/gm)) {
          assert.equal(output[1], "text", `${locale}/${name}: output was colored as source`);
          outputs++;
        }
      }
      const prelude = readFileSync(resolve(directory, "prelude.mdx"), "utf8");
      const mapSection = prelude.split("### `map`")[1]?.split(/^### /m)[0];
      const mapSignature = mapSection && fences(mapSection)[0];
      assert.ok(mapSignature, `${locale}: generated map signature missing`);
      await assertHighlighted(mapSignature.language, mapSignature.source, `${locale}: generated map signature`);
    }
    assert.ok(signatures > 0);
    assert.ok(outputs > 0);
    context.diagnostic(`${signatures} generated signatures highlighted; ${outputs} outputs remain text.`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
