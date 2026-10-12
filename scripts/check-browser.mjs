import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = (process.env.SITE_URL ?? "http://127.0.0.1:4322").replace(/\/$/, "");
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
  const paths = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  assert(paths.length >= 200, "Incomplete official docs sitemap");
  for (let i = 0; i < paths.length; i += 12) {
    const results = await Promise.all(paths.slice(i, i + 12).map(async (path) => {
      const response = await context.request.get(base + path);
      assert(response.status() === 200, `HTTP ${response.status()} ${path}`);
      const html = await response.text();
      assert(/<h1\b/.test(html), `Missing heading ${path}`);
      assert(html.includes(`lang="${path.startsWith("/en") ? "en" : "ja"}"`), `Wrong language ${path}`);
      return path;
    }));
    pagesChecked.push(...results);
  }
  assert((await context.request.get(`${base}/does-not-exist`)).status() === 404, "Missing 404 response");
  const robots = await context.request.get(`${base}/robots.txt`);
  assert((await robots.text()).includes("/sitemap.xml"), "robots sitemap missing");
  console.log(`HTTP: ${paths.length} routes, language metadata, sitemap, robots, and 404 passed.`);

  const firstProgram = readFileSync(new URL("../examples/hello.ssrg", import.meta.url), "utf8").trim();
  for (const prefix of ["", "/en"]) {
    await page.goto(`${base}${prefix}/docs/learn/first-program`);
    assert((await page.locator("pre").first().textContent()).trim() === firstProgram, `Outdated introductory code ${prefix || "ja"}`);
  }
  console.log("Introduction: both locales display the checked, focused Hello world example.");

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
    "/docs/reference/library/web-html", "/docs/reference/library/effect",
    "/docs/reference/library/regex", "/docs/reference/library/transformer-state",
  ];
  const mobilePaths = quick ? representative : paths;
  for (const [index, path] of mobilePaths.entries()) {
    await phone.goto(base + path); await ready(phone);
    const result = await phone.evaluate(() => {
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
      return { overflow: document.documentElement.scrollWidth > innerWidth, clipped, tight, covered };
    });
    if (result.overflow || result.clipped.length || result.tight.length || result.covered.length) overflows.push({ path, ...result });
    if (representative.includes(path)) await phone.screenshot({ path: resolve(output, `mobile${path.replaceAll("/", "-")}.png`), fullPage: true });
    if (index % 40 === 39) console.log(`Mobile: ${index + 1}/${mobilePaths.length} pages checked.`);
  }
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
  writeFileSync(resolve(output, "report.json"), JSON.stringify({ base, pagesChecked, mobilePages: mobilePaths.length, overflows, errors }, null, 2));
  assert(overflows.length === 0, `Mobile layout failed: ${JSON.stringify(overflows.slice(0, 8))}`);
  assert(errors.length === 0, `Browser errors: ${JSON.stringify(errors)}`);
  console.log(`PASS: ${paths.length} routes; ${mobilePaths.length} mobile pages without clipped/covered code or negative tracking; browser errors 0.`);
} finally { await browser.close(); }
