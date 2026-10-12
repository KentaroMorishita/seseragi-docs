# Reference authoring review

Reviewer: documentation agent. This is an agent review for a TypeScript reader, not feedback from a human reader.

## Delivered scope

- 16 paired topics in `content/docs/reference` and `content/en/reference`: index, syntax, types, data-types, patterns, functions, effects, signals, type-classes, modules, typescript-interop, cli, project-configuration, web-ui, runtime-providers, performance.
- Each topic has 4–7 substantive sections, exact constraints, locale-correct internal links, and lookup tables where useful. No reader link substitutes a GitHub specification/Markdown file for an explanation.
- 28 complete positive examples with literal expected output, plus six intentionally invalid diagnostic fixtures, in `examples/reference/checks.json`. Multi-file examples include their manifest and current lock. The supplemental lookup excerpts use named source regions and explicitly distinguish expressions, declarations, and main-body fragments.
- 376 Japanese API-description translations in `src/data/library-descriptions.ja.json`. The original English key set/order is preserved. Every value contains Japanese; strictness, source order, copy, short-circuiting, cancellation, and resource conditions remain explicit. Generic metadata filler remains generic rather than inventing guarantees.

## Sources and authority

The language repository was read only. Content was checked against `docs/spec/01-syntax.md`, `02-types.md`, `03-data-and-expressions.md`, `04-type-classes.md`, `05-effects.md`, `06-modules-and-interop.md`, `07-typescript-interop.md`, `08-dts-conversion.md`, `09-standard-library.md`, `10-library-surface.md`, `11-packages-and-projects.md`, `12-tooling.md`, `13-web-ui.md`, `14-performance.md`, `15-runtime-providers.md`, the grammar, current standard interfaces, the Provider catalog, CLI implementations, and canonical execution fixtures.

Execution uses installed `seseragi 0.61.25`, release commit `7440e9ff7f71`, aarch64-apple-darwin, Unicode 17.0.0. Distribution version and manifest language version are kept distinct.

## Execution and semantic checks

All 13 cases passed with their declared stdout, including:

- Pattern coverage for empty and nonempty Arrays.
- Effect typed-failure recovery to 0.
- Source Signal update and derived read to 6.
- User trait instance and constraint selection.
- A two-file package import, relative pure JavaScript foreign binding, and explicit Clock Provider selection.
- SSR text escaping (`&` becomes `&amp;`).
- Direct self-tail recursion yielding 5050 in development and release.

A release build was also inspected: process entry `entry.js`, source-map policy `omit`, actual compiler/runtime versions, bundle sizes, and artifact build identity were present. The performance page does not promise universal fusion, specialization, or minimal DOM edits.

Negative live CLI checks rejected the following with exit 2:

| Case | Actual code |
| --- | --- |
| Nonexhaustive match | SES-T0301 |
| Unreachable arm | SES-T0302 |
| Refutable let binding | SES-T0101 |
| Missing alias type argument | SES-T0601 |
| Compact effect body returning an Int | SES-T0101 |

## Product boundaries

- CLI reference follows the installed help, not every future tooling contract in chapter 12. It does not advertise `options --json`, `target capabilities`, arbitrary `build --emit`, or general `doc` site generation. `doc --test` and current `dts convert` are documented.
- The implemented manifest accepts `[build].profile`; target stays in `[run].target`. Development process entry is `entry.ts`; first-party release is `entry.js`; Web entry is `assets/app.js`.
- The loader's local/path graph rejects registry dependencies requiring a registry resolver. Registry auto-downloads and publish commands are not advertised as current features.
- Ordinary build/test validates source-content digests too. Source edits can stale the lock; explicit `lock update` is required. Dev permits ordinary editable source changes while preserving the exact graph and selected providers, but configuration and provider-requirement changes still require updates.
- Html/SSR and browser DOM have separate capability boundaries. Signal read/update remains Effectful; transaction atomicity is limited to Signal changes, not arbitrary I/O.

## Implementation discrepancy found

Canonical `println` accepts String in spec 9.12 and the Analysis/interface surface. The unqualified Prelude application path in `crates/seseragi-semantics/src/typed/effect_body.rs` currently types supplied arguments without enforcing that String parameter. `runtime/ts/src/console-service.ts` calls host `String(value)`.

Live evidence: unqualified `println 42` succeeds; qualified `std/console.println 42` rejects with SES-T0101; printing a derived ADT unqualified produces `[object Object]`, not its Show output. This is an implementation discrepancy, not a documented scalar coercion. Reference numeric output now explicitly uses `show` before `println`; fixtures and exact MDX fences were synchronized and rechecked. A compiler follow-up remains outside this documentation task's ownership.

## Readability and remaining gates

- Executable source and all authored Reference fences in both locales have at most 37 characters per line after the 375px audit. Pipeline inputs and each `|>` are aligned vertically. CLI and benchmark shell syntax use explicit backslash continuations where needed.
- The authored 16-topic Reference set in each locale has 13 exact full-file matches and 58 exact named-region matches. Full-file fences preserve source bytes excluding the terminal newline; named-region fences remove common space indentation only.
- yomiyasu static lint ran on all 16 Japanese pages. Notices for repeated explanatory endings and technically necessary contrasts were reviewed; they do not justify changing the technical contracts. The literal unsupported-option statement was changed to a direct preparation-error statement.
- Root integration still owns the Astro build, browser navigation/search, actual 375px rendering, production deployment, and the final whole-site acceptance. This review does not claim those checks or real-reader acceptance.

