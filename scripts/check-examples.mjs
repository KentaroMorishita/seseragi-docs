import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { checkReleaseIdentity } from "./release-record.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = process.env.SESERAGI_CLI ?? "seseragi";
const release = JSON.parse(execFileSync(cli, ["--version-json"], { encoding: "utf8" }));
const catalog = JSON.parse(readFileSync(resolve(root, "src/data/standard-library.json"), "utf8"));
checkReleaseIdentity(catalog, release);
const cases = [
  { file: "examples/hello.ssrg", mode: "run", stdout: "Hello, Seseragi!\n" },
  { file: "examples/parcel.ssrg", mode: "run", stdout: "Sent to Kyoto\n" },
];
for (const name of readdirSync(resolve(root, "examples"))) {
  const checks = resolve(root, "examples", name, "checks.json");
  if (existsSync(checks)) cases.push(...JSON.parse(readFileSync(checks, "utf8")));
}
const typescript = cases.filter((example) => ["typescript", "typecheck"].includes(example.mode));
if (typescript.length) {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc", "--ignoreConfig", "--strict", "--noEmit", "--skipLibCheck",
    "--target", "ES2022", "--module", "NodeNext", "--moduleDetection", "force",
    "--jsx", "react-jsx", "--allowImportingTsExtensions",
    ...typescript.map((example) => example.file),
  ], { cwd: root, stdio: "inherit", timeout: 30000 });
  console.log(`TypeScript: ${typescript.length} comparison programs passed strict typechecking.`);
}
const outputDirectory = mkdtempSync(resolve(tmpdir(), "seseragi-docs-check-"));
let failures = 0;
try {
  for (const [index, example] of cases.entries()) {
    const command = example.mode ?? "run";
    if (!["run", "build", "test", "diagnostic", "typescript", "typecheck"].includes(command)) throw new Error(`Unknown example mode ${command}`);
    if (command === "typecheck") { console.log(`PASS typecheck ${example.file}`); continue; }
    const args = [command === "diagnostic" ? "build" : command, example.file];
    if (command === "build" || command === "diagnostic") args.push("--out-dir", resolve(outputDirectory, String(index)));
    try {
      const stdout = execFileSync(command === "typescript" ? process.execPath : cli, command === "typescript" ? [example.file] : args, { cwd: root, encoding: "utf8", stdio: "pipe", input: example.stdin, timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
      if (command === "diagnostic") throw new Error("Expected a diagnostic, but compilation succeeded.");
      if (example.stdout !== undefined && stdout !== example.stdout) throw new Error(`Expected ${JSON.stringify(example.stdout)}, got ${JSON.stringify(stdout)}`);
      if (example.stdoutIncludes && !stdout.includes(example.stdoutIncludes)) throw new Error(`Missing output ${example.stdoutIncludes}`);
      console.log(`PASS ${command} ${example.file}`);
    } catch (error) {
      const actual = String(error.stderr ?? "");
      if (command === "diagnostic" && error.status === 2 && example.code && actual.includes(example.code)) console.log(`PASS expected ${example.code} ${example.file}`);
      else { failures++; console.error(`FAIL ${example.file}: ${error.message}\n${actual}`); }
    }
  }
} finally { rmSync(outputDirectory, { recursive: true, force: true }); }
if (failures) process.exitCode = 1;
else console.log(`Examples: ${cases.length} checks passed on Seseragi ${release.version}.`);
