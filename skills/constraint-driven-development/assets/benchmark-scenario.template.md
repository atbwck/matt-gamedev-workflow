# Reproducible Game Benchmark Scenario

Status: **draft — not enforced**. This is a capture record, not an executable
benchmark or a verified command recipe. Filled-in candidate numbers remain
**not enforced** until approved and connected to a proved contract gate.

## Scenario and build identity

| Field | Capture value |
| --- | --- |
| Scenario ID / owner / capture date | Not supplied |
| Task / symptom / intended player experience | Not supplied |
| Runtime subproject / source revision / dirty changes / artifact hash | Not supplied |
| Engine declaration path / declared version | Not supplied |
| Actual engine executable / exact version / custom build evidence | Not supplied |
| Scripting runtime / compiler / relevant plugin and package versions | Not supplied |
| Profiler / capture tool / parser and report format versions | Not supplied |
| Platform / hardware / CPU / GPU / RAM / graphics memory / storage | Not supplied |
| OS / driver / device power and thermal state / background workload | Not supplied |
| Renderer / graphics backend / pipeline and relevant versions | Not supplied |
| Build configuration / architecture / scripting backend / symbols | Not supplied |
| Editor or player / development or representative release / profiler overhead | Not supplied |
| Resolution / dynamic resolution / quality / VSync / frame cap | Not supplied |
| Physics tick / time scale / simulation and networking settings | Not supplied |
| Scene or map / asset and data set / route / camera / input sequence | Not supplied |
| Entity and effect workload / seed / save state / multiplayer roles | Not supplied |

A numeric engine association or feature tag is not proof of an exact patch or
custom executable. Label source/build mismatches before comparing results.
Do not present editor, debug, or instrumentation-heavy data as shipping numbers.

## Cache and capture protocol

Record cold and warm captures separately. Define what is cold: process start,
OS/file cache, imported resources, shader/PSO cache, streamed assets, or network
cache. Do not erase shared caches or user data merely to make a cold run.

| Field | Capture value |
| --- | --- |
| Cold/warm cache definitions and safe setup procedure | Not supplied |
| Prerequisites / startup order / loading stage boundaries | Not supplied |
| Warm-up / sampling duration / frame count / repeated runs | Not agreed — not enforced |
| Start and stop markers / steady-state segment / hitch definition | Not agreed — not enforced |
| Exact capture command or project UI procedure / working directory | Not discovered — not enforced; no executable example |
| Environment variables / runner stage / timeout | Not supplied; no secrets |
| Output location / unique run ID / logs / raw trace and report paths | Not supplied |
| Expected sample/report validity and revision checks | Not agreed — not enforced |
| Variability summary / outlier policy / failed-run handling | Not agreed — not enforced |

Do not silently discard slow runs. Record exclusions and their reasons.
Execution errors, timeout, missing/malformed/stale reports, unsupported report
versions, and unexpectedly empty samples fail an enforced benchmark gate.

## Results and candidate budgets

Use the same device, build mode, workload, quality, capture method, and cache
state for before/after comparisons; explain every intentional difference.
Report units and variability. A blank or N/A metric is not zero.

| Metric and definition | Baseline / artifact | After / artifact | Candidate limit / tolerance | Approval / gate status |
| --- | --- | --- | --- | --- |
| Frame time: median, p95, p99, worst and hitch count | Not measured | Not measured | Not supplied | Not enforced |
| CPU game/main, render, physics, script, and waits as relevant | Not measured | Not measured | Not supplied | Not enforced |
| GPU frame and measured pass costs | Not measured | Not measured | Not supplied | Not enforced |
| Allocated bytes/rate, GC pause distribution and frequency | Not measured; specify applicable runtime | Not measured | Not supplied | Not enforced |
| Resident/working set, managed heap, graphics and peak memory | Not measured; specify counters | Not measured | Not supplied | Not enforced |
| Memory after repeated load/unload or gameplay loops | Not measured | Not measured | Not supplied | Not enforced |
| Cold loading: launch to playable and named intermediate stages | Not measured | Not measured | Not supplied | Not enforced |
| Warm loading / scene transition / streaming stalls | Not measured | Not measured | Not supplied | Not enforced |
| Package: compressed download, built artifact, installed size | Not measured; identify each artifact/platform | Not measured | Not supplied | Not enforced |

Only compute `frame_budget_ms = 1000 / target_fps` from an approved FPS target;
FPS target / approval: Not supplied — not enforced. Do not sum overlapping CPU
and GPU stage times. GDScript lifetime behavior is not managed C# GC; record
nonapplicability and the relevant allocation/resource-retention measure instead.

## Interpretation, gate proof, and follow-up

- Measured bottleneck / evidence: Not established; static guesses are hypotheses.
- Correctness, visual, simulation, and interaction invariants: Not supplied.
- Compared runs / variation / whether an improvement is supported: Not established.
- Ratchet direction / baseline revision / tolerance rationale: Not agreed — not enforced.
- Gate ID / exact lifecycle verdict command / stage: Not discovered — not enforced.
- Deliberate violation and clean control evidence: Not run — not enforced.
- Boundary, producer-error, missing-report, and empty-sample failure evidence: Not run — not enforced.
- Synthetic gate fixtures, if used: Label separately; never count as runtime measurements.
- Limitations / inaccessible device or build / next capture owner: Not supplied.
- Exception rule and target scope / reason / approver / owner / expiry / follow-up:
  Not supplied; no exception is authorized by this template.
