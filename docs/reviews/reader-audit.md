# Agent reader audit

This is a simulated TypeScript-reader review by an agent. It is not observed feedback from a real first-time reader, and it does not replace browser or production acceptance.

## Reviewed surfaces

Read the content architecture, Japanese overview, all 11 Japanese application guides and their index, and all 15 Japanese language reference pages and their index. Compared the English overview and the state/actions counterpart for the concrete wording issues below. The Learn curriculum was reviewed separately in `learn.md`. The generated library catalog and full English translation review remain separate integration responsibilities.

The intended reader knows TypeScript functions, arrays, objects, `if`, and ordinary async code. The review checked learning dependencies, type/Effect boundaries, runnable procedures, and terminology.

## Findings and resolution status

### P1, repaired: Testing modification required a lock update

Location: `content/{docs,en}/guides/testing.mdx`, the exercise changing `subtotal >= 3000` to `subtotal > 3000`.

The page says the boundary test fails. A reader following that instruction and rerunning `seseragi test` instead gets exit 2 and `SES-K0102`, because the edited source no longer matches the lock. The expected assertion failure is not reached.

Reproduced with the installed 0.61.25 CLI in a temporary copy of `examples/guides/testing`:

1. Edit only `src/shipping.ssrg` to use `>`.
2. `seseragi test PACKAGE` → exit 2, stale content digest.
3. `seseragi lock update PACKAGE` → exit 0.
4. `seseragi test PACKAGE` → exit 1, `2 passed; 1 failed; 0 skipped`, expected 0 versus actual 400 at the threshold.

Repair: explicitly run lock update and test after editing, and repeat lock update after restoring the original function. This keeps the demonstration of exit 1 versus exit 2 accurate. Root applied the repair in both locales; the current Japanese page explicitly updates the lock after changing and after restoring the function.

The same issue in the Learn/modules `pub` exercise was repaired in its owner files. A temporary reproduction showed `SES-K0102` before updating the lock, then the intended `PrivateExport` link rejection after updating.

### P2, repaired: Benchmark command exceeded mobile source width

Location: `content/{docs,en}/reference/performance.mdx`, the benchmark command under measurement/comparison.

The command contains all options on one line with expanded spaces. It is materially wider than the 42-character authoring budget used by Learn. A reader on a phone must rely on CSS wrapping, which loses shell-command structure.

Repair: put `seseragi benchmark .` and the option groups on explicit backslash-continued shell lines. Preserve the actual command and option values. This is a source-layout repair, not a request to change site styles. The current source in both locales uses three backslash-continued lines; the longest is 36 characters.

### P3: The advanced stateful-feature guide should state its learning prerequisites

Location: `content/{docs,en}/guides/stateful-features.mdx`, before the first code listing.

This is the first application example combining `Signal<Html<Task<Unit>>>`, child-owned Effect construction, explicit DOM dispatch, and package imports. A TypeScript reader arriving through Components is shown the nested type before `Task<A>` has been related to `Effect<{}, Never, A>` in the guide. The prose explains ownership well, but its first code listing assumes Effect, Signal, generics, and module knowledge that the site's guide route does not explicitly establish.

Repair: add a short prerequisite paragraph linking the Learn Effect, Signal, generics, and modules lessons, and name `Task<Unit>` as a service-free, recoverable-failure-free Effect used here as the event's Action. The body can remain focused on ownership.

## Issues identified and already repaired during integration

- Overview called `Packing` a parcel in transit; it now describes packing/preparation consistently with the first lesson and English counterpart.
- Overview implied that any function containing `println` must use the `effect` modifier. An ordinary `fn` can return an explicitly typed Effect. Root changed the explanation to describe returning an Effect rather than requiring one syntax form.
- State/actions called `Model { ...model, draft: value }` a record even though Forms declares `struct Model`. The guide now names it a struct in both locales, preserving the Learn distinction between structural records and nominal structs.

## Checks that prevented false findings

- A suspected String `+` issue in the custom-operator syntax example was tested and accepted by 0.61.25; it is not a finding.
- Uppercase function names and lowercase type declarations were tested and rejected. The syntax reference's case rule is consistent with the implementation.
- Typed logical DOM binding names were checked against the active driver test and runtime definitions. Their presence was not rejected merely because older memory described them as planned.
- Nullable aliases were compared with the canonical interop specification; `Js.Nullable<A>` is documented as an alias including null and undefined and is consistent with the table.

## Assessment

The site now has a coherent path from a runnable first example through immutable values, explicit data states, failures, Effect, state ownership, and package boundaries. Guides use complete file layouts and output rather than placeholder API lists. Reference keeps evaluation, type constraints, target restrictions, and current-tool limitations separate from application steps.

The procedure and command-layout repairs were confirmed in the current source. The remaining bounded improvement is the advanced guide prerequisite paragraph; then run whole-site link and browser checks. Actual novice-reader feedback remains uncollected and is not claimed by this audit.


## User feedback and focused teaching repair

The user subsequently identified a concrete problem the simulated review had not caught: explaining space-separated calls with `label (Sent "Kyoto")` mixed application, constructor payloads, and grouping at the same moment. Reusing the whole parcel program to teach many concepts also overloaded the introduction.

The first-program page now runs only a two-line Hello world and changes one string. Local setup and the chapter index follow that same entry point. The overview uses a small numeric add definition and `add 2 3`. Learn introduces bindings, conditionals, templates, simple calls, ADT declarations, and pattern payloads with separate focused examples. The TypeScript guide has six independent examples instead of one composite migration program. Existing application guides compose known concepts and name their prerequisites. The homepage parcel program illustrates language features and links to the state-modeling chapter; it is not used as a universal lesson.

This repair is grounded in actual user feedback. It does not turn the previous agent review into real novice-reader acceptance. Fixture execution, generated-type checks, layout, browser interaction, and human understanding remain separate evidence.
