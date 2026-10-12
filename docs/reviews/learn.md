# Learn authoring and verification review

This is an agent-authored content and specification review, not feedback from a real first-time reader. Browser rendering, production publishing, and whole-site navigation are integration checks owned by the root task.

## Scope

Added 14 Japanese pages and 14 matching English pages under `content/{docs,en}/learn`:

- index
- values-and-expressions
- functions-and-pipelines
- records-and-structs
- algebraic-data-types
- pattern-matching
- arrays-and-lists
- maybe-and-either
- generics
- recursion
- effects
- signals
- type-classes
- modules

The existing first-program and local-development pages, navigation metadata, site components, package tooling, and Git history were not changed by this author.

## Curriculum and reader assumptions

The course assumes basic JavaScript or TypeScript functions, arrays, objects, and conditionals. ADTs, currying, Functor/Monad terminology, and nominal typing are explained where needed. Each lesson starts with a concrete problem, provides a complete example and output, explains the evaluation/type rules, offers an input or type change, and links to the next lesson and exact reference.

The index groups the path into value transformation, data and outcomes, reusable computation, and external interactions. `first-program` and `local-development` remain the first practical steps. Applications are linked only after the relevant concepts are introduced.

## Source evidence

The compiler and source repository was read only at `/Users/morishita/Desktop/seseragi`. Execution used `seseragi 0.61.25` (release commit `7440e9ff7f71`, aarch64-apple-darwin).

| Lesson | Canonical sources consulted |
| --- | --- |
| values-and-expressions | spec 01 §1.2, 02 §2.2–2.4, 03 §3.1–3.3; lesson 02 |
| functions-and-pipelines | spec 01 §1.4/1.6, 02 §2.7, 03 §3.11; lessons 02/04 |
| records-and-structs | spec 02 §2.6, 03 §3.5/3.7; lesson 07 |
| algebraic-data-types | spec 03 §3.4; lesson 07 |
| pattern-matching | spec 03 §3.2.1/3.2.2/3.10; lessons 03/12 |
| arrays-and-lists | spec 03 §3.8–3.9, 10 §10.5; lesson 04 |
| maybe-and-either | spec 05 §5.2–5.3, 09 §9.2/9.7; lessons 08/10 |
| generics | spec 02 §2.5/2.12/2.14/2.15/2.17; lesson 11 |
| recursion | spec 02 §2.9, 03 §3.2, 14 §14.8; lesson 19 |
| effects | spec 05 §5.4–5.6, 09 §9.8; compact and contract forms checked by execution |
| signals | spec 05 §5.12–5.15; lesson 15 and signal-composition sample |
| type-classes | spec 04 §4.1–4.9; lesson 13 and traits-and-instances sample |
| modules | spec 06 and 11; project-greeting sample |

These sources informed the explanations. A normative contract alone was not used as proof that an example runs.

## Executable checks

`examples/learn/checks.json` records 16 execution cases and exact stdout. Every case passed with the installed release. The modules case is a package directory, with `seseragi.toml`, a generated `seseragi.lock`, and two files under `src`.

Commands:

```sh
seseragi --version
seseragi run examples/learn/values-and-expressions.ssrg
seseragi run examples/learn/functions-and-pipelines.ssrg
seseragi run examples/learn/records-and-structs.ssrg
seseragi run examples/learn/algebraic-data-types.ssrg
seseragi run examples/learn/pattern-matching.ssrg
seseragi run examples/learn/arrays-and-lists.ssrg
seseragi run examples/learn/list-patterns.ssrg
seseragi run examples/learn/maybe-and-either.ssrg
seseragi run examples/learn/generics.ssrg
seseragi run examples/learn/recursion.ssrg
seseragi run examples/learn/effects.ssrg
seseragi run examples/learn/signals.ssrg
seseragi run examples/learn/signal-transaction.ssrg
seseragi run examples/learn/type-classes.ssrg
seseragi run examples/learn/deriving.ssrg
seseragi lock update examples/learn/modules
seseragi run examples/learn/modules
```

The recursion example computes 100000 iterations and returns `5000050000`. The Effect example proves cold construction and repeat execution by output order. The Signal examples verify a captured value before and after update and a transaction's final derived value. Subscription lifetimes and glitch-free notification are explained from the canonical contract; these two executable snippets do not independently exercise subscribers.

An additional 18 exercise variations were executed in temporary files. Successful variations covered score boundaries, pipeline ordering, odd-square filtering, missing/out-of-range inputs, Signal transformation/update changes, Effect construction without execution, polymorphic local lambdas, and tuple constructor payloads. Negative variations were rejected for mismatched branch types, missing ADT/match cases, arithmetic on an unconstrained generic value, and a missing Render instance.

## Authoring and language checks

- JSX example markers are immediately before complete `seseragi` fences. Every marked fence was compared with the source file and matched exactly in both locales.
- Other partial declarations/expressions use `text` fences and are identified as fragments.
- Every code line in these lessons is at most 42 characters, including indentation. Pipelines place every stage on its own line at the initial value's indentation.
- All internal links use the correct locale prefix. Final existence and anchors are checked by root after all areas are integrated.
- Reader-facing pages contain no GitHub spec, Markdown, or status links.
- yomiyasu was applied to every saved Japanese Learn page. Static scores were 81–100. Notices were sentence-ending repetition and teaching contrasts; natural technical explanations and contrasts needed to prevent specific misunderstandings were retained. One unnecessary object-state contrast in the partial-application explanation was rewritten directly.

## Semantics retained in the explanations

- ordinary strict evaluation differs from cold Effect execution;
- immutable bindings and snapshots differ from MutableSignal state;
- record structural typing differs from struct/ADT nominal identity;
- Array indexing returns Maybe and Lists have no index syntax;
- refutable patterns are not ordinary `let` or `do <-` bindings;
- guarded arms do not prove match exhaustiveness;
- compact inferred Effect declarations differ from explicit-contract defaults;
- an ordinary `fn` can return an explicitly typed Effect value;
- direct pure self tail calls have a stack guarantee that does not extend to mutual/non-tail recursion;
- type class selection is static, and laws are not compiler proofs;
- multiple modules require package execution and a current lockfile.

## Implementation pitfalls found while authoring

A template whose first character after a backtick is `[` is lexed as a List literal. The custom Render example therefore uses `<...>` delimiters. The multi-module example failed as standalone-file execution and was made a runnable package. These corrections are reflected in both translations and the execution manifest. The modules exercise also explicitly updates the lock after editing; a temporary-package reproduction confirmed stale-source `SES-K0102` before updating and the intended `PrivateExport` rejection afterward.

## Console contract correction during integration

The canonical Console `println` operation takes `String`. The released 0.61.25 compiler currently lets an unqualified `println 42` through an Effect body and the runtime prints it via host string coercion, while `std/console`-qualified `println 42` rejects the `Int` argument with `SES-T0101`. This inconsistent path is an implementation defect, not a supported convenience taught by the docs.

Updated numeric outputs in the functions/pipelines, List traversal, generics, recursion, and Signal-transaction fixtures to apply `show` before `println`; refreshed the exact corresponding fences in both locales. Every changed case passed again with its original expected stdout. The output manifest required no stdout changes. All marked paired fences still match their fixtures and all code lines remain at most 42 characters. Functions, collections, and generics now explain the explicit String conversion where it matters to the reader.
