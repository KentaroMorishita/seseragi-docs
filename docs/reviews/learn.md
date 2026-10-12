# Learn authoring and verification review

This is an agent-authored curriculum and specification review. It is not feedback from a real first-time reader. The root task owns the final site build, mobile/browser checks, publishing, and production acceptance.

## Scope and progression

The existing Learn path has 14 authored chapters with Japanese and English counterparts. This expansion changes 11 chapters plus the index, for 24 localized page files: functions-and-pipelines, records-and-structs, algebraic-data-types, pattern-matching, arrays-and-lists, maybe-and-either, generics, recursion, effects, signals, and type-classes.

The first-program and local-development pages are unchanged by this expansion. The compiler repository, navigation metadata, site components, shared checking scripts, generated Library pages, package tooling, and Git history were not edited by this author.

The course assumes JavaScript/TypeScript functions, arrays, objects, and conditionals; it does not assume ADTs, Haskell, or advanced type theory. The entry remains one Hello world string. New examples isolate a declaration, an expression, or a binding, state where it belongs, and show the relevant input/result. Required types, imports, and functions are displayed or identified before use. Larger combinations follow the constituent operations. An example is not expected to teach the entire language.

## New focused coverage

Forty new fixture files live in `examples/learn/focused`. Named regions exist only in these new files; older whole-file markers remain synchronized. Both locales display the same 100 named-region references, so the addition supplies 200 localized excerpts rather than 200 independently implemented examples.

| Area | Files and verified behavior |
| --- | --- |
| Functions | function-lambda, function-closure, function-grouping, function-unit: lambda application yields 42, captured prefix yields `Hi, Aki`, arithmetic grouping and nested application yield 43/42, and a parameterless declaration is called with the Unit value `()` |
| Records and structs | record-fields, record-spread, record-decomposition, struct-fields, struct-nominal-error: required record fields accept an extra score field, spread preserves 30 and creates 42, renamed extraction yields 3/4, struct field access yields 3, and Size passed to a Point function is rejected with `SES-T0101` |
| ADTs | adt-tuple-payload, adt-struct-payload: constructors with a tuple or Account payload produce the declared Shape/Session type; build-only harnesses verify these declarations and values without adding Show or match merely to print them |
| Patterns | pattern-record, pattern-guard: field/literal patterns select `Aki`; guarded integer patterns distinguish negative, zero, and positive |
| Array and List | array-map, array-filter, array-missing-index, array-reduce, array-ranges, list-empty-and-head, list-array-conversion: mapping preserves count, filtering can return empty, missing index uses a fallback, reduction changes element type to String, range endpoints differ, empty/head List patterns need no recursion, and conversions preserve order |
| Maybe and Either | maybe-map, maybe-flatmap, either-map, either-do: map preserves absence/failure, map of a Maybe-returning function produces two layers, flatMap returns one layer or absence, and two synchronous validations compose with do into Right 5 or a retained Left reason |
| Generics | generic-identity, generic-map-box, generic-result, generic-local-function: explicit type arguments preserve argument/result identity, Box<Int> transforms to Box<String>, generic success/fallback extraction preserves A, and one locally bound lambda is used at Int and String |
| Recursion | recursion-factorial, recursion-mutual, recursion-tree: factorial base cases produce 1/120, a local rec group classifies 6/7, and recursive ADT traversal counts three leaves |
| Effects | effect-bind, effect-recovery, effect-map-error: do extracts the success 42, recover produces 0 for Rejected, and mapError wraps a String in InputError before recovery displays `invalid: empty` |
| Signals | signal-set, signal-subscription, signal-distinct: set/read preserves the earlier snapshot, subscribe immediately notifies 0, unsubscribe prevents later delivery of 2, normal subscriptions retain repeated 1, and distinct suppresses the duplicate |
| Type classes | type-class-eq, type-class-instances, type-class-derived-fields: one Eq-constrained function works at Int/String/Array, Badge and Tag use different Render instances with the same framed function, and derived Eq/Show compare/render Point fields |

Original complete examples remain where they add a useful combination: immutable Point movement, an Array transform/filter/sum pipeline, port lookup plus validation, a long pure tail-recursive loop, cold/repeated greeting Effects, and Signal transactions. Custom Render is now shown as separate trait, instance, constrained function, and application steps. Array operations and Maybe/Either operations precede their combination examples.

## Source evidence

The canonical compiler repository was read only at `/Users/morishita/Desktop/seseragi`. Execution used `seseragi 0.61.25`, release commit `7440e9ff7f71`, aarch64-apple-darwin.

