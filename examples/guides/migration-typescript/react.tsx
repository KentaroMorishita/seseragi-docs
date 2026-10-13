import { useReducer } from "react";

// docs:start badge
type BadgeProps = { label: string };

function Badge(props: BadgeProps) {
  return <span>{props.label}</span>;
}
// docs:end badge

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

// docs:start events
function Counter() {
  const [count, dispatch] =
    useReducer(reducer, 0);
  const increment = () => {
    dispatch({ type: "increment" });
  };
  return (
    <button onClick={increment}>
      {count}
    </button>
  );
}
// docs:end events
export { Badge, Counter };
