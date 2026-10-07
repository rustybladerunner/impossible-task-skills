---
name: catch-it
description: Turn a bug that you just understood into a check that fails on the bug and passes after the fix. Use immediately after you reproduce a defect. Use when the same bug occurred more than once. Use when you are about to write a prose rule instead of a failing check. Use when a fix is about to ship and nothing proves that it stays fixed.
---

# Catch it

Lens edition of `fix-once`. `fix-once` is the full version.

A fix that ships without a check has a half-life. The only durable form of "do not do this again" is something that fails.

## Use

- You can make the bug occur on demand, and you are about to patch it.
- You started to add a sentence to a manual instead of a check.
- This bug has a sibling from last month.

## The move

1. Reproduce the bug first, mechanically. Use a script, a test, or a one-liner. If you cannot make it fail on command, you do not understand it. Then a change only disturbs the bug.
2. Write the check while the bug is still live. Run the check. It must fail, and the failure must name the actual problem. If the check passes against the broken code, it is the wrong check.
3. Apply the fix. See the same check go green.
4. Connect the check to the process that already runs on every change. A check that nobody runs is only a note.

## Do not

- Do not write the check against code that is already fixed and then call the check proven.
- Do not add a tolerance, an ignore, or a broader baseline. `red-gate` refuses that move. Return to `intercept`.
- Do not close a visual bug with this skill alone. If a person sees the failure, also use `match-the-reference` or a direct visual check of the running result.
