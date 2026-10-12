import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("..", import.meta.url));

// A displayed fragment comes from a program checked by check-examples.mjs.
// Named regions omit the entry point and output scaffolding where the lesson
// needs only a declaration or an expression inside main.
export function readExample(reference, root = repository) {
  const [file, region, extra] = reference.split("#");
  const path = resolve(root, file);
  if (!path.startsWith(resolve(root, "examples") + "/") || extra !== undefined)
    throw new Error(`Invalid example reference: ${reference}`);
  const source = readFileSync(path, "utf8").replaceAll("\r\n", "\n");
  if (region === undefined) return source.trimEnd();
  if (!/^[a-z][a-z0-9-]*$/.test(region))
    throw new Error(`Invalid example region: ${reference}`);
  const regions = new Map();
  const lines = source.split("\n");
  let active;
  for (const [index, line] of lines.entries()) {
    const marker = line.match(/^\s*\/\/\s*docs:(start|end)\s+([a-z][a-z0-9-]*)\s*$/);
    if (!marker) continue;
    const [, kind, name] = marker;
    if (kind === "start") {
      if (active || regions.has(name)) throw new Error(`Nested or duplicate region ${name} in ${file}`);
      active = { name, start: index + 1 };
    } else {
      if (!active || active.name !== name) throw new Error(`Unmatched region end ${name} in ${file}`);
      regions.set(name, lines.slice(active.start, index));
      active = undefined;
    }
  }
  if (active) throw new Error(`Unclosed region ${active.name} in ${file}`);
  const selected = regions.get(region);
  if (!selected?.some((line) => line.trim())) throw new Error(`Missing or empty region ${region} in ${file}`);
  const indent = Math.min(...selected.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length));
  return selected.map((line) => line.slice(indent)).join("\n").trimEnd();
}
