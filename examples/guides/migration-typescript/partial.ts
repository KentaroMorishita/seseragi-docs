// docs:start example
const add = (x: number) =>
  (y: number) => x + y;

const addTwenty = add(20);
console.log(addTwenty(22));
// docs:end example

export {};
