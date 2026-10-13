// docs:start example
function double(value: number) {
  return value * 2;
}
const outside = double(20) + 1;
const grouped = double(20 + 1);
console.log(
  `${outside}, ${grouped}`,
);
// docs:end example

export {};
