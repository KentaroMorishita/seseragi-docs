# Standard-library catalog audit

Reviewed on 2026-10-12 against the current compiler sources and normative
specification in `/Users/morishita/Desktop/seseragi`. This was a source and
rendered-content audit, not execution coverage of every standard-library API.
The compiler repository, original snapshot, renderer, and generated pages were
not changed by this auditor. The root agent owns integration and final browser QA.

## Coverage and preserved types

The immutable snapshot identifies Seseragi 0.61.25, release commit
`7440e9ff7f710e702b56f49c2f964280cdf64b20`. It has 64 module identities,
63 available surfaces, 1,459 raw rows, and 1,451 public module/name pairs.
The contract-only `std/http/bun` is correctly excluded from importable pages.

Extracted only `splitTop`, `pretty`, and `signatureOf` from the renderer into an
isolated Node VM; the rendering loop was not executed. An independent lexical
normalizer removed only leading, top-level argument labels. Every token in all
1,451 selected signatures was preserved: **zero token differences**. This
includes 159 constrained signatures, 54 signatures with higher-kinded notation,
nested function arrows, parentheses, braces, and optional record fields.

Before augmentation, compared every selected signature against both generated locales:
**2,902 blocks checked; zero missing blocks and zero mismatches**. In particular,
paired array, prelude, effect, stream, web-html, http, json, and transformer-state
pages preserve the snapshot's complete type text. The raw-type result is not a
claim that upstream metadata is a complete normative declaration; two concrete
limitations are recorded below. Artifact: `/tmp/seseragi-library-audit-types.json`.

The deliberate argument-label omission leaves argument order visible. The
curated descriptions explicitly explain order where two same-typed arguments
would otherwise be ambiguous, especially `std/stream::concat` and integer division.
The root agent is adjusting signature wrapping for the 375px browser viewport.

## Corrections supplied for integration

`src/data/library-description-overrides.json` supplies **31 bilingual identity
corrections** and **32 exact generic-description strings to suppress**. The
schema is `{ overrides: { identity: { ja, en } }, suppressDescriptions: [...] }`.
This keeps the original compiler snapshot intact and separates curated reader
explanations from compiler tooling metadata.

The same-name matcher in `query.rs::standard_description` precedes several
specific identities. For example, the `::get` arm at line 2063 wins before the
correct `std/ref::get` arm at line 2220; `::flatMap` at 2036 and `::append` at
2048 similarly shadow the Monad/Semigroup explanations at 2134–2137.
Descriptions therefore need identity-specific handling before generic fallback.

All identities with a concrete correction are listed here. Paths in the proof
column are relative to the compiler repository.

| Identity | Correction | Canonical proof |
| --- | --- | --- |
| `std/map::get` | Search by key, not index; missing key yields Nothing. | `runtime/ts/src/map.ts:125`; `docs/spec/10-library-surface.md:428` |
| `std/ref::get` | Returns an Effect reading the current value; no Maybe result. | `runtime/ts/src/ref.ts:19`; `query.rs:2220` |
| `std/transformer/state::get` | Returns the current state while retaining it. | `runtime/ts/src/transformer.ts:156`; `standard/transformer.rs:148` |
| `std/web/storage::get` | Read a storage-area key, with absence and typed failure. | `runtime/ts/src/storage.ts:98` |
| `std/non-empty-list::head` | Returns A directly, never an empty-list Nothing. | `runtime/ts/src/list.ts:272`; `docs/spec/10-library-surface.md:405` |
| `std/non-empty-list::tail` | Returns a List, empty for a singleton. | `runtime/ts/src/list.ts:276`; `docs/spec/10-library-surface.md:406` |
| `std/non-empty-list::toList` | Input is NonEmptyList, not Array. | `runtime/ts/src/list.ts:268` |
| `std/set::toArray` | Converts Set in iteration order, not List. | `runtime/ts/src/set.ts:122` |
| `std/set::toList` | Converts Set in iteration order, not Array. | `runtime/ts/src/set.ts:124` |
| `std/queue::take` | Removes one value, waits if empty, fails after close and drain. | `runtime/ts/src/queue.ts:197`; `docs/spec/10-library-surface.md:2009` |
| `std/prelude::Semigroup::append` | Associative instance operation; not only collection concatenation. | `docs/spec/09-standard-library.md:119`; `query.rs:2137` |
| `std/prelude::Monad::flatMap` | Value-dependent sequencing; not only collection flattening. | `docs/spec/09-standard-library.md:226`; `query.rs:2134` |
| `std/stream::concat` | Consumes the second argument before opening the first suffix. | `runtime/ts/src/stream.ts:282` |
| `std/text::concat` | Joins Array<String> into one String. | `runtime/ts/src/text.ts:42` |
| `std/regex::find` | Returns the leftmost RegexMatch with byte spans and captures. | `query.rs:2101`; `docs/spec/10-library-surface.md:844` |
| `std/text/grapheme::length` | Counts extended grapheme clusters, not an unspecified collection unit. | `runtime/ts/src/grapheme.ts:100` |
| `std/web/html::input` | Value/checked are optional; not every input is controlled. | `docs/spec/13-web-ui.md:161`; `runtime/ts/src/html.ts:1086` |
| `std/web/html::textarea` | Value is optional; not every textarea is controlled. | `docs/spec/13-web-ui.md:202`; `runtime/ts/src/html.ts:668` |
| `std/web/html::label` | Association through optional htmlFor is conditional. | `docs/spec/13-web-ui.md:268`; `runtime/ts/src/html.ts:1115` |
| `std/web/html::form` | Native submit prevention occurs only with onSubmit. | `docs/spec/13-web-ui.md:417`; `runtime/ts/src/html.ts:915` |
| `std/ref::make` | Fresh on each execution, but resulting Ref can escape into later Effects. | `runtime/ts/src/ref.ts:9` |
| `std/effect::provide` | Constructs a cold Effect; does not immediately run source. | `runtime/ts/src/effect.ts:541` |
| `std/http::responseHeaders` | Returns existing immutable Headers; does not copy. | `runtime/ts/src/http-client.ts:702` |
| `std/collection::Next` | Constructs reduction-control data; no reduction at construction. | `runtime/ts/src/collection.ts:35` |
| `std/collection::Done` | Constructs reduction-control data; no reduction at construction. | `runtime/ts/src/collection.ts:39` |
| `std/web/html::IgnoreEvent` | Event-control data interpreted by runtime, not an immediate operation. | `runtime/ts/src/html.ts:159`; `html.ts:1295` |
| `std/web/html::Dispatch` | Constructs an event-control request. | `runtime/ts/src/html.ts:162`; `html.ts:1302` |
| `std/web/html::DispatchPreventDefault` | Constructs an event-control request. | `runtime/ts/src/html.ts:164`; `html.ts:1305` |
| `std/web/html::DispatchStopPropagation` | Constructs an event-control request. | `runtime/ts/src/html.ts:168`; `html.ts:1308` |
| `std/web/html::DispatchPreventDefaultAndStop` | Constructs an event-control request. | `runtime/ts/src/html.ts:172`; `html.ts:1311` |
| `std/big-int::checkedDivide` | Quotient truncates toward zero; divisor is first argument. | `runtime/ts/src/big-int.ts:138` |

