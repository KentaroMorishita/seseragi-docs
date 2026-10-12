import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export const sha256 = (input) => createHash("sha256").update(input).digest("hex");

export function examplesDigest(root) {
  const files = ["scripts/check-examples.mjs", "scripts/release-record.mjs"];
  const walk = (directory) => {
    for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
      if (["node_modules", "dist", ".seseragi"].includes(entry.name)) continue;
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(ssrg|ts|js|json|toml|lock)$/.test(entry.name)) files.push(path);
    }
  };
  walk("examples");
  const hash = createHash("sha256");
  for (const path of files.sort()) hash.update(path).update("\0").update(sha256(readFileSync(resolve(root, path)))).update("\0");
  return hash.digest("hex");
}
