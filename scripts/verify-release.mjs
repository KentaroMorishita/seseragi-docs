import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkReleaseIdentity } from "./release-record.mjs";
import { examplesDigest, sha256 } from "./release-inputs.mjs";

if (process.argv.slice(2).filter((arg) => arg !== "--").join(" ") !== "--reviewed") {
  throw new Error("Review release notes, CLI commands, project loading, compiler restrictions, and API corrections before using --reviewed. See README.md: 対応版の更新.");
}
const root = fileURLToPath(new URL("..", import.meta.url));
const catalog = JSON.parse(readFileSync(new URL("../src/data/standard-library.json", import.meta.url), "utf8"));
const release = JSON.parse(execFileSync("seseragi", ["--version-json"], { encoding: "utf8" }));
checkReleaseIdentity(catalog, release);
const before = examplesDigest(root);
execFileSync(process.execPath, ["scripts/check-examples.mjs"], { cwd: root, stdio: "inherit" });
const after = examplesDigest(root);
if (before !== after) throw new Error("Verification inputs changed during execution. Review the changes and verify again.");
const help = execFileSync("seseragi", ["--help"], { encoding: "utf8" });
const record = {
  schema: 1,
  languageVersion: catalog.languageVersion,
  languageCommit: catalog.languageCommit,
  examplesDigest: after,
  cliHelpDigest: sha256(help),
  reviewedAt: new Date().toISOString(),
};
writeFileSync(new URL("../src/data/release-verification.json", import.meta.url), JSON.stringify(record, null, 2) + "\n");
console.log(`Recorded verification for ${release.version}. Now run check, build, and browser verification.`);