Japanese corrections were reviewed with the installed yomiyasu skill.
The lint score was 95/100, with one same-ending notice in the initial Map
explanation. That sentence was shortened once without changing its meaning.

## Generic-description policy

All 1,459 description rows were classified by kind, identity, signature, and
`query.rs` match source. The 32 omitted strings cover module-level fallback,
compiler-owned symbol/function fallback, and generic type-class descriptions.
There are **1,032 raw matching rows, 1,031 distinct identities/public names**;
427 raw rows have 350 non-generic distinct descriptions. All shared-name
fallback occurrences were checked, rather than just the eight example modules.

A whole-module description cannot describe an individual API. Examples include
`std/math::pi` being described with atan2/radians rules, DOM constructors as
running browser behavior, and HTTP failure constructors as performing requests.
Suppress generic text for every kind, including functions. Module introductions,
curated module notes, kind labels, and preserved types provide the remaining
reader context; no replacement semantics were invented for unknown definitions.

The policy includes the easily missed exact string
`Standard function provided by the compiler-owned library surface.` from
`query.rs:1560`, in addition to `Compiler-owned standard library symbol.`.
`query.rs:2369` supplies all module fallback strings; `query.rs:1376` supplies
the generic type-class string. The full affected-identity inventory is below.

## Upstream metadata limitations needing an explicit supplement

**Temporal Effect requirements (P1).** All four affected identities are
`std/effect::timeout`, `std/effect::timeoutFail`, `std/effect::retry`, and
`std/effect::repeat`. Their snapshot results contain only `{ clock: Clock }`,
although their source argument has generic environment R. This originates in
`crates/seseragi-project/src/standard.rs:2570`: its `temporal` helper builds only
a Clock record. Normative `docs/spec/10-library-surface.md:1782` and `:1817`
requires `Effect<R & { clock: Clock }, ...>`; runtime implementations at
`runtime/ts/src/effect.ts:1147` and `:1192` also require the merged environment.
This is not a formatter omission. Keep provenance intact but provide a clearly
source-grounded signature supplement or module explanation. Do not teach that
adding timeout/retry removes the source's service requirements. Compiler fixes
and compiler-suite execution remain outside this docs audit.

**Public struct fields (P2).** The snapshot signatures list only a bare name or
arity for all 18 public structs, including `StateT<_, _, _>`, `RegexSpan`, and
`RegexOptions`. Thus token preservation cannot establish that public struct
fields are fully documented. Normative `docs/spec/09-standard-library.md:347`
has StateT.run; `docs/spec/10-library-surface.md:814` has RegexOptions fields
and `:820` has RegexSpan.start/end. Supplement struct field declarations from
canonical interfaces, rather than inventing fields or exposing opaque representations.

The complete affected public-struct identities are:

- `std/web/dom::DomOptions`
- `std/web/dom::ElementRect`
- `std/child-process::CapturedProcess`
- `std/fs::DirectoryEntry`
- `std/transformer/either::EitherT`
- `std/fs::FileMetadata`
- `std/fs::FileSystemError`
- `std/log::LogEvent`
- `std/transformer/maybe::MaybeT`
- `std/transformer/reader::ReaderT`
- `std/http::ResponseHead`
- `std/transformer/state::StateT`
- `std/transformer/writer::WriterT`
- `std/regex::RegexCapture`
- `std/regex::RegexCompileError`
- `std/regex::RegexMatch`
- `std/regex::RegexOptions`
- `std/regex::RegexSpan`

**Deduplication roles (P2).** The eight duplicate module/name rows explain the
1,459→1,451 count; they are not missing public names. Five pairs repeat equivalent
function declarations/trait aliases. Three pairs have distinct type and value
roles: `std/prelude::Sum`, `std/prelude::Product`, and `std/queue::QueueClosed`.
The current selection keeps their constructor row and drops the type category.
Retain one public-name heading while acknowledging both roles where useful.

## Augmentation data now supplied

The root agent requested source-grounded supplements after the initial audit.
`src/data/library-signature-overrides.json` now contains all four temporal
corrections, each with the complete signature, a paired explanation of the
0.61.25 catalog omission, and its normative/runtime sources. These are **four
deliberate semantic corrections**, adding `R &` to the result environment; they
are separate from the zero-loss whitespace checks of the original snapshot.
Validation confirmed that no other type token changes once top-level argument
labels are normalized. The immutable original catalog remains untouched.

`src/data/library-fields.json` now covers **all 18 released public structs and
49 fields**. Every entry has a complete struct header with actual parameter
names and constructor kinds, ordered field types, paired descriptions, and
source references. For example, StateT is `StateT<S, M<_>, A>` with
`run: S -> M<(A, S)>`; it does not invent different parameter names or order.
Forty-one field names/types and 17 headers matched normative declarations exactly;
the eight ElementRect fields matched the explicit current Rust representation
and the TypeScript contract. All selected identities have kind `struct` in the
released snapshot. **Zero opaque types or opaque structs were expanded.**

Fields and declarations come from current compiler/spec/runtime sources, rather
than treating the fixture registry's historical 0.1.0 version as release data.
Japanese field descriptions passed yomiyasu lint at 100/100.

## Introductions and related links

The 64 curated module introductions and related-link grouping were inspected.
`std/collection` initially says Continue/Stop in both locales, while its reduction
constructors are **Next/Done**. `runtime/ts/src/collection.ts:31` and the catalog
agree; Continue/Break belongs to `std/effect::LoopControl`. The root agent is
repairing this introduction. Japanese grapheme introduction can say
“拡張書記素クラスタ” precisely, rather than promise a universal human-character unit.

