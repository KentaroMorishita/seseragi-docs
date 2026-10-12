# Reference authoring review

Reviewer: documentation agent. This is an agent review for a TypeScript reader, not feedback from a human reader.

## Delivered scope

- 16 paired topics in `content/docs/reference` and `content/en/reference`: index, syntax, types, data-types, patterns, functions, effects, signals, type-classes, modules, typescript-interop, cli, project-configuration, web-ui, runtime-providers, performance.
- Each topic has 4–7 substantive sections, exact constraints, locale-correct internal links, and lookup tables where useful. No reader link substitutes a GitHub specification/Markdown file for an explanation.
- 13 complete executable examples with literal expected output in `examples/reference/checks.json`. Multi-file examples include their manifest and current lock. Declaration-only snippets are text fences labelled as syntax or declaration files.
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
- Both locale files have exactly 13 matched fixture fences, and each fence body equals its fixture bytes excluding the terminal newline.
- yomiyasu static lint ran on all 16 Japanese pages. Notices for repeated explanatory endings and technically necessary contrasts were reviewed; they do not justify changing the technical contracts. The literal unsupported-option statement was changed to a direct preparation-error statement.
- Root integration still owns the Astro build, browser navigation/search, actual 375px rendering, production deployment, and the final whole-site acceptance. This review does not claim those checks or real-reader acceptance.

## 375px source-format follow-up

The root browser audit identified authored Reference blocks needing narrower source layout. CLI, data-types, modules, signals, syntax, and web-ui were updated in both locales. The same 37-column scan also found a pattern guard and the performance function signature, which were split at their natural expression/arrow boundaries. Corresponding complete fixtures remain byte-for-byte equal to their MDX fence bodies.

The six affected complete examples passed on installed Seseragi 0.61.25 with unchanged expected stdout; performance passed both development and release. The modules package lock was regenerated through `seseragi lock update` after its source change. Standalone probes verified the multiline custom-operator declaration (`AB`) and guarded arm (`positive`). All paired CLI shell fences passed `bash -n`; this does not claim the example development server was started. Source layout is verified; the root owns rerendering and the final browser overflow check.
