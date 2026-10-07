---
name: read-the-gauge
description: Record what a system already reports as a committed baseline before you change the system. Use when you inherit a suite that nobody has run. Use when a sweep fails in several places and the common cause is the real blocker. Use when a reading is too extreme to be a measurement. Use when the before-numbers exist only in scrollback.
---

# Read the gauge

Lens edition of `baseline-first`. `baseline-first` is the full version.

This skill supplies the observation that `intercept` step 1 requires when the plan is
about to harden around a guess.

## Use

- You are about to remove a harness that you have not run.
- A sweep showed several failures, and you are about to fix the first one that you saw.
- A number is absurd. Fix the gauge before you treat the number as the bug.
- The only record of the before-state is a terminal that you are about to clear.

## The move

1. Find the instrumentation that already exists: tests, lints, logs, and files that the app writes about itself. The author instrumented the parts that were difficult for them.
2. Sweep the whole suite. Hold the inputs constant so that the numbers are comparable. A sample hides the pattern across failures.
3. Put the result in the repo as a diffable artifact. Scrollback is not a baseline.
4. Use the numbers to put the plan in a new order. If two failures have the same cause, move that cause ahead of the feature that you came to build.
5. If the reading cannot be a real measurement, the instrument is the work. Do not design around a broken gauge.

## Recorded case

A hands test on a third-party build failed two of six modes. Both failures were on the left hand. The sweep ran before anyone designed the feature that used that hand most. The baseline moved that feature behind the broken metric.

## Hand off

SAA and PIA both start here. After you read the gauge, return to `intercept` and name the way. Do not start the feature in the same step as the baseline.
