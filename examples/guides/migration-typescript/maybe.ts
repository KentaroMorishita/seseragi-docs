// docs:start name
function name(
  value: string | undefined,
): string {
  return value ?? "Guest";
}
// docs:end name

// docs:start inputs
console.log(`[${name("Ada")}]`);
console.log(`[${name(undefined)}]`);
console.log(`[${name("")}]`);
// docs:end inputs

export {};
