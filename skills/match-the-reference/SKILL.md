---
name: match-the-reference
description: Close a visual or behavioural task only when a fresh capture of the real thing matches its reference. Use before you declare a user-visible change done, and when a compile, a count, a bounds check, or a settings read-back is about to replace the result as evidence.
---

# Match the reference

Lens edition of `reference-match-loop`. `reference-match-loop` is the full version.

In `five-ways` terms, this lens is ABD. The thing that you draw out is the real scene. A proxy does not qualify.

## Use

- The change is about how something looks or behaves.
- The last few "fixes" were closed on green proxies.
- You cannot name the reference yet. Get a reference before you start. A reference can be concept art, a known-good build, a spec still, or the operator's own description.

## The move

1. State the goal as an observable. For example, do not write "the import succeeds." Write "The figure stands upright and the silhouette matches the reference."
2. Make one change.
3. Take a fresh capture of the real thing. A caption of a screenshot is not the capture. If you cannot see the pixels, say so. Do not declare a match from the caption.
4. Compare the capture to the reference. Progress signals can let you take the next step. Examples are a compile, counts, bounds, and a settings echo. Progress signals never mean done.
5. Prove that the comparison can fail. Give it a known-bad capture or a known-bad state one time. A validator that has never failed is theatre. `catch-it` uses the same order.

## Keep unfinished verification local

A missing capture leaves the reference acceptance unfinished. The missing capture alone does not stop authorized implementation, runtime repair, or independent research. Track each unmet acceptance item and its dependency separately. Continue useful work that does not depend on the missing capture. Do not claim completion. Do not make cosmetic changes only to avoid reporting a blocker.

Before you report a capture blocker again, check again whether you now have access to a capture tool. A source test, a build, a DOM snapshot, or a user-visible tab cannot replace a fresh image comparison. Also, a capture denial in the past cannot replace a check of the current access, because the access can change legitimately.

## Recorded shape

Four consecutive fixes shipped on green proxies while the characters lay face-down. The compile, the bounds, the canary, and a settings read-back were all clean. Nobody had looked at the screen.
