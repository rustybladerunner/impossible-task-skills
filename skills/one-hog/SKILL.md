---
name: one-hog
description: Measure a performance complaint, fix the single dominant cost, and measure again. Use when something is laggy, slow, or pegging the CPU or GPU, and when an optimization is about to start from a guess.
---

# One hog

Lens edition of `perf-pass`. `perf-pass` is the full version.

In `five-ways` terms, this lens is PIA. The measurement is the cheap probe. The full attempt is one change to the dominant cost.

## Use

- Someone reported "it's slow" without a number.
- You already know which subsystem you want to rewrite.
- The suspect is a frame loop, a poll, or a socket count, and nobody has timed it.

## The move

1. Reproduce the problem. Measure the metric that matches the complaint: frame time, load time, CPU or GPU, request latency, or memory. Use the app's own timer, the browser performance timeline, or the server's own log. Say which source you used.
2. Profile until one cost is dominant. These culprits are usual:
   - a render loop that continues to run when the tab is hidden;
   - allocation in each frame;
   - a poll that runs much more frequently than its period;
   - too many streams on one origin;
   - an oversized texture.
3. Change that one cost. Make the smallest edit that can move the number.
4. Measure the same metric again. Report the values before and after. Examine the neighbor metric that your change can make worse.

## Do not

- Do not stack several optimizations and then measure once.
- Do not say "should be faster."
- Do not spend the budget of the probe on a rewrite. If the probe did not bound the cost, the approach was wrong. Return to `intercept`.
