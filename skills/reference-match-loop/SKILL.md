---
name: reference-match-loop
description: Close a visual or behavioural task only when a fresh capture of the real thing matches its reference. Never close it because a proxy metric is green. Prove each validator by making it fail on a known-bad case first. Use before you declare any user-visible change done, fixed, or working, and when you want to close a task because a compile, a count, a bounds check, or a settings read-back was clean.
---

# Done means it matches, looped until it does

This skill exists because of one specific, repeatable failure. Four consecutive "fixes"
shipped on green proxy metrics. The compile was clean, the bounds were in range, the canary
passed, and the import settings were echoed back correctly. During all four fixes, the
characters lay face-down in the dirt. Every proxy was green. Nobody had looked at the actual
screen. The operator had to describe the problem back four times.

## The law

**Exactly one thing closes a task about how something looks or behaves: a fresh capture
of that thing, compared against its reference, that matches.**

All other signals are *progress* signals. Examples are compile-green, counts, bounds,
"8 of 8 imported", and a settings read-back. A progress signal can permit you to
**proceed**. A progress signal can never permit you to declare a task **done**.

## The loop

1. **State the goal as an observable** before you change anything. For example, do not
   write "the import succeeds". Write "the figure stands upright mid-animation and its
   silhouette matches the reference". If you cannot name the reference, get one before
   you start. A reference can be concept art, a known-good build, a spec screenshot, or
   the operator's own description.
2. **Make the change.**
3. **Capture the actual thing.** Do not capture a proxy for it or the input to it. For
   animation, capture a frame during the motion. Do not capture the rest pose, because a
   broken rig looks correct in the rest pose.
4. **Open the capture and the reference together, and read the pixels.** Describe what
   is literally in the frame *before* you interpret it. In one case, an agent reported a
   face-planted figure as "slightly too big". The agent read the image from its
   expectation and did not look at it.
5. **If the capture does not match, fix the problem and go back to step 3.**

The loop stops on a match. The loop also stops on a blocker that only a human can clear.
State such a blocker as a blocker. Do not present it as done. The loop never stops on
"the numbers look right now".

Proxies do not count toward an iteration budget. If you write "this should now be
correct" and you have no capture taken *after* your last change, you are still in the
loop. You are not finished.

## A validator's green means nothing until it has gone red

Before you trust any automated check (a canary, lint, probe, gate, or visual diff),
**run it against a known-bad case and watch it fail.** A validator that has never
fired is theatre.

In the story above, the canary passed four broken imports. It measured bounds and the
rest pose, but the broken part was the skinning. By its design, the canary could not see
the failure. People still read its green as evidence.

If no known-bad case exists, **make one**. Break a copy deliberately, run the check, and
confirm that it fails. Then trust the green.

## Blind spots to know before you trust a check

- **A textured beauty render hides bad geometry.** First approve the form on neutral,
  untextured renders from several matched camera angles. One good front view cannot
  prove depth, back form, layer separation, or topology.
- **A regression baseline is not a correctness reference.** A baseline answers
  "did this get worse?" A baseline cannot answer "was this ever right?". A baseline
  captured from a broken state will approve that same broken state forever. Compare
  against the *reference* first. A capture may become a baseline only after it passes
  that comparison.
- **Aggregate measures do not validate the thing that they summarise.** Correct bounds
  and a correct skeleton can exist together with a mesh that animates into the floor.
- **A clean import log does not prove that the materials landed.** A re-import
  frequently refuses to create the materials again.
- **A settings matrix run on a test copy can be contaminated.** Probe the real asset,
  match a known-good result, and then change one setting at a time.

## Make the loop mechanical if you can

Loops that depend on discipline alone decay. If your tooling supports it, record each
user-visible change that a session makes. Then prevent the session from ending until it
records a validation pass that is *newer than the last such change*. Key this record to
the session, so that the dirty files of a different writer never trigger your gate.

Two honest exits are as important as the gate:

1. A written waiver that states why validation is impossible in this case.
2. A loud stop after N attempts.

Both exits report the work as **not validated**. A quiet path must never exist that marks
work as validated because someone recorded the baseline again to make the gate green.
Promotion of a bad capture to silence the check is the original failure that this whole
system exists to prevent.

## Reporting

A completion report for visual or behavioural work states three things: the capture, the
reference that you compared it against, and the verdict. If there is no capture, the status
line is **"not validated"**. Never write "done", "fixed", or "working" in that case. If a
validator was involved, say when it last failed on known-bad input.
