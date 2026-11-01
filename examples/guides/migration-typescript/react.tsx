import { useState } from "react";

// docs:start badge
type BadgeProps = { label: string };

function Badge(props: BadgeProps) {
  return <span>{props.label}</span>;
}
// docs:end badge

// docs:start events
function Counter() {
  const [count, setCount] =
    useState(0);
  const increment = () => {
    setCount((n) => n + 1);
  };
  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
// docs:end events
export { Badge, Counter };
