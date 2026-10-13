import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readExample } from "./example-source.mjs";

const base = (process.env.SITE_URL ?? "http://127.0.0.1:4322").replace(/\/$/, "");
const canonicalOrigin = "https://seseragi-docs.vercel.app";
const { languageVersion } = JSON.parse(readFileSync(new URL("../src/data/standard-library.json", import.meta.url), "utf8"));
const quick = process.argv.includes("--quick");
const output = resolve(process.env.QA_OUTPUT ?? "/tmp/seseragi-docs-browser");
mkdirSync(output, { recursive: true });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [], overflows = [], pagesChecked = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const watch = (target) => {
  target.on("pageerror", (error) => errors.push({ path: target.url(), message: error.message }));
  target.on("console", (message) => { if (message.type() === "error") errors.push({ path: target.url(), message: message.text() }); });
};
watch(page);
page.setDefaultTimeout(15000);
const ready = async (target) => target.waitForFunction(() => [...document.querySelectorAll("astro-island")].every((island) => !island.hasAttribute("ssr")));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  const sitemap = await context.request.get(`${base}/sitemap.xml`);
  assert(sitemap.status() === 200, "Missing sitemap");
  const paths = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]);
    assert(url.origin === canonicalOrigin, `Wrong sitemap domain ${url.origin}`);
    return url.pathname;
  });
  assert(paths.length >= 200, "Incomplete official docs sitemap");
  const httpBatchSize = base === canonicalOrigin ? 3 : 12;
  for (let i = 0; i < paths.length; i += httpBatchSize) {
    const results = await Promise.all(paths.slice(i, i + httpBatchSize).map(async (path) => {
      const response = await context.request.get(base + path);
      assert(response.status() === 200, `HTTP ${response.status()} ${path}`);
      const html = await response.text();
      assert(/<h1\b/.test(html), `Missing heading ${path}`);
      assert(html.includes(`lang="${path.startsWith("/en") ? "en" : "ja"}"`), `Wrong language ${path}`);
      assert(html.includes(`<link rel="canonical" href="${canonicalOrigin}${path}"`), `Wrong canonical URL ${path}`);
      assert(html.includes(`<meta property="og:url" content="${canonicalOrigin}${path}"`), `Wrong social URL ${path}`);
      const japanesePath = path.replace(/^\/en(?=\/|$)/, "") || "/";
      const englishPath = japanesePath === "/" ? "/en" : `/en${japanesePath}`;
      assert(html.includes(`hreflang="ja" href="${canonicalOrigin}${japanesePath}"`) && html.includes(`hreflang="en" href="${canonicalOrigin}${englishPath}"`), `Wrong alternate language URL ${path}`);
      return path;
    }));
    pagesChecked.push(...results);
  }
  assert((await context.request.get(`${base}/does-not-exist`)).status() === 404, "Missing 404 response");
  const robots = await context.request.get(`${base}/robots.txt`);
  assert((await robots.text()).includes(`${canonicalOrigin}/sitemap.xml`), "robots sitemap domain incorrect");
  console.log(`HTTP: ${paths.length} routes, language metadata, sitemap, robots, and 404 passed.`);

  for (const prefix of ["", "/en"]) {
    for (const path of ["", "/learn", "/guides/typescript-to-seseragi", "/reference", "/reference/cli", "/reference/project-configuration", "/reference/syntax", "/reference/functions", "/reference/type-classes", "/reference/library", "/reference/library/array", "/reference/library/prelude"]) {
      await page.goto(`${base}${prefix}/docs${path}`); await ready(page);
      assert((await page.locator(".article-header .eyebrow").innerText()).includes(languageVersion), `Wrong release heading ${prefix}${path}`);
      const prose = await page.locator("div.prose.flex-1").evaluate((node) => {
        const body = node.cloneNode(true);
        body.querySelectorAll("pre").forEach((block) => block.remove());
        return body.textContent;
      });
      assert(!prose.includes(languageVersion), `Release number leaked into prose ${prefix}${path}`);
      assert(!prose.includes("LanguageVersion"), `Unresolved release component ${prefix}${path}`);
    }
    const index = await context.request.get(`${base}/api/search${prefix ? "-en" : ""}`);
    assert(index.status() === 200, `Missing ${prefix || "ja"} search index`);
    const data = await index.text();
    assert(!data.includes(languageVersion) && !data.includes("LanguageVersion"), `Release number leaked into search ${prefix || "ja"}`);
  }
  console.log(`Version: common headers use ${languageVersion}; article bodies and search in both locales omit release numbers.`);

  if (base === canonicalOrigin) {
    for (const path of ["/", "/?ref=migration", "/docs/learn/arrays-and-lists?ref=migration", "/en/docs/reference/library/maybe?ref=migration"]) {
      const response = await context.request.get(`https://seseragi-docs-site.vercel.app${path}`, { maxRedirects: 0 });
      assert(response.status() === 308, `Missing old-domain redirect ${path}`);
      assert(response.headers().location === `${canonicalOrigin}${path}`, `Redirect changed path or query ${path}`);
      assert((await context.request.get(`${canonicalOrigin}${path}`, { maxRedirects: 0 })).status() === 200, `Redirect destination loops or fails ${path}`);
    }
    console.log("Domain migration: old hostname redirects to the same path and query; the destination serves each page without a loop.");
  }

  const firstProgram = readFileSync(new URL("../examples/hello.ssrg", import.meta.url), "utf8").trim();
  for (const prefix of ["", "/en"]) {
    await page.goto(`${base}${prefix}/docs/learn/first-program`);
    assert((await page.locator("pre").first().textContent()).trim() === firstProgram, `Outdated introductory code ${prefix || "ja"}`);
  }
  console.log("Introduction: both locales display the checked, focused Hello world example.");

  const recipes = JSON.parse(readFileSync(new URL("../src/data/library-examples.json", import.meta.url), "utf8"));
  for (const [module, region] of [["std/maybe", "sequence-missing"], ["std/map", "persistent-insert"], ["std/json", "wrong-type"]]) {
    const recipe = recipes[module].find((recipe) => recipe.example.endsWith("#" + region));
    const slug = module.replace(/^std\//, "").replaceAll("/", "-");
    for (const prefix of ["", "/en"]) {
      await page.goto(`${base}${prefix}/docs/reference/library/${slug}`); await ready(page);
      await page.getByRole("heading", { name: recipe[prefix ? "enTitle" : "jaTitle"], exact: true }).waitFor();
      const blocks = await page.locator("pre").allTextContents();
      assert(blocks.some((block) => block.trim() === readExample(recipe.example)), `Outdated focused example ${prefix}/${slug}/${region}`);
      assert(blocks.some((block) => block.trim() === recipe.stdout.trim()), `Missing focused output ${prefix}/${slug}/${region}`);
    }
  }
  console.log("Focused examples: both locales display the current absence, persistence, and decoding cases with checked outputs.");

  await page.goto(base); await ready(page);
  await page.getByRole("link", { name: "用途別ガイド", exact: true }).first().click();
  await page.waitForURL(/\/docs\/guides\/?$/);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.goto(`${base}/docs/guides/forms`); await ready(page);
  await page.getByRole("button", { name: "コードをコピー", exact: true }).first().click();
  await page.getByRole("button", { name: "コピーしました", exact: true }).first().waitFor();
  const theme = await page.locator("html").getAttribute("class");
  await page.getByRole("button", { name: "配色を切り替える", exact: true }).click();
  await page.waitForFunction((before) => document.documentElement.className !== before, theme);
  await page.reload();
  assert(await page.locator("html").getAttribute("class") !== theme, "Theme persistence");
  await ready(page);
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForURL(/\/en\/docs\/guides\/forms\/?$/); await ready(page);
  assert(await page.locator("html").getAttribute("lang") === "en", "Locale switch");
  for (const [path, query, expected] of [
    ["/docs", "フォーム", "/docs/guides/forms"],
    ["/en/docs", "form", "/en/docs/guides/forms"],
    ["/docs/reference/library", "withDefault", "/docs/reference/library/maybe"],
    ["/en/docs/reference/library", "withDefault", "/en/docs/reference/library/maybe"],
  ]) {
    await page.goto(base + path); await ready(page);
    await page.locator("button[data-search-full]").first().click();
    await page.getByRole("combobox").fill(query);
    await page.getByRole("option").first().waitFor();
    const relativeId = expected.replace(/^\/en/, "").replace(/^\/docs\//, "");
    const matching = page.locator(`[role=option][id^="fd-search-option-${relativeId}"]`);
    assert(await matching.count() > 0, `Search missed ${query} ${expected}`);
    await matching.first().click();
    await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === expected);
  }
  console.log("Interaction: navigation, clipboard, theme, locales, and JA/EN guide/API search passed.");

  const mobile = await browser.newContext({ viewport: { width: 375, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage(); watch(phone);
  const representative = [
    "/", "/en", "/docs", "/en/docs", "/docs/learn",
    "/docs/learn/first-program", "/en/docs/learn/first-program",
    "/docs/learn/functions-and-pipelines", "/en/docs/learn/functions-and-pipelines",
    "/docs/learn/algebraic-data-types", "/docs/learn/pattern-matching",
    "/docs/guides", "/docs/guides/typescript-to-seseragi", "/en/docs/guides/typescript-to-seseragi",
    "/docs/guides/forms", "/en/docs/guides/forms", "/docs/guides/stateful-features",
    "/docs/reference/types", "/docs/reference/library",
    "/docs/reference/library/array", "/en/docs/reference/library/array",
    "/docs/learn/arrays-and-lists", "/en/docs/learn/arrays-and-lists",
    "/docs/learn/maybe-and-either", "/docs/learn/effects", "/docs/reference/functions",
    "/docs/reference/effects", "/en/docs/reference/effects",
    "/docs/reference/library/prelude", "/en/docs/reference/library/prelude",
    "/docs/reference/library/maybe", "/en/docs/reference/library/maybe",
    "/docs/reference/library/map", "/docs/reference/library/json", "/en/docs/reference/library/json",
    "/docs/reference/library/web-html", "/docs/reference/library/effect",
    "/docs/reference/library/regex", "/docs/reference/library/transformer-state",
  ];
  const mobilePaths = quick ? representative : paths;
  for (const [index, path] of mobilePaths.entries()) {
    await phone.goto(base + path); await ready(phone);
    const result = await phone.evaluate((version) => {
      const body = document.querySelector("div.prose.flex-1")?.cloneNode(true);
      body?.querySelectorAll("pre").forEach((block) => block.remove());
      const releaseInBody = body?.textContent.includes(version) ?? false;
      const tight = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,.brand")].filter((node) => parseFloat(getComputedStyle(node).letterSpacing) < 0).map((node) => node.textContent);
      document.querySelectorAll("details").forEach((node) => { node.open = true; });
      const clipped = [...document.querySelectorAll("pre")].map((pre) => {
        const old = pre.getAttribute("style");
        pre.style.whiteSpace = "pre"; pre.style.overflowWrap = "normal";
        const result = { client: pre.clientWidth, scroll: pre.scrollWidth, code: pre.textContent };
        if (old === null) pre.removeAttribute("style"); else pre.setAttribute("style", old);
        return result;
      }).filter((pre) => pre.scroll > pre.client + 1);
      const covered = [...document.querySelectorAll("pre")].filter((pre) => {
        const button = pre.closest("figure")?.querySelector("[data-docs-copy]");
        if (!button || button.hidden) return false;
        const codeBox = pre.getBoundingClientRect(), buttonBox = button.getBoundingClientRect();
        return buttonBox.bottom > codeBox.top && buttonBox.top < codeBox.bottom;
      }).map((pre) => pre.textContent);
      return { overflow: document.documentElement.scrollWidth > innerWidth, clipped, tight, covered, releaseInBody };
    }, languageVersion);
    assert(!result.releaseInBody, `Release number leaked into article body ${path}`);
    if (result.overflow || result.clipped.length || result.tight.length || result.covered.length) overflows.push({ path, ...result });
    if (representative.includes(path)) await phone.screenshot({ path: resolve(output, `mobile${path.replaceAll("/", "-")}.png`), fullPage: true });
    if (index % 40 === 39) console.log(`Mobile: ${index + 1}/${mobilePaths.length} pages checked.`);
  }
  writeFileSync(resolve(output, "report.json"), JSON.stringify({ base, languageVersion, phase: "mobile-layout", pagesChecked, mobilePages: mobilePaths.length, overflows, errors }, null, 2));
  assert(overflows.length === 0, `Mobile layout failed: ${JSON.stringify(overflows.slice(0, 8))}`);
  assert(errors.length === 0, `Browser errors: ${JSON.stringify(errors)}`);

  const displayedBlock = async (source, label) => {
    const blocks = await phone.locator("pre").allTextContents();
    const index = blocks.findIndex((block) => block.trim() === source.trim());
    assert(index >= 0, `Missing current code ${label}`);
    return phone.locator("pre").nth(index);
  };
  const colorsIn = async (block) => block.locator("code span").evaluateAll((nodes) => [...new Set(nodes.filter((node) => node.textContent.trim()).map((node) => getComputedStyle(node).color))]);
  const setTheme = async (theme) => phone.locator("html").evaluate((node, theme) => node.classList.toggle("dark", theme === "dark"), theme);
  let highlightedChecks = 0;
  for (const prefix of ["", "/en"]) {
    await phone.goto(`${base}${prefix}/docs/guides/typescript-to-seseragi`); await ready(phone);
    assert(await phone.locator("div.prose.flex-1 h2").count() === 18, `Incomplete migration guide ${prefix}`);
    const guide = readFileSync(new URL(`../content/${prefix ? "en" : "docs"}/guides/typescript-to-seseragi.mdx`, import.meta.url), "utf8");
    const references = [...guide.matchAll(/\{\/\*\s*example:\s*(examples\/[^\s*]+)\s*\*\/\}/g)].map((match) => match[1]);
    for (const reference of references) await displayedBlock(readExample(reference), `${prefix}/${reference}`);
    for (const theme of ["light", "dark"]) {
      await setTheme(theme);
      for (const reference of ["examples/guides/migration.ssrg", "examples/guides/migration-typescript/call.ts#example", "examples/guides/migration-typescript/react.tsx#badge"]) {
        const block = await displayedBlock(readExample(reference), reference);
        assert((await colorsIn(block)).length > 1, `Missing ${theme} syntax colors ${prefix}/${reference}`);
        highlightedChecks++;
      }
    }
    await (await displayedBlock(readExample("examples/guides/migration-typescript/react.tsx#badge"), "React props")).scrollIntoViewIfNeeded();
    await phone.screenshot({ path: resolve(output, `highlight-migration-${prefix ? "en" : "ja"}.png`) });

    await phone.goto(`${base}${prefix}/docs/reference/effects`); await ready(phone);
    for (const theme of ["light", "dark"]) {
      await setTheme(theme);
      for (const title of ["compact form", "contract form"]) {
        const block = phone.locator("figure").filter({ has: phone.locator("figcaption", { hasText: new RegExp(`^${title}$`, "i") }) }).locator("pre");
        assert(await block.count() === 1, `Missing ${title} ${prefix}`);
        assert((await colorsIn(block)).length > 1, `Uncolored ${title}, ${theme}, ${prefix}`);
        highlightedChecks++;
      }
    }
    await phone.locator("figure").filter({ has: phone.locator("figcaption", { hasText: /^compact form$/i }) }).scrollIntoViewIfNeeded();
    await phone.screenshot({ path: resolve(output, `highlight-effects-${prefix ? "en" : "ja"}.png`) });

    await phone.goto(`${base}${prefix}/docs/reference/library/prelude`); await ready(phone);
    const blocks = await phone.locator("pre").allTextContents();
    const index = blocks.findIndex((block) => /^map</.test(block));
    assert(index >= 0, `Missing generated map signature ${prefix}`);
    for (const theme of ["light", "dark"]) {
      await setTheme(theme);
      assert((await colorsIn(phone.locator("pre").nth(index))).length > 1, `Uncolored generated signature ${theme}/${prefix}`);
      highlightedChecks++;
    }
    await phone.goto(`${base}${prefix}/docs/reference/library/maybe`); await ready(phone);
    const recipe = recipes["std/maybe"].find((recipe) => recipe.example.endsWith("#sequence-missing"));
    const stdout = await displayedBlock(recipe.stdout, "Maybe output");
    for (const theme of ["light", "dark"]) {
      await setTheme(theme);
      assert((await colorsIn(stdout)).length <= 1, `Output colored as source ${theme}/${prefix}`);
    }
  }
  console.log(`Migration: all displayed source excerpts match checked fixtures in both locales. Syntax: ${highlightedChecks} mobile color checks passed in light/dark themes; outputs stay plain.`);
  await phone.goto(`${base}/docs/guides/forms`); await ready(phone);
  await phone.getByRole("button", { name: "メニューを開く", exact: true }).first().click();
  await phone.getByRole("link", { name: "English", exact: true }).first().click();
  await phone.waitForURL(/\/en\/docs\/guides\/forms\/?$/);
  await phone.getByRole("heading", { level: 1 }).waitFor();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const article = await noJS.newPage();
  await article.goto(`${base}/docs/learn/effects`);
  assert(await article.getByRole("heading", { level: 1 }).isVisible(), "Article requires JavaScript");
  assert((await article.locator("body").innerText()).includes("Effect"), "No-JS text missing");
  writeFileSync(resolve(output, "report.json"), JSON.stringify({ base, languageVersion, pagesChecked, mobilePages: mobilePaths.length, highlightedChecks, overflows, errors }, null, 2));
  assert(overflows.length === 0, `Mobile layout failed: ${JSON.stringify(overflows.slice(0, 8))}`);
  assert(errors.length === 0, `Browser errors: ${JSON.stringify(errors)}`);
  console.log(`PASS: ${paths.length} routes; ${mobilePaths.length} mobile pages without clipped/covered code or negative tracking; browser errors 0.`);
} finally { await browser.close(); }
