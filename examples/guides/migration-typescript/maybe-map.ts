// docs:start example
const double = (n: number) => n * 2;
function doublePresent(
  value: number | undefined,
) {
  return value === undefined
    ? undefined
    : double(value);
}
console.log(doublePresent(21));
console.log(
  doublePresent(undefined),
);
// docs:end example

export {};
