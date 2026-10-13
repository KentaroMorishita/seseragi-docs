// docs:start example
function double(value: number) {
  return value * 2;
}
console.log(
  [1, 2, 3]
    .filter((n) => n > 1)
    .map(double),
);
// docs:end example

export {};
