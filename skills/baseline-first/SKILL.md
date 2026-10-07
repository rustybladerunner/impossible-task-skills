---
name: baseline-first
description: Before you change a system, record the data that its existing instrumentation already reports as a committed, diffable baseline. Then use those numbers to put the plan in a new order. Use when you inherit a suite that nobody has run and you are about to remove what it covers. Use when a sweep before any change fails in several places and the common cause of those failures is the real blocker. Use when a reading is too extreme to be a measurement, so the gauge needs the fix. Use when a multi-mode harness ran all modes at once or the inputs drifted, so no result is comparable. Use when the before-numbers exist only in scrollback.
---

You are about to change a system. **First**, record what the system already reports.
Put that record in the repo as an artifact. Then the change has proof, and you do not
need to assert it. A baseline costs little. Frequently, it shows that you were about to
start in the wrong place.

The case that this skill generalizes was recorded on 2026-08-17. The task was to design a
weapon-inspect system for a third-party build. Before the design, we swept the six-mode
hands test that the build already shipped. Two of six modes failed, and **both failures
were on the left hand**. In an FPS, inspect is the feature that uses the left hand most.
The baseline moved inspect from "the task" to "the third task". A broken metric and an
unsolved IK target moved ahead of it. No other result in the session changed the plan
that much.

## 1. Find the instrumentation before you build new instrumentation

Usually, the people who found a system difficult already instrumented it. Look for that
instrumentation before you write a harness:

- test suites, spec suites, lint gates, and `*.test.*` siblings
- files that the app writes about itself (`Saved/`, `%LOCALAPPDATA%\<App>\`, logs, `*_Result.txt`)
- for a packaged binary with no source, a request/response protocol that you find with a
  text search of the binary

The author instrumented the parts that were difficult for them. Usually, those parts are
also difficult for you. A text search of this kind once found a ten-pair, file-driven
harness inside a *Shipping* build.

## 2. Run all of the suite and control the variables

- **Sweep the whole suite. Do not sample it.** You cannot compare against a partial
  baseline later, so it is wasted work. Partial coverage also hides the pattern across
  failures.
- **Hold the inputs constant.** All six runs used the same weapon, so the numbers were
  comparable. A baseline taken across drifting conditions proves nothing.
- **Look for modes that exclude each other.** In the recorded case, the harness received
  every request at once. It ran only one of them and silently produced one result. Drive
  one config per run. Confirm which inputs the harness consumed.
- **Record the auxiliary state with each result.** A bare `PASS/FAIL` line loses its
  context. In the recorded case, a snapshot of the per-run state next to each result later
  proved a per-weapon mesh swap. No result line mentioned that swap.

## 3. Make the runner portable, then commit it with the results

The runner is part of the deliverable. Avoid these two real failure modes:

- **Absolute paths from your own session.** A sweep script with a scratchpad path in it
  runs on only one machine. Derive paths from the location of the script (`$PSScriptRoot`,
  `__dirname`, `Path(__file__).parent`). If the target is missing, stop with a clear error
  message. Example: `<project>/tools/sweep.ps1`.
- **A runner that overwrites its own baseline.** If the runner writes results next to the
  script, a second run destroys the before-state. Write each run to a timestamped or
  labelled directory. As an alternative, state in the baseline doc that a person must copy
  the folder to a different location first.

Commit the runner and the raw results together. A baseline that exists only in scrollback
is not a baseline. See `/scoped-commit`.

## 4. Classify the failures by kind, and expect a broken gauge

Before you act, put each failure into one class: **real defect**, **instrument defect**,
or **not-ours**. `/gate-triage` gives the full procedure. This section gives the part that
applies to inherited instrumentation.

**If a metric has an absurd magnitude, the accumulator is broken. Do not treat the value
as a system defect.**
In the recorded case, a test reported `MinLCm = -6.8e31` against a `>= 2.55` threshold.
That value did not measure anything. The code seeded a running minimum with a large
*negative* sentinel and folded it with `Min()`. Thus the minimum could never move away
from the sentinel. A sibling test reported the same field as `-1.55e38`, which is almost
`-FLT_MAX`. That result confirmed the cause. **That test can never pass, whatever the
system does.** It is a red light that is connected to nothing. Fix the gauge before you
tune the system against it.

Do not discard all of the result from a broken test. Keep the real signal. The same test
also reported `Verts=72  InsideWoodL<2.41=61`. That was a real finding, and the broken
metric could not quantify it.

## 5. Read the pattern across failures

This step gives the most value. Do not stop at a verdict for each test. Find what the
failures have in common, because that changes the order of the work:

- Both failures were in the same subsystem (the left hand). That subsystem was the real
  blocker.
- One passing test was important (`T6`, right hand, inspect, 0.00 cm). It showed that half
  of the target feature was already solved.
- Only one test used the *shared* asset, and that test failed. This explained why the
  per-instance workaround was still in place.

A table of results for each test is a status report. The pattern across the failures is
the plan.

## 6. Write the baseline as numbers, and name the number to watch

At the end, give the specific figures for the next run to compare against. Do not write
"two failing". Name the two tests, their values, and their thresholds. Name the one number
that shows progress. In the recorded case, that number was `T7 LeftErrCm`, 21.57 against a
ceiling of 8.00. That number gives a vague refactor a done-condition.

## Anti-patterns

- You change the system first and record the baseline after the change. Then no
  before-state exists.
- You sample the suite. The pattern across failures gives all of the value.
- You take the baseline across drifting inputs, so no result is comparable.
- You trust a threshold and do not check the magnitude of the metric.
- You treat every red result as debt. An inherited suite reliably contains at least one
  gauge that cannot fail honestly.
- You ship a runner that contains your own absolute paths.
- You leave the baseline in chat. Commit it next to the runner.