## 375px source-format follow-up

The root browser audit identified authored Reference blocks needing narrower source layout. CLI, data-types, modules, signals, syntax, and web-ui were updated in both locales. The same 37-column scan also found a pattern guard and the performance function signature, which were split at their natural expression/arrow boundaries. Corresponding complete fixtures remain byte-for-byte equal to their MDX fence bodies.

The six affected complete examples passed on installed Seseragi 0.61.25 with unchanged expected stdout; performance passed both development and release. The modules package lock was regenerated through `seseragi lock update` after its source change. Standalone probes verified the multiline custom-operator declaration (`AB`) and guarded arm (`positive`). All paired CLI shell fences passed `bash -n`; this does not claim the example development server was started. Source layout is verified; the root owns rerendering and the final browser overflow check.

## Focused lookup examples

Eight paired topics now include 58 additional synchronized excerpts per locale: syntax, functions, data-types, patterns, types, type-classes, effects, and signals. The excerpts are placed next to the contract they illustrate, rather than forming another guided lesson. Their titles identify expression, declaration, main-body, or intentionally invalid code. New source regions use `// docs:start name` and `// docs:end name`; old complete examples remain unchanged.

Filled gaps:

- String-valued if versus Int-valued block results; Unit block versus empty record; incompatible if branch types.
- Application grouping, calculated arguments, partial application, typed lambda, stored operator value, and lexical local-function capture.
- Nullary ADT constructors versus one tuple payload; immutable struct spread; optional field absence versus required Maybe; transparent aliases versus nominal newtype wrap/unwrap.
- Guarded Maybe arms and fallback, tuple wildcard, renamed record binding, and rejection of a refutable let even for a visibly constructed Just.
- Generalized local lambda versus typed empty constructors, record width compatibility, Show evidence, higher-kinded Functor selection for Array/Maybe/List, derived Eq, and Maybe/Array do in pure functions.
- Cold Effect construction and two executions of the same computation, success mapping versus bind, inferred versus explicit Effect contracts, and rejection of plain-value bodies.
- Signal read/update, immutable saved snapshots, explicit derived dependencies, combine, and transaction readback.

The 15 added runnable files passed on installed `seseragi 0.61.25`, release `7440e9ff7f71`, with their literal stdout in `checks.json`. Results include grouping `12/12/13`, Array transformations `[2, 3, 4]` and `[2, 4, 6]`, original/updated struct names `Aki/Mio`, optional access `Nothing/Just intro`, guarded cases `positive/non-positive/missing`, Array do `[11, 21, 12, 22]`, cold Effect order `constructed/ran/ran`, Signal snapshots `1: 2` and `2: 10`, derived value `6`, and combined transaction readback `8/15`.

All six added invalid files exited 2: mismatched if results, refutable binding, missing newtype wrap, direct operator-value application, and plain Effect body report SES-T0101; missing generic Show evidence reports SES-T0201. Exact code identifiers are recorded, without inventing or stabilizing compiler diagnostic prose.

Validation independently checks balanced, nonnested, unique regions per source file; exact paired fence text after common indentation removal; preservation of old full-file matches; and maximum 37 displayed characters per line. yomiyasu lint ran on all eight Japanese pages. Remaining notices concern existing repeated explanatory endings and technically meaningful contrasts; they were reviewed rather than changing contracts to satisfy a score. Root integration owns shared content/build/browser checks and production acceptance.

## Current 0.61.25 restrictions observed during supplementation

These are compiler-version restrictions, not language-wide bans. The working forms appear before their limits on reader pages. Compiler implementation and unrelated Issues were not modified.

### Operator-value direct application

`examples/reference/function-values.ssrg#operator` verifies a typed standalone operator binding, subsequent partial application of that binding, and Array mapping:

```seseragi
let times: Int -> Int -> Int = (*)
let twice = times 2
[1, 2, 3]
|> map twice
|> show
|> println
```

This prints `[2, 4, 6]`. A separate typed binding of `(+)` followed by `op 20 22` printed 42. However, `fn answer -> Int = (+) 20 22` rejects SES-T0101 ("Expression invalid") in 0.61.25. Immediate partial applications `(+) 1` and `(*) 2` also reject SES-T0101 even with an `Int -> Int` binding annotation. The registered direct-operator diagnostic fixture reproduces the released behavior. Earlier unannotated map probes produced downstream SES-T0201 because the result type was unresolved; the clean direct-operator fixture avoids relying on that cascade.

### Another monad's do nested inside an Effect body

The following reproduction in a public Effect main failed on 0.61.25:

```seseragi
pub effect fn main = do {
  let choices: Array<Int> = do {
    first <- [1, 2]
    second <- [10, 20]
    pure (first + second)
  }
  println $ show choices
}
```

The CLI reported SES-T0101: the binding expected `Array<Int>` but the nested body produced `Effect<{}, Never, Array<Int>>`; it also reported SES-T0201 at the addition. In contrast, `examples/reference/do-variants.ssrg#array-do` puts the same Array do inside a pure `fn choices -> Array<Int>` and runs successfully, yielding `[11, 21, 12, 22]`. The reader page presents the pure-function form and scopes the limitation explicitly to compiler 0.61.25 rather than weakening the normative generic Monad contract.
