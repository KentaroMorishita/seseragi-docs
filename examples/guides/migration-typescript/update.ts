// docs:start update
type Action =
  | { type: "increment" }
  | { type: "reset" };

function reducer(
  count: number,
  action: Action,
): number {
  switch (action.type) {
    case "increment":
      return count + 1;
    case "reset":
      return 0;
  }
}
// docs:end update

// docs:start cases
console.log(reducer(
  0, { type: "increment" },
));
console.log(reducer(
  9, { type: "reset" },
));
// docs:end cases

export {};