Primary sources consulted include `docs/spec/02-types.md`, `03-data-and-expressions.md`, `04-type-classes.md`, `05-effects.md`, `09-standard-library.md`, and `10-library-surface.md`; the canonical lessons 02, 04, 07, 10, 11, 13, 15, and 19; Rust driver Signal evidence-lowering tests; and `runtime/ts/src/{signal,effect,equality}.ts`. The compiler-derived Library pages were also read to confirm released argument order and names. A normative contract alone was not accepted as execution evidence.

## Verification

`examples/learn/checks.json` now registers 62 unique cases: 57 run cases with exact stdout, four build-only cases, and one expected diagnostic. The new slice accounts for 37 runs, two builds, and the `SES-T0101` diagnostic. All 40 new cases were checked with the canonical CLI before registration. The older cases had passed in the earlier authoring passes; the root task will run the combined manifest as its shared gate.

The original `recursion.ssrg` signature was split at an arrow boundary to fit 37 columns, and rerunning its 100000-step loop still returned `5000050000`. The renamed requirePositive function was rerun after the source edit and still returned `Right 5` and `Left must be positive`.

Three additional temporary probes confirmed the changed prose: allowed True bypasses recovery and yields 42; offline False takes the record pattern's fallback; and an empty typed Array reduction returns its initial empty String. Earlier focused-course probes covered missing Bool branches (`SES-T0301`), incompatible conditional branch types (`SES-T0101`), absent Reading, and coordinate cases.

Scoped commands used:

```sh
seseragi --version
seseragi run examples/learn/focused/<case>.ssrg
seseragi build examples/learn/focused/<case>.ssrg --out-dir <temporary>
node scripts/check-content.mjs
python3 /Users/morishita/.codex/skills/yomiyasu/scripts/yomiyasu_lint.py <Japanese-page>
```

The nominal-error fixture is expected to fail compilation. Its manifest records `mode: diagnostic` and `code: SES-T0101`; no failure is advertised as a runnable success. The ADT build-only sources include a minimal entry point for the CLI, while the page shows only the focused named declarations/values.

The content check passed for 220 localized site pages, their internal links/anchors, chapter order, example references, pipeline layout, and 1459 API symbols. All 24 changed localized Learn pages passed a stricter manual scan of every seseragi/text fence at no more than 37 visible columns. Japanese and English example-reference sets match in all changed chapters. Yomiyasu ran on every changed Japanese page; remaining notices are natural technical sentence endings and distinctions needed to explain values, effects, and state. These checks do not establish browser or real-reader acceptance.

## Released-compiler limitations and corrections

- `rec { ... }` is not permitted directly at module scope in 0.61.25 (`SES-P0001`). The revised mutual-recursion example places it inside parity's function block and explicitly explains the scope in both locales.
- Range values are not Arrays: displaying the range itself yields `1..=3` or `1..3`. The range example materializes elements with a comprehension and explains the distinction. The verified `reduce` order is initial value, step function, collection.
- Some generic constructor pipelines lose the intended input type before a later result annotation. The released CLI rejected a raw Box constructor piped into mapBox and a raw Left piped into map. The checked examples first bind a concretely typed Box<Int>/Result, then transform it. They do not teach accidental inference behavior as a language feature.
- In the precise Signal comparison program, inferred `main = do { ... println ...; signals.unsubscribe sub }` compiled with environment `{}` and failed with `environment.console.println` missing. Declaring `main -> Unit with Console fails ConsoleError` produced the expected notifications and output. Both advanced lifecycle fixtures use that correct explicit contract. The failure was reproduced from generated `/tmp/seseragi-learn-signal-distinct/main.ts` and `entry.ts`; no compiler/runtime fix was attempted in this documentation task.
- Unqualified println currently admits non-String arguments through an inconsistent Effect-body path, while qualified Console println rejects them. The canonical contract remains String. Numeric values are explicitly converted with show or inserted into a string template; accidental host coercion is not a documented convenience.
- The authoring avoided the parent-reported unsupported direct operator applications and Array-do-inside-an-Effect-binding path. The new synchronous Either-do example is in a separate pure function and was executed successfully.
- Templates beginning immediately with `[` can be lexed as List literals; the custom Render example uses angle delimiters. Multi-module execution remains a package with a current generated lockfile rather than a standalone import file.

## Acceptance boundaries

The new Signal examples now exercise subscription lifecycle and duplicate notification directly. The existing transaction example verifies the final combined value; it does not independently prove every glitch-free publication case. Deep non-tail/mutual recursion, cancellation/defect recovery, browser-only UI integration, and runtime resource failure matrices are outside these focused examples. Their exact contracts and application-level designs stay in Reference and Guides.

This expansion freezes after source/excerpt parity, scoped CLI checks, prose review, and content checks. The root task performs the shared build and full manifest, mobile rendering, search/navigation checks, commit/push, and production QA.
