# Guides implementation and review

Reviewed on 2026-10-12 with the installed Seseragi CLI 0.61.25, release commit
`7440e9ff7f71`. Compiler source is read-only throughout this work.

## Reader path and publication scope

Twelve Japanese guides have full English counterparts. The guides follow actual
tasks: TypeScript migration, standard input, a Web counter, pure update rules,
forms, components, private stateful features, typed failure recovery, tests,
package boundaries, application artifacts, and TypeScript bindings. The hub
groups them by task rather than displaying an undifferentiated API list.

Each guide has a concrete observable result and 5–8 sections. Sources, commands,
state ownership, effect boundaries, and local follow-up links are explained on
the site. No guide redirects readers to GitHub specification, status, or
getting-started Markdown. Vercel deployment commands link to the provider's own
CLI documentation, inspected on this review date.

## Canonical sources

Read-only evidence from the compiler repository:

- `docs/GETTING_STARTED.md`: native CLI/Bun setup, scaffold, dev server, build.
- `docs/spec/05-effects.md`: cold Effect, Either, typed failure, Signal ownership.
- `docs/spec/07-typescript-interop.md`: pure/task binding, module loading, failure.
- `docs/spec/08-dts-conversion.md`: generated bindings and handwritten adapters.
- `docs/spec/11-packages-and-projects.md`: manifests, exports, locks, test discovery.
- `docs/spec/12-tooling.md`: current test runner, filtering, exit classifications.
- `docs/spec/13-web-ui.md`: pure Html, props/events, dom.app, stateful features,
  DOM resource lifetime.
- `examples/samples/web-starter`, `signal-state`, `stdin-greeting`: current
  application patterns.
- `examples/spec/fixtures/projects/test-discovery`, `foreign-pure-load`:
  runnable test and host-binding contracts.

Memory informed the TypeScript-reader orientation, rather than supplying API
facts. All documented API examples were checked against the live CLI.

## Executable evidence

`examples/guides/checks.json` now contains sixteen entries. The ten original application/program entries passed the earlier gate; the six independent migration comparisons passed after the beginner-path revision:

| Example | Verification | Result |
| --- | --- | --- |
| migration.ssrg | `seseragi run` | `42` |
| migration-grouping.ssrg | run | `42` |
| migration-partial.ssrg | run | `42` |
| migration-pipeline.ssrg | run | `[2, 4, 6]` |
| migration-record.ssrg | run | `3` |
| migration-data.ssrg | run | `Kyoto` |
| cli-app.ssrg | run with stdin `3\n` | `Total: 1440` |
| state.ssrg | run | `2`, then `0` |
| components.ssrg | run | exact escaped HTML tree serialization |
| errors.ssrg | run | quantity, parse failure, range failure messages |
| web-app | build | static browser artifact |
| forms | build | static browser artifact |
| stateful-features | build | two private stateful features compose |
| testing | `seseragi test` | three shipping boundary cases pass |
| packages/app | run | path dependency resolves; prints `400` |
| typescript-bindings | run | `[ready]`, then `Please try again` |

The CLI example also rejected `0`, `many`, and EOF: exit 1, no stdout. The test
runner's exact selection passed the case named `shipping::fee::at threshold`.
Changing the library's `>=` to `>` first reproduced stale lock exit 2. After
explicit lock update, it produced 2 passed / 1 failed with exit 1; the guide
includes this necessary update before rerunning or restoring the original code.
The development process build's `entry.ts` executed through Bun and printed
`400`. The release build emitted bundled `entry.js`, also executed through Bun
with output `400`; the guide documents that release command. SSR rendering of a
literal `<script>` detail produced `&lt;script&gt;` text. Package builds used
dedicated temporary output directories, preserving the docs site's unmanaged
`dist/` output.

Forty-two marked source fences across the two languages exactly matched
the saved files. All Seseragi pipelines have one stage per line. The initial authored fences used a 45-character limit. Root integration later
checked the actual 375px layout and wrapped the overflowing expressions,
foreign signatures, and shell commands at natural boundaries. Their changed
fixtures passed the shared 53-case CLI/build/test/diagnostic gate.

