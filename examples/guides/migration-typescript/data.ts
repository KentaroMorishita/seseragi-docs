// docs:start declaration
type Delivery =
  | { kind: "preparing" }
  | { kind: "sent"; city: string };
// docs:end declaration

// docs:start construct
const delivery: Delivery = {
  kind: "sent",
  city: "Kyoto",
};
// docs:end construct

// docs:start label
function label(value: Delivery) {
  switch (value.kind) {
    case "preparing":
      return "Preparing";
    case "sent":
      return value.city;
  }
}
// docs:end label
console.log(label(delivery));

export {};
