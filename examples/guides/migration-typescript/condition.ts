// docs:start example
function result(score: number) {
  return score >= 70
    ? "pass"
    : "retry";
}
console.log(result(82));
console.log(result(65));
// docs:end example

export {};
