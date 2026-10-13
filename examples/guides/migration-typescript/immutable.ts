// docs:start example
const base = { count: 1 };
const next = {
  ...base,
  count: base.count + 1,
};
console.log(
  `${base.count}, ${next.count}`,
);
// docs:end example

export {};
