import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { structure } from "fumadocs-core/mdx-plugins";
import { readExample } from "./example-source.mjs";
import { checkVersionSource, resolveDocsVersion, versionComponent } from "../src/lib/docs-version.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const errors = [];
const walk = (directory) => readdirSync(directory).flatMap((name) => {
  const path = resolve(directory, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const pages = new Map();
const paths = new Map();
const text = (path) => readFileSync(path, "utf8");
const catalog = JSON.parse(text(resolve(root, "src/data/standard-library.json")));
for (const name of ["library-modules.json", "library-signature-overrides.json"]) {
  const descriptions = JSON.parse(text(resolve(root, "src/data", name)));
  for (const [identity, value] of Object.entries(descriptions)) {
    for (const field of ["ja", "en", "jaNote", "enNote"]) {
      if (typeof value[field] === "string") for (const error of checkVersionSource(value[field])) errors.push(`${name}: ${identity}.${field}: ${error}`);
    }
  }
}
const bodyOf = (source) => source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
const checkedExamples = ["examples/hello.ssrg", "examples/parcel.ssrg"];
for (const name of readdirSync(resolve(root, "examples"))) {
  const manifest = resolve(root, "examples", name, "checks.json");
  if (existsSync(manifest)) checkedExamples.push(...JSON.parse(text(manifest)).map((example) => example.file));
}
for (const [directory, base] of [["content/docs", "/docs"], ["content/en", "/en/docs"]]) {
  for (const file of walk(resolve(root, directory)).filter((path) => /\.mdx?$/.test(path))) {
    const source = text(file);
    const name = relative(resolve(root, directory), file);
    const route = `${base}/${name.replace(/\.mdx?$/, "").replace(/(^|\/)index$/, "")}`.replace(/\/$/, "");
    const body = bodyOf(source);
    if (!/^---\r?\n/.test(source) || !/^title: .+/m.test(source) || !/^description: .+/m.test(source)) errors.push(`${name}: missing title/description`);
    if (pages.has(route)) errors.push(`Duplicate route ${route}`);
    const headings = new Set(structure(resolveDocsVersion(body, catalog.languageVersion)).headings.map((heading) => heading.id));
    pages.set(route, { file, body, headings, en: base.startsWith("/en") });
    paths.set(file, route);
    if (!name.startsWith("reference/library/")) {
      for (const error of checkVersionSource(source)) errors.push(`${route}: ${error}`);
    }
    if (/<!--\s*example:/.test(body)) errors.push(`${route}: use MDX JSX comments for example markers`);
    for (const match of body.matchAll(/\{\/\*\s*example:\s*(examples\/[^\s*]+)\s*\*\/\}\s*\n\s*```([^\s`]+)[^\n]*\n([\s\S]*?)\n```/g)) {
      try {
        if (readExample(match[1], root) !== match[3].trimEnd()) errors.push(`${route}: displayed code differs from ${match[1]}`);
        const file = match[1].split("#")[0];
        const languages = file.endsWith(".ssrg") ? ["seseragi", "ssrg"] : file.endsWith(".tsx") ? ["tsx"] : file.endsWith(".ts") ? ["typescript", "ts"] : undefined;
        if (languages && !languages.includes(match[2])) errors.push(`${route}: ${file} requires a ${languages[0]} code fence, got ${match[2]}`);
        const covered = checkedExamples.some((checked) => file === checked || (existsSync(resolve(root, checked)) && statSync(resolve(root, checked)).isDirectory() && file.startsWith(checked.replace(/\/$/, "") + "/")));
        if (match[1].includes("#") && !covered) errors.push(`${route}: excerpt is not in a checked example ${match[1]}`);
      } catch (error) { errors.push(`${route}: ${error.message}`); }
    }
    for (const match of body.matchAll(/```seseragi[^\n]*\n([\s\S]*?)\n```/g)) {
      const lines = match[1].split("\n");
      for (const [i, line] of lines.entries()) {
        // Ignore quoted operators in strings/comments. Pipeline source syntax
        // must begin the line and align with the preceding pipeline subject.
        const code = line.replace(/\/\/.*$/, "");
        if (!code.includes("|>") || /["`].*\|>/.test(code)) continue;
        if (!/^\s*\|>/.test(code) || (code.match(/\|>/g) ?? []).length !== 1) errors.push(`${route}: horizontal pipeline ${line.trim()}`);
        if (i === 0 || line.match(/^\s*/)[0] !== lines[i - 1].match(/^\s*/)[0]) errors.push(`${route}: misaligned pipeline ${line.trim()}`);
      }
    }
  }
}
const known = new Set(["/", "/en", ...pages.keys()]);
for (const [route, page] of pages) {
  const counterpart = page.en ? route.replace(/^\/en/, "") : `/en${route}`;
  if (!pages.has(counterpart)) errors.push(`${route}: missing translation ${counterpart}`);
  else if (page.body.split(versionComponent).length !== pages.get(counterpart).body.split(versionComponent).length) errors.push(`${route}: translation version references differ`);
  const links = [
    ...Array.from(page.body.matchAll(/\]\(([^\s)]+)(?:\s+[^)]*)?\)/g), (match) => match[1]),
    ...Array.from(page.body.matchAll(/\bhref=["']([^"']+)["']/g), (match) => match[1]),
  ];
  for (const href of links) {
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/(blob|tree)\//.test(href) && (/\.mdx?(?:[#?]|$)/.test(href) || href.includes("/docs/"))) errors.push(`${route}: GitHub documentation redirect ${href}`);
    if (!href.startsWith("/") && !href.startsWith("#")) continue;
    const url = new URL(href, `https://docs.test${route}`);
    const target = url.pathname.replace(/\/$/, "") || "/";
    if (!known.has(target)) errors.push(`${route}: broken link ${href}`);
    else if (url.hash && pages.has(target) && !pages.get(target).headings.has(decodeURIComponent(url.hash.slice(1)))) errors.push(`${route}: missing heading ${href}`);
    if (page.en && target.startsWith("/docs")) errors.push(`${route}: English page links to Japanese ${href}`);
    if (!page.en && target.startsWith("/en/docs")) errors.push(`${route}: Japanese page links to English ${href}`);
  }
}
for (const directory of ["content/docs", "content/en"]) {
  for (const file of walk(resolve(root, directory)).filter((path) => path.endsWith("meta.json"))) {
    const meta = JSON.parse(text(file));
    for (const item of meta.pages ?? []) {
      if (item.startsWith("---")) continue;
      if (!existsSync(resolve(dirname(file), `${item}.mdx`)) && !existsSync(resolve(dirname(file), `${item}.md`)) && !existsSync(resolve(dirname(file), item, "index.mdx"))) errors.push(`${relative(root, file)}: nonexistent chapter ${item}`);
    }
    const other = file.replace("content/docs", "content/en");
    if (other !== file && existsSync(other)) {
      const order = (value) => (value.pages ?? []).filter((item) => !item.startsWith("---"));
      if (JSON.stringify(order(meta)) !== JSON.stringify(order(JSON.parse(text(other))))) errors.push(`${relative(root, file)}: translation chapter order differs`);
    }
  }
}
const translationsPath = resolve(root, "src/data/library-descriptions.ja.json");
if (existsSync(translationsPath)) {
  const translations = JSON.parse(text(translationsPath));
  for (const description of new Set(catalog.items.map((item) => item.description))) if (!translations[description]) errors.push(`Missing API translation: ${description}`);
} else errors.push("Missing Japanese API descriptions.");
for (const module of catalog.modules.filter((module) => module.status !== "contract-only")) {
  const slug = module.specifier.replace(/^std\//, "").replaceAll("/", "-");
  for (const base of ["/docs", "/en/docs"]) {
    const page = pages.get(`${base}/reference/library/${slug}`);
    if (!page) errors.push(`Missing API module page ${module.specifier}`);
    else {
      const names = catalog.items.filter((item) => item.module === module.specifier).map((item) => item.name);
      for (const name of names) if (!page.body.includes(`### \`${name}\``)) errors.push(`Missing API ${module.specifier}::${name}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Content: ${pages.size} localized pages; links, anchors, chapter order, examples, pipelines, and ${catalog.items.length} API symbols verified.`);
