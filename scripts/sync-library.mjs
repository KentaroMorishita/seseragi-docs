import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Explicit maintenance action; builds use the committed snapshot and need no
// checkout of the compiler, Rust, CLI, WASM, network, or credentials.
const repository = resolve(process.argv[2] ?? "../seseragi");
const release = JSON.parse(execFileSync("seseragi", ["--version-json"], { encoding: "utf8" }));
if (release.dirty || release.channel !== "release") throw new Error("Use a canonical released CLI.");
const ref = execFileSync("git", ["-C", repository, "rev-parse", `${release.releaseTag}^{commit}`], { encoding: "utf8" }).trim();
if (!ref.startsWith(release.commit)) throw new Error("CLI and release tag do not agree.");
const fromGit = (path) => execFileSync("git", ["-C", repository, "show", `${ref}:${path}`], { maxBuffer: 32 * 1024 * 1024 });
const grammarSource = fromGit("crates/seseragi-project/src/standard.rs").toString();
const js = fromGit("apps/playground/src/wasm/pkg/seseragi_wasm.js");
const wasm = fromGit("apps/playground/src/wasm/pkg/seseragi_wasm_bg.wasm");
const driver = await import(`data:text/javascript;base64,${js.toString("base64")}`);
driver.initSync({ module: wasm });
const artifact = JSON.parse(driver.toolchain_version_json());
if (artifact.version !== release.version) {
  const changes = execFileSync("git", ["-C", repository, "diff", `v${artifact.version}`, ref, "--", "crates"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (changes.trim()) throw new Error("WASM catalog differs from the release: regenerate the upstream artifact first.");
}
const analysis = JSON.parse(driver.analyze_single_file("docs.ssrg", "docs/catalog", 'pub effect fn main = println "docs"'));
if (analysis.diagnostics.diagnostics.length) throw new Error("Catalog analysis failed.");
const section = grammarSource.split("const STANDARD_MODULES: &[StandardModuleDefinition] = &[")[1]?.split("\n];")[0];
if (!section) throw new Error("Unknown canonical registry layout.");
const modules = Array.from(section.matchAll(/(available_module|contract_module)!\(([\s\S]*?)\),/g), ([, macro, body]) => {
  const strings = Array.from(body.matchAll(/"([^"]+)"/g), (match) => match[1]);
  const target = body.match(/\b(PORTABLE_TARGETS|PROCESS_TARGET|BROWSER_TARGET)\b/)?.[1];
  if (!strings[0] || !target) throw new Error("Unsupported registry entry.");
  return { specifier: strings[0], status: macro === "available_module" ? "available" : "contract-only", targets: target === "PORTABLE_TARGETS" ? ["process", "browser"] : [target === "PROCESS_TARGET" ? "process" : "browser"], services: strings.slice(1) };
});
modules.push({ specifier: "std/prelude", status: "implicit", targets: ["process", "browser"], services: [] });
modules.sort((a, b) => a.specifier.localeCompare(b.specifier));
const names = new Set(modules.map((module) => module.specifier));
for (const item of analysis.standardLibrary) if (!names.has(item.module)) throw new Error(`Missing module: ${item.module}`);
for (const module of modules) if (module.status !== "contract-only" && !analysis.standardLibrary.some((item) => item.module === module.specifier)) throw new Error(`Missing interface: ${module.specifier}`);
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const snapshot = {
  schema: 1,
  languageVersion: release.version,
  languageCommit: ref,
  catalogArtifactVersion: artifact.version,
  sourceHashes: { registry: sha256(Buffer.from(grammarSource)), wasm: sha256(wasm) },
  modules,
  items: analysis.standardLibrary,
};
writeFileSync(new URL("../src/data/standard-library.json", import.meta.url), JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Catalog: ${modules.length} modules, ${snapshot.items.length} symbols; release ${release.version}.`);