## Japanese prose review

Applied the installed yomiyasu skill and linted all twelve saved Japanese pages.
Scores were 83–100. Findings were only polite sentence-ending repetition and one
meaningful contrast: an Action is distinct from its resulting state. These
technical explanations retain their meaning. No unsupported claims were added to eliminate stylistic findings.

## Browser execution evidence

The three documented Web projects were built with `--profile release` into
owned temporary directories and served on loopback port 4333. Playwright used
Chrome `154.0.8037.98`, without a user profile, at viewport 390 × 844.

All interaction assertions passed:

| Program | Observed result |
| --- | --- |
| Counter | Starts at 0; two clicks show 2; Reset shows 0. |
| Form | Empty submit shows error; Ada plus Enter shows Hello, Ada. |
| Form focus | Input stays focused and retains Ada after an update/Enter submit. |
| Form retry | Clearing input and pressing Enter displays validation again. |
| Two counters | Today becomes 2; Tomorrow becomes 1; values remain independent. |
| Styles | All three main containers have computed padding 24px. |

HTML, app CSS, and app JS loaded successfully for all three programs (nine
page-observed requests). JavaScript page errors and failed application requests
were zero. Chrome additionally requested `/favicon.ico`, which the CLI's default
document does not provide: the local server returned one 404, recorded as one
resource console message. Its console source URL and server logs identify that
missing icon separately from application failures. Generated artifacts were not
edited to hide it.

Screenshots were inspected after the final styling change. Artifacts are in:

`/var/folders/sv/0lkxn9bj6450qj171xw863p00000gn/T/seseragi-guides-browser-7tx98nz1/`

- `browser-report.json`: raw results, Chrome version, URLs, console locations.
- `counter-2-mobile.png`: counter at 2.
- `form-ada-mobile.png`: Ada entered and greeting shown with focused input.
- `two-counters-2-1-mobile.png`: independent Today 2 / Tomorrow 1.

The browser context and owned loopback server were stopped after verification.

## Root integration and reader acceptance

Compiler execution, static Web builds, and the browser behaviors above are
verified. The root agent owns site-wide navigation/search/locale integration,
code layout, production deployment, and docs-site browser verification. These
remain separate from execution of the tutorial applications.

This is an agent review from a TypeScript-reader perspective, not real-reader
feedback or evidence of every browser implementation's behavior.

## Database guide boundary

No database tutorial was fabricated from fixtures. The only inspected SQLite
package source was the compiler conformance fixture; it is not an independently
verified downloadable package/bootstrap path. SQLite and PostgreSQL contracts
can be documented in Runtime Providers/reference without claiming a tested
database deployment or presenting a fixture library as an installation recipe.

## Beginner-path revision

The TypeScript guide now compares six independent programs rather than teaching
function application, constructors, match, interpolation, arrays, and pipelines
through one delivery-state example. It first defines `double` and evaluates
`double 21`. Arithmetic grouping is introduced separately as `double (20 + 1)`.
Partial application, an array pipeline, and record fields follow in their own
files. The Delivery example is confined to constructing cases and extracting
their payload; no array/map/join/interpolation is mixed into it.

Both locales have the same eight sections and six exact marked sources. Every
fenced line in the revised comparison guide and its six fixtures is at most 37
characters. All six programs ran with CLI 0.61.25: exit 0, empty stderr, exact
expected stdout. `printValue` does not add a newline, so its five expected outputs
preserve that contract; the constructor example uses `println` and ends in a
newline. Evidence: `/tmp/seseragi-guides-migration-checks.json`.

Nine paired application guides received short links to the actual concepts their
code assumes: function application, data cases/matching, records, generics,
modules, and Effects where applicable. Stateful Features already has its
Effect/Signal/generics/modules prerequisites. Application task code and its
verified browser behavior were not rewritten.

Applied yomiyasu to the revised Japanese comparison guide. Its six notices were
only the repeated output-label colons, which were removed once; there were no
other prose notices. Added prerequisite paragraphs were checked separately.
The nine new prerequisite paragraphs passed yomiyasu lint at 100/100. The root
agent owns the final integrated docs-site layout and deployment checks.
