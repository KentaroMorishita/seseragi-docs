// docs:start validate
type NameResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

function validate(
  text: string,
): NameResult {
  if (text === "") {
    return {
      ok: false,
      error: "Enter a name",
    };
  }
  return { ok: true, value: text };
}
// docs:end validate

// docs:start report
function report(value: NameResult) {
  return value.ok
    ? `Hello, ${value.value}`
    : value.error;
}
// docs:end report
console.log(report(validate("Ada")));
console.log(report(validate("")));

export {};
