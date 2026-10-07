---
name: perf-pass
description: Do a performance pass. Measure first, find the actual bottleneck, fix the dominant cost, and measure again to confirm. Use for "it's laggy / slow / pegging the GPU/CPU", "optimize X", and complaints about frame rate or load time.
---

Fix performance with evidence. Do not guess. Always measure before and after the change.

## Steps

1. **Reproduce and measure** the real metric. The metric can be FPS, load time, GPU or CPU percentage, request latency, or memory.
   - For WebGL, use the app's own performance HUD, in-scene timers, or the browser `performance` API.
   - For a server, time the endpoint.
   - For a GPU, use the GPU vendor's own utilization tool.
   - For a UI, use a real browser.
2. **Find the real hog.** Profile the system. Do not assume the cause. These culprits occurred frequently in the source projects:
   - continuous `requestAnimationFrame` loops that `visibilitychange` does not gate;
   - allocations in each frame;
   - a background poll that runs much more frequently than intended;
   - too many event-stream sockets for the limit of approximately 6 HTTP/1.1 connections per host;
   - a heavy 3D layer (in the source projects, this layer is off by default);
   - oversized textures or too many draw calls (look for several parallel asset pipelines).
3. **Fix the one dominant hog.** Make the smallest change that moves the metric. Make one change at a time.
4. **Measure again.** Prove that the number improved. Look for regressions in other metrics.

## Rules

- Do not write "should be faster". State the numbers before and after the change.
- Fix the dominant cost. Do not fix small costs that are in the noise.
- If the project targets mobile devices or a GPU with 8 GB of memory, these limits are hard constraints. Keep the tuned defaults.