The eight representative paired module pages have correct local locale prefixes,
imports, and reader links. The category rule sends all available network modules
`std/http`, `std/http/server`, `std/http/multipart`, `std/sse`, `std/websocket`, and
`std/websocket/server` to Learn Signals and Web UI. Prefer Learn Effects/runtime
providers for these transport APIs; reserve Web UI for actual Html/DOM modules.
Similarly, `std/test` and `std/benchmark` should link to the testing guide and the
performance reference respectively, instead of only Functions and Pipelines.
These are navigation recommendations, not claims of missing API implementation.

## Full suppressed-identity inventory

Each row groups the exact canonical identities by their public module. Canonical
identity and public module/name can differ for aliases: for example,
`std/iterator` exports `Iterator` with canonical identity
`std/prelude::Iterator`. Every canonical identity below is copied verbatim from
the snapshot; no module-prefix slicing is used. These are all 1,031 distinct
identities affected by the 32-string policy.

| Public module | Count | Exact canonical identities |
| --- | ---: | --- |
| `std/array` | 17 | `std/array::chunksOf`, `std/array::dropWhile`, `std/array::empty`, `std/array::findIndex`, `std/array::fromIterable`, `std/array::groupBy`, `std/array::init`, `std/array::last`, `std/array::reduceRight`, `std/array::singleton`, `std/array::sort`, `std/array::sortBy`, `std/array::takeWhile`, `std/array::unzip`, `std/array::windows`, `std/array::zip`, `std/array::zipWith` |
| `std/benchmark` | 9 | `std/benchmark::Benchmark`, `std/benchmark::BenchmarkEnvironment`, `std/benchmark::BenchmarkFailure`, `std/benchmark::ExplicitBenchmarkFailure`, `std/benchmark::benchmark`, `std/benchmark::blackBox`, `std/benchmark::fail`, `std/benchmark::inputSize`, `std/benchmark::suite` |
| `std/bytes` | 2 | `std/bytes::ByteOutOfRange`, `std/bytes::InvalidByteRange` |
| `std/char` | 3 | `std/char::codePoint`, `std/char::fromCodePoint`, `std/char::toString` |
| `std/child-process` | 53 | `std/child-process::ArgumentContainsNul`, `std/child-process::CaptureLimit`, `std/child-process::CapturedProcess`, `std/child-process::ChildEvent`, `std/child-process::ChildExitStatus`, `std/child-process::ChildExited`, `std/child-process::ChildExitedWith`, `std/child-process::ChildHostTerminated`, `std/child-process::ChildInput`, `std/child-process::ChildInputAfterClose`, `std/child-process::ChildInputFailed`, `std/child-process::ChildOutputChannel`, `std/child-process::ChildOutputLimitExceeded`, `std/child-process::ChildOutputReadFailed`, `std/child-process::ChildProcessConfigError`, `std/child-process::ChildProcessError`, `std/child-process::ChildProcesses`, `std/child-process::ChildSignaled`, `std/child-process::ChildSpawnFailed`, `std/child-process::ChildStderr`, `std/child-process::ChildStderrChunk`, `std/child-process::ChildStdout`, `std/child-process::ChildStdoutChunk`, `std/child-process::ChildTerminationFailed`, `std/child-process::ChildWaitFailed`, `std/child-process::CloseChildStdin`, `std/child-process::Command`, `std/child-process::EmptyExecutableName`, `std/child-process::EnvironmentNameContainsNul`, `std/child-process::EnvironmentValueContainsNul`, `std/child-process::Executable`, `std/child-process::ExecutableNameContainsSeparator`, `std/child-process::ExecutablePath`, `std/child-process::InvalidCaptureLimit`, `std/child-process::KillChild`, `std/child-process::SearchPath`, `std/child-process::SignalChild`, `std/child-process::UnsupportedChildSignal`, `std/child-process::WriteChildStdin`, `std/child-process::addArgument`, `std/child-process::addArguments`, `std/child-process::captureLimit`, `std/child-process::clearEnvironment`, `std/child-process::command`, `std/child-process::defaultCaptureLimit`, `std/child-process::inDirectory`, `std/child-process::outputBuffer`, `std/child-process::runCaptured`, `std/child-process::runInherited`, `std/child-process::runStreaming`, `std/child-process::setEnvironment`, `std/child-process::terminationGrace`, `std/child-process::unsetEnvironment` |
| `std/clock` | 1 | `std/clock::Clock` |
| `std/collection` | 2 | `std/collection::NonPositiveSize`, `std/collection::SizeError` |
| `std/console` | 8 | `std/console::error`, `std/console::errorLine`, `std/console::flush`, `std/console::print`, `std/console::printValue`, `std/console::println`, `std/prelude::Console`, `std/prelude::ConsoleError` |
| `std/deferred` | 7 | `std/deferred::Deferred`, `std/deferred::await`, `std/deferred::complete`, `std/deferred::fail`, `std/deferred::make`, `std/deferred::poll`, `std/deferred::succeed` |
| `std/effect` | 31 | `std/effect::Break`, `std/effect::Continue`, `std/effect::Fiber`, `std/effect::FiberCancelled`, `std/effect::FiberExit`, `std/effect::FiberFailed`, `std/effect::FiberSucceeded`, `std/effect::NegativeRecurrences`, `std/effect::NonPositiveParallelism`, `std/effect::Parallelism`, `std/effect::ParallelismError`, `std/effect::Schedule`, `std/effect::ScheduleContinue`, `std/effect::ScheduleDecision`, `std/effect::ScheduleError`, `std/effect::ScheduleStop`, `std/effect::acquireRelease`, `std/effect::await`, `std/effect::forEachParallel`, `std/effect::fork`, `std/effect::interrupt`, `std/effect::join`, `std/effect::parallel`, `std/effect::parallelism`, `std/effect::poll`, `std/effect::race`, `std/effect::schedule`, `std/effect::scoped`, `std/effect::traverseParallel`, `std/effect::unboundedParallelism`, `std/effect::yieldNow` |
| `std/entropy` | 10 | `std/entropy::Entropy`, `std/entropy::EntropyConfigError`, `std/entropy::EntropyError`, `std/entropy::EntropyReadFailure`, `std/entropy::EntropySize`, `std/entropy::EntropySizeTooLarge`, `std/entropy::EntropyUnavailable`, `std/entropy::NonPositiveEntropySize`, `std/entropy::entropySize`, `std/entropy::secureBytes` |
| `std/float` | 27 | `std/float::EmptyFloat`, `std/float::FloatConversionError`, `std/float::FloatNotFinite`, `std/float::FloatOutsideIntRange`, `std/float::FloatParseError`, `std/float::FloatParseOverflow`, `std/float::InvalidFloat`, `std/float::abs`, `std/float::clampNumber`, `std/float::format`, `std/float::fromInt`, `std/float::ieeeEq`, `std/float::isFinite`, `std/float::isInfinite`, `std/float::isNaN`, `std/float::isNegativeZero`, `std/float::maximumNumber`, `std/float::minimumNumber`, `std/float::nan`, `std/float::negativeInfinity`, `std/float::parse`, `std/float::positiveInfinity`, `std/float::power`, `std/float::roundIntegral`, `std/float::sign`, `std/float::toInt`, `std/float::totalCompare` |
| `std/fs` | 57 | `std/fs::Append`, `std/fs::CanonicalizePath`, `std/fs::CreateDirectory`, `std/fs::CreateNew`, `std/fs::CreateTemporary`, `std/fs::CrossDeviceMove`, `std/fs::Directory`, `std/fs::DirectoryEntry`, `std/fs::DirectoryNotEmpty`, `std/fs::FileAccessFailure`, `std/fs::FileAlreadyExists`, `std/fs::FileMetadata`, `std/fs::FileNotFound`, `std/fs::FileSystem`, `std/fs::FileSystemError`, `std/fs::FileSystemErrorKind`, `std/fs::FileSystemOperation`, `std/fs::FileSystemUnavailable`, `std/fs::FileTextError`, `std/fs::FileType`, `std/fs::FileUtf8Failure`, `std/fs::IsADirectory`, `std/fs::MovePath`, `std/fs::NotADirectory`, `std/fs::OpenDirectory`, `std/fs::OtherFileSystemError`, `std/fs::OtherFileType`, `std/fs::PathNotSupported`, `std/fs::PermissionDenied`, `std/fs::ReadFile`, `std/fs::ReadMetadata`, `std/fs::RegularFile`, `std/fs::RemovePath`, `std/fs::Replace`, `std/fs::SymbolicLink`, `std/fs::SymbolicLinkLoop`, `std/fs::WriteFile`, `std/fs::WriteMode`, `std/fs::canonicalize`, `std/fs::createDirectories`, `std/fs::createDirectory`, `std/fs::exists`, `std/fs::list`, `std/fs::metadata`, `std/fs::move`, `std/fs::readBytes`, `std/fs::readChunks`, `std/fs::readTextUtf8`, `std/fs::removeDirectory`, `std/fs::removeFile`, `std/fs::symlinkMetadata`, `std/fs::withTemporaryDirectory`, `std/fs::withTemporaryFile`, `std/fs::writeAtomic`, `std/fs::writeBytes`, `std/fs::writeChunks`, `std/fs::writeTextUtf8` |
| `std/http` | 47 | `std/http::Body`, `std/http::Http1_0`, `std/http::Http1_1`, `std/http::Http2`, `std/http::Http3`, `std/http::HttpClient`, `std/http::HttpClientUnavailable`, `std/http::HttpConnectionFailure`, `std/http::HttpDnsFailure`, `std/http::HttpEvent`, `std/http::HttpProtocolFailure`, `std/http::HttpRequestBodyFailure`, `std/http::HttpRequestLengthMismatch`, `std/http::HttpResponseBodyLimitExceeded`, `std/http::HttpTlsFailure`, `std/http::HttpUrlContainsFragment`, `std/http::HttpUrlContainsUserInfo`, `std/http::HttpVersion`, `std/http::HttpVersionUnknown`, `std/http::InformationalResponse`, `std/http::InvalidHeaderName`, `std/http::InvalidHeaderValue`, `std/http::InvalidHttpBodyLimit`, `std/http::InvalidHttpMethod`, `std/http::InvalidHttpStatus`, `std/http::InvalidHttpUrl`, `std/http::ManagedHttpHeader`, `std/http::ResponseBodyChunk`, `std/http::ResponseHead`, `std/http::ResponseStarted`, `std/http::ResponseTrailers`, `std/http::UnsupportedHttpScheme`, `std/http::bodyLimit`, `std/http::bytesBody`, `std/http::defaultBodyLimit`, `std/http::emptyBody`, `std/http::exchange`, `std/http::headerEntries`, `std/http::headerValues`, `std/http::isClientError`, `std/http::isInformational`, `std/http::isRedirection`, `std/http::isServerError`, `std/http::isSuccess`, `std/http::streamBody`, `std/http::withRequestHeader`, `std/http::withoutRequestHeader` |
| `std/http/multipart` | 11 | `std/http/multipart::InvalidMultipartFieldName`, `std/http/multipart::InvalidMultipartFileName`, `std/http/multipart::InvalidMultipartMimeType`, `std/http/multipart::Multipart`, `std/http/multipart::MultipartBuildError`, `std/http/multipart::appendBody`, `std/http/multipart::appendBytes`, `std/http/multipart::appendText`, `std/http/multipart::body`, `std/http/multipart::contentType`, `std/http/multipart::empty` |
| `std/http/server` | 26 | `std/http/server::Handler`, `std/http/server::HttpHeader`, `std/http/server::HttpServer`, `std/http/server::HttpServerError`, `std/http/server::HttpServerHandle`, `std/http/server::HttpServerRequest`, `std/http/server::HttpServerResponse`, `std/http/server::bytesResponse`, `std/http/server::close`, `std/http/server::emptyResponse`, `std/http/server::errorMessage`, `std/http/server::header`, `std/http/server::jsonResponse`, `std/http/server::listen`, `std/http/server::pureHandler`, `std/http/server::recoverHandler`, `std/http/server::requestBody`, `std/http/server::requestHeaderValues`, `std/http/server::requestHeaders`, `std/http/server::requestMethod`, `std/http/server::requestPath`, `std/http/server::requestQuery`, `std/http/server::requestUrl`, `std/http/server::serveOnce`, `std/http/server::streamResponse`, `std/http/server::textResponse` |
| `std/int` | 31 | `std/int::EmptyInt`, `std/int::IntDivisionByZero`, `std/int::IntDivisionError`, `std/int::IntOutsideRange`, `std/int::IntParseError`, `std/int::IntPowerError`, `std/int::IntPowerOverflow`, `std/int::InvalidIntDigit`, `std/int::InvalidIntRadix`, `std/int::NegativeIntExponent`, `std/int::abs`, `std/int::checkedAdd`, `std/int::checkedDivide`, `std/int::checkedMultiply`, `std/int::checkedPower`, `std/int::checkedRemainder`, `std/int::checkedSubtract`, `std/int::clamp`, `std/int::format`, `std/int::formatRadix`, `std/int::maxValue`, `std/int::maximum`, `std/int::minValue`, `std/int::minimum`, `std/int::parse`, `std/int::parseRadix`, `std/int::saturatingAdd`, `std/int::saturatingMultiply`, `std/int::saturatingPower`, `std/int::saturatingSubtract`, `std/int::sign` |
| `std/iterator` | 3 | `std/iterator::next`, `std/iterator::unfold`, `std/prelude::Iterator` |
| `std/json` | 19 | `std/json::DecodeErrorKind`, `std/json::DuplicateJsonField`, `std/json::ExpectedJsonType`, `std/json::InvalidJsonSyntax`, `std/json::InvalidJsonValue`, `std/json::JsonArray`, `std/json::JsonBool`, `std/json::JsonDecodeFailure`, `std/json::JsonField`, `std/json::JsonIndex`, `std/json::JsonNull`, `std/json::JsonNumber`, `std/json::JsonObject`, `std/json::JsonPathSegment`, `std/json::JsonString`, `std/json::JsonSyntaxFailure`, `std/json::MissingJsonField`, `std/json::UnknownJsonField`, `std/json::UnknownJsonTag` |
| `std/list` | 17 | `std/list::chunksOf`, `std/list::dropWhile`, `std/list::empty`, `std/list::findIndex`, `std/list::fromIterable`, `std/list::groupBy`, `std/list::init`, `std/list::last`, `std/list::reduceRight`, `std/list::singleton`, `std/list::sort`, `std/list::sortBy`, `std/list::takeWhile`, `std/list::unzip`, `std/list::windows`, `std/list::zip`, `std/list::zipWith` |
| `std/log` | 15 | `std/log::LogBool`, `std/log::LogDebug`, `std/log::LogError`, `std/log::LogEvent`, `std/log::LogFailure`, `std/log::LogFloat`, `std/log::LogInfo`, `std/log::LogInt`, `std/log::LogLevel`, `std/log::LogString`, `std/log::LogTrace`, `std/log::LogValue`, `std/log::LogWarn`, `std/log::Logger`, `std/log::log` |
| `std/map` | 15 | `std/map::Map`, `std/map::containsKey`, `std/map::empty`, `std/map::entries`, `std/map::fromEntries`, `std/map::insert`, `std/map::keys`, `std/map::mapKeysWith`, `std/map::mapValues`, `std/map::mergeWith`, `std/map::remove`, `std/map::singleton`, `std/map::size`, `std/map::upsert`, `std/map::values` |
| `std/math` | 20 | `std/math::acos`, `std/math::asin`, `std/math::atan`, `std/math::atan2`, `std/math::cbrt`, `std/math::cos`, `std/math::cosh`, `std/math::e`, `std/math::exp`, `std/math::hypot`, `std/math::log`, `std/math::log10`, `std/math::log2`, `std/math::pi`, `std/math::sin`, `std/math::sinh`, `std/math::sqrt`, `std/math::tan`, `std/math::tanh`, `std/math::tau` |
| `std/non-empty-list` | 5 | `std/non-empty-list::NonEmptyList`, `std/non-empty-list::cons`, `std/non-empty-list::fromList`, `std/non-empty-list::reduce1`, `std/non-empty-list::singleton` |
| `std/number` | 7 | `std/number::AwayFromZero`, `std/number::Ceiling`, `std/number::Floor`, `std/number::HalfEven`, `std/number::HalfUp`, `std/number::RoundingMode`, `std/number::TowardZero` |
| `std/path` | 19 | `std/path::AbsoluteChildPath`, `std/path::EmptyPath`, `std/path::InvalidDriveRoot`, `std/path::InvalidPathSegment`, `std/path::InvalidUncRoot`, `std/path::Path`, `std/path::PathContainsBackslash`, `std/path::PathContainsNul`, `std/path::PathError`, `std/path::child`, `std/path::current`, `std/path::extension`, `std/path::fileName`, `std/path::isAbsolute`, `std/path::join`, `std/path::normalize`, `std/path::parent`, `std/path::parse`, `std/path::render` |
| `std/prelude` | 27 | `std/prelude::Add`, `std/prelude::Applicative`, `std/prelude::Debug`, `std/prelude::Debug::debug`, `std/prelude::Div`, `std/prelude::Eq`, `std/prelude::Functor`, `std/prelude::Hash`, `std/prelude::Iterable`, `std/prelude::JsonDecode`, `std/prelude::JsonDecode::decodeJson`, `std/prelude::JsonEncode`, `std/prelude::JsonEncode::encodeJson`, `std/prelude::Monad`, `std/prelude::Monoid`, `std/prelude::Mul`, `std/prelude::One`, `std/prelude::Ord`, `std/prelude::Pow`, `std/prelude::Reducible`, `std/prelude::Rem`, `std/prelude::Semigroup`, `std/prelude::Show`, `std/prelude::Show::show`, `std/prelude::Sub`, `std/prelude::Traversable`, `std/prelude::Zero` |
| `std/process` | 19 | `std/process::CurrentDirectoryUnavailable`, `std/process::Hangup`, `std/process::Interrupt`, `std/process::InvalidArgumentEncoding`, `std/process::InvalidEnvironmentEncoding`, `std/process::InvalidEnvironmentName`, `std/process::Process`, `std/process::ProcessError`, `std/process::ProcessSignal`, `std/process::Quit`, `std/process::ReservedProcessSignal`, `std/process::Terminate`, `std/process::UnsupportedProcessSignal`, `std/process::User1`, `std/process::User2`, `std/process::arguments`, `std/process::currentDirectory`, `std/process::environment`, `std/process::signals` |
| `std/queue` | 11 | `std/queue::NonPositiveCapacity`, `std/queue::Queue`, `std/queue::QueueClosed`, `std/queue::QueueCreateError`, `std/queue::bounded`, `std/queue::close`, `std/queue::offer`, `std/queue::size`, `std/queue::tryOffer`, `std/queue::tryTake`, `std/queue::unbounded` |
| `std/random` | 18 | `std/random::EmptyRandomIntRange`, `std/random::InvalidProbability`, `std/random::NonPositiveRandomSize`, `std/random::Random`, `std/random::RandomConfigError`, `std/random::RandomRangeError`, `std/random::RandomSize`, `std/random::RandomSizeTooLarge`, `std/random::algorithmId`, `std/random::chance`, `std/random::choose`, `std/random::intBetween`, `std/random::nextBool`, `std/random::nextInt`, `std/random::randomBytes`, `std/random::randomSize`, `std/random::shuffle`, `std/random::unitFloat` |
| `std/ref` | 1 | `std/ref::Ref` |
| `std/semaphore` | 9 | `std/semaphore::NonPositivePermits`, `std/semaphore::Permit`, `std/semaphore::Semaphore`, `std/semaphore::SemaphoreCreateError`, `std/semaphore::acquire`, `std/semaphore::available`, `std/semaphore::make`, `std/semaphore::release`, `std/semaphore::withPermit` |
| `std/set` | 13 | `std/set::Set`, `std/set::contains`, `std/set::difference`, `std/set::empty`, `std/set::fromIterable`, `std/set::insert`, `std/set::intersection`, `std/set::isSubsetOf`, `std/set::map`, `std/set::remove`, `std/set::singleton`, `std/set::size`, `std/set::union` |
| `std/signal` | 16 | `std/signal::MutableSignal`, `std/signal::Signal`, `std/signal::SignalChange`, `std/signal::Subscription`, `std/signal::combine`, `std/signal::constant`, `std/signal::distinct`, `std/signal::planSet`, `std/signal::planUpdate`, `std/signal::read`, `std/signal::set`, `std/signal::subscribe`, `std/signal::switchMap`, `std/signal::transaction`, `std/signal::unsubscribe`, `std/signal::update` |
| `std/sse` | 31 | `std/sse::DecodeLimit`, `std/sse::Event`, `std/sse::InvalidSseComment`, `std/sse::InvalidSseDecodeLimit`, `std/sse::InvalidSseEventId`, `std/sse::InvalidSseEventName`, `std/sse::InvalidSseRetryMillis`, `std/sse::SseBuildError`, `std/sse::SseEventTooLarge`, `std/sse::SseInvalidContentType`, `std/sse::SseInvalidUtf8`, `std/sse::SseMalformedHttpEvents`, `std/sse::SseMalformedId`, `std/sse::SseMalformedRetry`, `std/sse::SseParseError`, `std/sse::SseUnexpectedStatus`, `std/sse::decodeLimit`, `std/sse::defaultDecodeLimit`, `std/sse::encode`, `std/sse::event`, `std/sse::eventData`, `std/sse::eventId`, `std/sse::eventName`, `std/sse::eventRetryMillis`, `std/sse::events`, `std/sse::keepAlive`, `std/sse::response`, `std/sse::withEventName`, `std/sse::withId`, `std/sse::withLastEventId`, `std/sse::withRetryMillis` |
| `std/stdin` | 23 | `std/prelude::Stdin`, `std/prelude::StdinError`, `std/stdin::ConcurrentStdinRead`, `std/stdin::InvalidStdinUtf8`, `std/stdin::LineLimit`, `std/stdin::LineLimitTooLarge`, `std/stdin::NonPositiveLineLimit`, `std/stdin::NonPositiveReadSize`, `std/stdin::ReadSize`, `std/stdin::ReadSizeTooLarge`, `std/stdin::StdinConfigError`, `std/stdin::StdinLineTooLong`, `std/stdin::StdinPositionOverflow`, `std/stdin::StdinReadFailure`, `std/stdin::StdinUnavailable`, `std/stdin::defaultLineLimit`, `std/stdin::defaultReadSize`, `std/stdin::lineLimit`, `std/stdin::lines`, `std/stdin::readChunk`, `std/stdin::readLine`, `std/stdin::readLineWith`, `std/stdin::readSize` |
| `std/stream` | 19 | `std/stream::BufferCapacity`, `std/stream::BufferCapacityError`, `std/stream::NonPositiveBufferCapacity`, `std/stream::Stream`, `std/stream::buffer`, `std/stream::bufferCapacity`, `std/stream::empty`, `std/stream::fromArray`, `std/stream::fromEffect`, `std/stream::fromIterable`, `std/stream::map`, `std/stream::mapError`, `std/stream::merge`, `std/stream::runCollect`, `std/stream::runFold`, `std/stream::runForEach`, `std/stream::singleton`, `std/stream::unfold`, `std/stream::zip` |
| `std/test` | 17 | `std/test::AssertionFailed`, `std/test::ExpectedTypedFailure`, `std/test::ExplicitTestFailure`, `std/test::Test`, `std/test::TestEnvironment`, `std/test::TestFailure`, `std/test::TypedFailureDidNotMatch`, `std/test::equal`, `std/test::expectFailure`, `std/test::fail`, `std/test::isFalse`, `std/test::isTrue`, `std/test::notEqual`, `std/test::skip`, `std/test::suite`, `std/test::test`, `std/test::timeout` |
| `std/text` | 22 | `std/text::InvalidScalarRange`, `std/text::InvalidUtf8`, `std/text::TextSliceError`, `std/text::caseFold`, `std/text::contains`, `std/text::endsWith`, `std/text::join`, `std/text::lengthBytes`, `std/text::lengthScalars`, `std/text::lines`, `std/text::replace`, `std/text::replaceAll`, `std/text::scalarAt`, `std/text::sliceScalars`, `std/text::split`, `std/text::startsWith`, `std/text::toLower`, `std/text::toUpper`, `std/text::trim`, `std/text::trimEnd`, `std/text::trimStart`, `std/text::words` |
| `std/text/grapheme` | 6 | `std/text/grapheme::GraphemeSliceError`, `std/text/grapheme::InvalidGraphemeRange`, `std/text/grapheme::at`, `std/text/grapheme::byteBoundaries`, `std/text/grapheme::clusters`, `std/text/grapheme::slice` |
| `std/text/unicode` | 45 | `std/text/unicode::ClosePunctuation`, `std/text/unicode::ConnectorPunctuation`, `std/text/unicode::Control`, `std/text/unicode::CurrencySymbol`, `std/text/unicode::DashPunctuation`, `std/text/unicode::DecimalNumber`, `std/text/unicode::EnclosingMark`, `std/text/unicode::FinalPunctuation`, `std/text/unicode::Format`, `std/text/unicode::InitialPunctuation`, `std/text/unicode::LetterNumber`, `std/text/unicode::LineSeparator`, `std/text/unicode::LowercaseLetter`, `std/text/unicode::MathSymbol`, `std/text/unicode::ModifierLetter`, `std/text/unicode::ModifierSymbol`, `std/text/unicode::NFC`, `std/text/unicode::NFD`, `std/text/unicode::NFKC`, `std/text/unicode::NFKD`, `std/text/unicode::NonspacingMark`, `std/text/unicode::NormalizationForm`, `std/text/unicode::OpenPunctuation`, `std/text/unicode::OtherLetter`, `std/text/unicode::OtherNumber`, `std/text/unicode::OtherPunctuation`, `std/text/unicode::OtherSymbol`, `std/text/unicode::ParagraphSeparator`, `std/text/unicode::PrivateUse`, `std/text/unicode::SpaceSeparator`, `std/text/unicode::SpacingMark`, `std/text/unicode::TitlecaseLetter`, `std/text/unicode::Unassigned`, `std/text/unicode::UnicodeGeneralCategory`, `std/text/unicode::UppercaseLetter`, `std/text/unicode::fullCaseFold`, `std/text/unicode::generalCategory`, `std/text/unicode::isAlphabetic`, `std/text/unicode::isDecimalDigit`, `std/text/unicode::isMark`, `std/text/unicode::isNormalized`, `std/text/unicode::isWhitespace`, `std/text/unicode::normalize`, `std/text/unicode::simpleCaseFold`, `std/text/unicode::version` |
| `std/time` | 51 | `std/time::Ambiguous`, `std/time::DateTimeError`, `std/time::Duration`, `std/time::DurationError`, `std/time::DurationOutsideRange`, `std/time::Gap`, `std/time::Instant`, `std/time::InvalidDate`, `std/time::InvalidDateTimeText`, `std/time::InvalidTime`, `std/time::InvalidUtcOffsetSeconds`, `std/time::LocalDate`, `std/time::LocalDateTime`, `std/time::LocalResolution`, `std/time::LocalTime`, `std/time::NegativeDuration`, `std/time::OffsetDateTime`, `std/time::TimeZone`, `std/time::TimeZoneDatabaseUnavailable`, `std/time::TimeZoneDatabaseVersionMismatch`, `std/time::TimeZoneError`, `std/time::TimeZones`, `std/time::Unique`, `std/time::UnknownTimeZone`, `std/time::UtcOffset`, `std/time::ZonedDateTime`, `std/time::atOffset`, `std/time::atTimeZone`, `std/time::databaseVersion`, `std/time::formatLocalDate`, `std/time::formatLocalDateTime`, `std/time::formatLocalTime`, `std/time::formatOffsetDateTime`, `std/time::loadTimeZone`, `std/time::localDate`, `std/time::localDateTime`, `std/time::localTime`, `std/time::offsetInstant`, `std/time::offsetLocalDateTime`, `std/time::parseLocalDate`, `std/time::parseLocalDateTime`, `std/time::parseLocalTime`, `std/time::parseOffsetDateTime`, `std/time::resolveLocal`, `std/time::timeZoneId`, `std/time::timeZoneVersion`, `std/time::utcOffset`, `std/time::zonedInstant`, `std/time::zonedLocalDateTime`, `std/time::zonedOffset`, `std/time::zonedTimeZone` |
| `std/transformer/either` | 4 | `std/transformer/either::EitherT`, `std/transformer/either::fromEither`, `std/transformer/either::lift`, `std/transformer/either::run` |
| `std/transformer/maybe` | 4 | `std/transformer/maybe::MaybeT`, `std/transformer/maybe::fromMaybe`, `std/transformer/maybe::lift`, `std/transformer/maybe::run` |
| `std/transformer/reader` | 6 | `std/transformer/reader::ReaderT`, `std/transformer/reader::ask`, `std/transformer/reader::asks`, `std/transformer/reader::lift`, `std/transformer/reader::local`, `std/transformer/reader::run` |
| `std/transformer/state` | 5 | `std/transformer/state::StateT`, `std/transformer/state::lift`, `std/transformer/state::modify`, `std/transformer/state::put`, `std/transformer/state::run` |
| `std/transformer/writer` | 5 | `std/transformer/writer::WriterT`, `std/transformer/writer::lift`, `std/transformer/writer::listen`, `std/transformer/writer::run`, `std/transformer/writer::tell` |
| `std/web/dom` | 64 | `std/web/dom::BindingTarget`, `std/web/dom::CleanupMode`, `std/web/dom::ClearRenderedDom`, `std/web/dom::DispatchFailure`, `std/web/dom::Dom`, `std/web/dom::DomBinding`, `std/web/dom::DomContent`, `std/web/dom::DomError`, `std/web/dom::DomEventQueueOverflow`, `std/web/dom::DomFailure`, `std/web/dom::DomMount`, `std/web/dom::DomObservation`, `std/web/dom::DomOperationFailed`, `std/web/dom::DomOptions`, `std/web/dom::DomRuntimeError`, `std/web/dom::DomTarget`, `std/web/dom::DomTargetAlreadyMounted`, `std/web/dom::DomTargetNotFound`, `std/web/dom::DomTargetRemoved`, `std/web/dom::ElementRect`, `std/web/dom::FreshMount`, `std/web/dom::HydrateOrReplace`, `std/web/dom::HydrateStrict`, `std/web/dom::HydrationMismatch`, `std/web/dom::HydrationMode`, `std/web/dom::InvalidSelector`, `std/web/dom::PreserveRenderedDom`, `std/web/dom::ariaBooleanTarget`, `std/web/dom::ariaBusyTarget`, `std/web/dom::ariaExpandedTarget`, `std/web/dom::ariaHiddenTarget`, `std/web/dom::ariaLabelTarget`, `std/web/dom::ariaSelectedTarget`, `std/web/dom::attributeTarget`, `std/web/dom::awaitMount`, `std/web/dom::awaitObservation`, `std/web/dom::bind`, `std/web/dom::bindAttribute`, `std/web/dom::bindChecked`, `std/web/dom::bindRegion`, `std/web/dom::bindStyle`, `std/web/dom::bindText`, `std/web/dom::bindValue`, `std/web/dom::booleanAttributeTarget`, `std/web/dom::checkedTarget`, `std/web/dom::classTarget`, `std/web/dom::content`, `std/web/dom::defaultOptions`, `std/web/dom::disabledTarget`, `std/web/dom::disconnect`, `std/web/dom::hiddenTarget`, `std/web/dom::inertTarget`, `std/web/dom::initialHtml`, `std/web/dom::mount`, `std/web/dom::mountContent`, `std/web/dom::query`, `std/web/dom::regionTarget`, `std/web/dom::run`, `std/web/dom::runContent`, `std/web/dom::styleTarget`, `std/web/dom::textTarget`, `std/web/dom::titleTarget`, `std/web/dom::unmount`, `std/web/dom::valueTarget` |
| `std/web/file` | 16 | `std/web/file::Blob`, `std/web/file::BlobBuildError`, `std/web/file::BlobReadError`, `std/web/file::BlobReadFailure`, `std/web/file::BlobReadLimitExceeded`, `std/web/file::File`, `std/web/file::InvalidBlobMimeType`, `std/web/file::asBlob`, `std/web/file::body`, `std/web/file::fromBytes`, `std/web/file::lastModifiedMillis`, `std/web/file::mimeType`, `std/web/file::name`, `std/web/file::readBytes`, `std/web/file::readChunks`, `std/web/file::sizeBytes` |
| `std/web/html` | 28 | `std/web/html::AnchorProps`, `std/web/html::ButtonProps`, `std/web/html::ElementProps`, `std/web/html::ElementRef`, `std/web/html::FileChangeEvent`, `std/web/html::FormProps`, `std/web/html::Html`, `std/web/html::ImageProps`, `std/web/html::InputProps`, `std/web/html::LabelProps`, `std/web/html::Style`, `std/web/html::TextareaProps`, `std/web/html::button`, `std/web/html::capturePointer`, `std/web/html::div`, `std/web/html::elementRef`, `std/web/html::fragment`, `std/web/html::h1`, `std/web/html::h2`, `std/web/html::main`, `std/web/html::p`, `std/web/html::releasePointer`, `std/web/html::section`, `std/web/html::span`, `std/web/html::suppressCompatibilityClick`, `std/web/html::text`, `std/web/html::trait(IntoChildren)`, `std/web/html::trait(StyleRecord)` |
| `std/web/navigation` | 41 | `std/web/navigation::CrossOriginNavigation`, `std/web/navigation::InvalidPercentEncoding`, `std/web/navigation::InvalidUrl`, `std/web/navigation::Location`, `std/web/navigation::Navigation`, `std/web/navigation::NavigationError`, `std/web/navigation::NavigationSecurityFailure`, `std/web/navigation::NavigationUnavailable`, `std/web/navigation::Query`, `std/web/navigation::UnsupportedUrlScheme`, `std/web/navigation::Url`, `std/web/navigation::UrlBuildError`, `std/web/navigation::UrlContainsUserInfo`, `std/web/navigation::appendQuery`, `std/web/navigation::back`, `std/web/navigation::current`, `std/web/navigation::emptyQuery`, `std/web/navigation::errorMessage`, `std/web/navigation::forward`, `std/web/navigation::locationSignal`, `std/web/navigation::locationUrl`, `std/web/navigation::parseQuery`, `std/web/navigation::parseUrl`, `std/web/navigation::pathSegments`, `std/web/navigation::push`, `std/web/navigation::queryEntries`, `std/web/navigation::queryValues`, `std/web/navigation::removeQuery`, `std/web/navigation::renderQuery`, `std/web/navigation::renderUrl`, `std/web/navigation::replace`, `std/web/navigation::resolveUrl`, `std/web/navigation::setQuery`, `std/web/navigation::toWebUrl`, `std/web/navigation::urlFragment`, `std/web/navigation::urlOrigin`, `std/web/navigation::urlQuery`, `std/web/navigation::withFragment`, `std/web/navigation::withPathSegments`, `std/web/navigation::withQuery`, `std/web/navigation::withoutFragment` |
| `std/web/storage` | 13 | `std/web/storage::Local`, `std/web/storage::Session`, `std/web/storage::Storage`, `std/web/storage::StorageArea`, `std/web/storage::StorageError`, `std/web/storage::StorageQuotaExceeded`, `std/web/storage::StorageSecurityFailure`, `std/web/storage::StorageUnavailable`, `std/web/storage::clear`, `std/web/storage::errorMessage`, `std/web/storage::keys`, `std/web/storage::remove`, `std/web/storage::set` |
| `std/web/svg` | 34 | `std/web/svg::Svg`, `std/web/svg::ariaLabelTarget`, `std/web/svg::circle`, `std/web/svg::cxTarget`, `std/web/svg::cyTarget`, `std/web/svg::fillTarget`, `std/web/svg::g`, `std/web/svg::heightTarget`, `std/web/svg::line`, `std/web/svg::opacityTarget`, `std/web/svg::path`, `std/web/svg::pathDataTarget`, `std/web/svg::pointerEventsTarget`, `std/web/svg::pointsTarget`, `std/web/svg::polygon`, `std/web/svg::polyline`, `std/web/svg::radiusTarget`, `std/web/svg::rect`, `std/web/svg::rxTarget`, `std/web/svg::ryTarget`, `std/web/svg::strokeTarget`, `std/web/svg::strokeWidthTarget`, `std/web/svg::svg`, `std/web/svg::text`, `std/web/svg::toHtml`, `std/web/svg::transformTarget`, `std/web/svg::viewBoxTarget`, `std/web/svg::widthTarget`, `std/web/svg::x1Target`, `std/web/svg::x2Target`, `std/web/svg::xTarget`, `std/web/svg::y1Target`, `std/web/svg::y2Target`, `std/web/svg::yTarget` |
| `std/websocket` | 16 | `std/websocket::WebSocketClient`, `std/websocket::WebSocketClose`, `std/websocket::WebSocketConnection`, `std/websocket::WebSocketError`, `std/websocket::WebSocketEvent`, `std/websocket::closeCode`, `std/websocket::closeConnection`, `std/websocket::closeReason`, `std/websocket::closeWasClean`, `std/websocket::connect`, `std/websocket::errorMessage`, `std/websocket::foldEvent`, `std/websocket::messages`, `std/websocket::selectedProtocol`, `std/websocket::sendBytes`, `std/websocket::sendText` |
| `std/websocket/server` | 5 | `std/websocket/server::Handler`, `std/websocket/server::WebSocketServer`, `std/websocket/server::WebSocketServerHandle`, `std/websocket/server::closeServer`, `std/websocket/server::listen` |

Snapshot SHA-256: `e046c8ddecabff68d7884fce09fee1f1970d0b0ef5c8930d0bc85d59ffba15f3`.
