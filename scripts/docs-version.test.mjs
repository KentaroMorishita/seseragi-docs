import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { structure } from "fumadocs-core/mdx-plugins";
import { checkVersionSource, resolveDocsVersion } from "../src/lib/docs-version.mjs";
import { checkReleaseIdentity, checkReleaseRecord } from "./release-record.mjs";
import { examplesDigest } from "./release-inputs.mjs";

test("Japanese, English, bold text, and search follow the supplied version", () => {
  for (const version of ["0.61.26", "1.2.3"]) {
    const source = "本文は **<LanguageVersion />** を対象にします。\n\nChecked with <LanguageVersion />.";
    const resolved = resolveDocsVersion(source, version);
    assert.equal(resolved, `本文は **${version}** を対象にします。\n\nChecked with ${version}.`);
    const indexed = JSON.stringify(structure(resolved));
    assert.ok(indexed.includes(version));
    assert.ok(!indexed.includes("LanguageVersion"));
  }
});

test("static release numbers are rejected, including inline code and fence titles", () => {
  for (const source of ["配布版0.61.25で確認。", "Version0.61.25", "Compiler **1.2.3**.", "Use `v1.2.3`.", '```seseragi title="Rejected by 1.2.3"\nfn answer -> Int = 42\n```']) {
    assert.ok(checkVersionSource(source).length > 0, source);
  }
});

test("package examples and addresses are independent of the compiler release", () => {
  const source = '本文は<LanguageVersion />。\n\nURL: `http://127.0.0.1:3000/`\n\n```toml\nversion = "0.1.0"\nlanguage = ">=0.1.0 <0.2.0"\n```';
  assert.deepEqual(checkVersionSource(source), []);
  assert.deepEqual(checkVersionSource("~~~toml\nversion = '0.1.0'\n~~~"), []);
  assert.deepEqual(checkVersionSource("Check `seseragi --help` in <LanguageVersion />, then `seseragi --version`."), []);
});

test("placeholders cannot silently leak as code or unsupported MDX", () => {
  for (const source of ["`<LanguageVersion />`", "```text\n<LanguageVersion />\n```", "# <LanguageVersion />", "<LanguageVersion/>", "<LanguageVersion value='1' />"]) {
    assert.ok(checkVersionSource(source).length > 0, source);
  }
});

const catalog = { languageVersion: "1.2.3", languageCommit: "a".repeat(40) };
const digest = "b".repeat(64);
const record = { schema: 1, ...catalog, examplesDigest: digest, cliHelpDigest: "c".repeat(64), reviewedAt: "2026-10-13T00:00:00Z" };

test("changing only the displayed release, source commit, or examples cannot pass the build gate", () => {
  assert.doesNotThrow(() => checkReleaseRecord(catalog, record, digest));
  for (const [snapshot, proof, inputs] of [
    [{ ...catalog, languageVersion: "1.2.4" }, record, digest],
    [{ ...catalog, languageCommit: "d".repeat(40) }, record, digest],
    [catalog, record, "e".repeat(64)],
    [catalog, undefined, digest],
    [catalog, { ...record, cliHelpDigest: "" }, digest],
  ]) assert.throws(() => checkReleaseRecord(snapshot, proof, inputs), /missing or stale/);
});

test("the same version string on a different or dirty CLI is insufficient", () => {
  const release = { version: "1.2.3", commit: "a".repeat(12), releaseTag: "v1.2.3", channel: "release", dirty: false };
  assert.doesNotThrow(() => checkReleaseIdentity(catalog, release));
  for (const change of [{ commit: "f".repeat(12) }, { dirty: true }, { channel: "dev" }, { version: "1.2.4" }, { releaseTag: "v1.2.4" }]) {
    assert.throws(() => checkReleaseIdentity(catalog, { ...release, ...change }));
  }
});

test("verification fingerprints include fixture sources, manifests, locks, and checker changes", () => {
  const root = mkdtempSync(resolve(tmpdir(), "docs-version-inputs-"));
  try {
    mkdirSync(resolve(root, "scripts"));
    mkdirSync(resolve(root, "examples/project"), { recursive: true });
    writeFileSync(resolve(root, "scripts/check-examples.mjs"), "checker");
    writeFileSync(resolve(root, "scripts/release-record.mjs"), "identity");
    writeFileSync(resolve(root, "examples/project/main.ssrg"), "source");
    writeFileSync(resolve(root, "examples/project/view.tsx"), "component");
    writeFileSync(resolve(root, "examples/project/seseragi.toml"), "manifest");
    writeFileSync(resolve(root, "examples/project/seseragi.lock"), "lock");
    for (const name of ["main.ssrg", "view.tsx", "seseragi.toml", "seseragi.lock"]) {
      const before = examplesDigest(root);
      writeFileSync(resolve(root, "examples/project", name), `changed ${name}`);
      assert.notEqual(examplesDigest(root), before);
    }
    const before = examplesDigest(root);
    mkdirSync(resolve(root, "examples/project/dist"));
    writeFileSync(resolve(root, "examples/project/dist/entry.js"), "generated");
    assert.equal(examplesDigest(root), before);
    writeFileSync(resolve(root, "scripts/check-examples.mjs"), "new checker");
    assert.notEqual(examplesDigest(root), before);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
