import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkReleaseRecord } from "./release-record.mjs";
import { examplesDigest } from "./release-inputs.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const catalog = JSON.parse(readFileSync(new URL("../src/data/standard-library.json", import.meta.url), "utf8"));
const recordPath = new URL("../src/data/release-verification.json", import.meta.url);
let record;
try { record = JSON.parse(readFileSync(recordPath, "utf8")); }
catch { /* A missing record is a failed gate, not permission to relabel pages. */ }
checkReleaseRecord(catalog, record, examplesDigest(root));
console.log(`Release: ${catalog.languageVersion} / ${catalog.languageCommit.slice(0, 12)}; example verification and release review are current.`);
