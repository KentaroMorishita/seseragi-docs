# Curated standard-library usage notes

Reviewer: documentation agent. This is an agent review for a TypeScript reader, not feedback from a human reader.

## Delivered scope

`src/data/library-notes.json` contains 25 modules and 102 paired Japanese/English bullets. Each module has 3–5 notes explaining choices, evaluation order, cost, error handling, or resource ownership. The notes supplement signatures; they do not invent parameter labels or repeat generic symbol descriptions.

Covered modules: Array, List, Map, Set, Maybe, Either, Validation, Text, Grapheme, Unicode, Int, Float, JSON, Bytes, Effect, Stream, Signal, Time, FS, HTTP client, HTTP server, Html, DOM, Test, and Benchmark.

## Primary evidence

The compiler repository `/Users/morishita/Desktop/seseragi` was read only. Current implementation identity is Seseragi 0.61.25 / `7440e9ff7f71`. The following specification sections support the notes; paths in this table are relative to that repository.

| Notes | Primary specification evidence |
| --- | --- |
| Maybe / Either / Validation | `docs/spec/10-library-surface.md` lines 136–224: strict fallback arguments; Traversable delegation; first-Left order versus callback evaluation; independent error accumulation and NonEmptyList |
| Array / List | `10-library-surface.md` lines 246–395 and `03-data-and-expressions.md` §3.8: strict results; callback order; stable sortBy with one key evaluation; Array rest-copy cost; List head/tail versus indexed operations |
| Map / Set | `10-library-surface.md` lines 414–560: Eq/Hash laws; insertion order; duplicate handling; collision complexity; order-insensitive equality; Set map deduplication and absence of a lawful Functor instance |
| Text | `10-library-surface.md` lines 709–794: scalar indexing; literal replacement; checked end-exclusive ranges; locale-independent casing; trim excludes U+FEFF |
| Int / Float | `10-library-surface.md` lines 906–1025 and `09-standard-library.md` lines 84–119: safe-integer bounds; checked/saturating operations; text parsing; zero-direction division; NaN prevents standard Float Eq/Ord/Hash |
| Bytes | `10-library-surface.md` lines 1220–1283: checked byte/range construction; independent foreign copies; shared slice storage; strict and lossy UTF-8 |
| Grapheme / Unicode | `10-library-surface.md` lines 1326–1400: extended UAX #29 clusters; byte-exact reconstruction; linear input scans; explicit normalization; simple/full case folding; pinned Unicode version |
| JSON | `10-library-surface.md` lines 1400–1511: exact Decimal numbers; duplicate rejection; decode paths; required Maybe versus missing optional fields; insertion-order serialization; no standard Float codec |
| Time | `10-library-surface.md` lines 1511–1590: Instant/local/offset/zone distinctions; checked nonnegative Duration; explicit ambiguous/gap resolution; pinned TimeZones data |
| Effect | `10-library-surface.md` lines 1739–1874: cold execution; typed failure versus defect/cancellation; explicit sequencing/parallelism; scoped reverse-order finalization; timeout cleanup; operation reexecution |
| Stream | `10-library-surface.md` lines 2038–2242: fresh producer/scope; pull demand; bounded buffers; sequential flatMap versus concurrent merge; terminal resource cleanup |
| Signal | `05-effects.md` §§5.12–5.15: explicit graph dependencies; Effectful read/update; default same-value notifications; transaction commit; combined snapshots; serial scoped subscription |
| FS | `10-library-surface.md` lines 2315–2507: lexical Path versus authorization; absence versus I/O failure; strict whole-file reads; chunk/directory scoped cleanup |
| HTTP | `10-library-surface.md` lines 2739–2909: non-2xx remains a response; explicit small-body limit; ordered case-insensitive headers; no implicit policies/encoding decode; cold exchange and cancellation cleanup |
| HTTP server | `10-library-surface.md` lines 2909–3016: body snapshot; Never handler boundary; explicit error responses; child request scopes; nonempty chunks no larger than 65,536 bytes |
| Html / DOM | `13-web-ui.md`: pure Html and normal function components; supported IntoChildren forms; checked URL/attribute inputs; sink escaping; SSR event omission; explicit DomContent bindings; scoped listeners/actions; bounded FIFO; local sibling keys |
| Test / Benchmark | `10-library-surface.md` lines 3442–3551: immutable discovery trees; isolated case environments/scopes; typed-only expected failure; measured-body reconstruction; positive problem sizes; blackBox observational conditions; case failures versus statistical samples |

Specific runtime corroboration was read in `runtime/ts/src/sum.ts` (strict ordinary `withDefault`/`orElse`; delegated Maybe/Either traversal), `traversable.ts` (calls callbacks through the source traversal rather than stopping after Left/Nothing), `map.ts` and `persistent-index.ts` (persistent ordered hash-index structure), `validation.ts` (left-before-right accumulated errors), `signal.ts` (transaction publication and serial observers), `test.ts` (typed expected failure and leaked-resource handling), and `benchmark.ts` (blackBox returns its input without observable allocation, retained global state, identity conversion, or added evaluation).

## Verification and boundaries

- JSON parsed successfully. All 25 keys exist in the current `src/data/standard-library.json` module list with `status: available`.
- Every locale array has 3–5 nonempty strings; paired locale lengths match; there are 102 notes per locale.
- Japanese and English were reviewed together for equivalent conditions. Japanese prose was checked with the current yomiyasu lint. Its remaining notice concerns repeated explanatory verb endings; preserving the precise cleanup condition is preferable to changing meaning for a score.
- Maybe's strict fallback differs from lazy `??`. Neither Maybe nor Either `traverse` promises to skip later pure callbacks; first failure in the result does not prove short-circuit traversal. These distinctions are explicit.
- Effect recovery notes preserve the typed-failure/defect/cancellation boundary. Signal notes limit transaction guarantees to stable graph updates and explicitly avoid treating separate reads as one snapshot.
- English symbol-description metadata was not used as semantic evidence. Some upstream descriptions require per-symbol corrections; another agent owns that correction/suppression dictionary. These notes rely on primary contracts and current runtime instead.
- The module catalog's target/service metadata remains authoritative for provider availability. General module semantics do not imply every provider is supported on every host.
- This change adds explanatory prose, not new executable samples. It does not claim browser, production, or real-reader acceptance; root integration owns generation, build, mobile rendering, and deployment checks.
