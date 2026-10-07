---
name: gate-triage
description: Triage a red gate, CI, or lint suite. Put every failure into one class: instrument defect, not-ours, or real debt. Then fix each failure at the source and do not add a tolerance. Use for "the gate is red" and "CI has been failing for a while". Use for a check suite that fails chronically. Use when a noisy rule hides real findings. Use when you are about to add an ignore, a suppression, or a baseline to make a check pass. Use before you route around a red gate to ship something else.
---

A gate that is never green does not operate as a gate. If "all checks pass" is never true,
every agent and every human learns to route around the gate. Then all of the back-pressure
stack below the gate silently becomes advisory. **The cost is the real findings that become
invisible below the noisy findings.**

This effect is measurable. On 2026-08-17, a gate was red for **27 consecutive runs across
two days**. Failures accumulated during that time: one check, then a second, then two more.
Two of the four failures were defects in the instruments. Two checks did not obey
`.gitignore`. They judged a third-party clone that the repo does not commit. They required
that clone to join a version registry and a security classification registry. **Nobody
could close either requirement.** You cannot pin a version in a package that you do not
own. A classification of an upstream file is a note that the next `git pull` erases. Below
that noise were two real failures. One was two queue items with no done-condition. The
other was a real design-law violation, committed two days earlier. Nobody had read them,
because "the gate is red" had become the normal state.

## 1. Measure the streak before you look at any finding

Do not start with the newest failure. First, find **how long the gate was red and the
order in which the failures arrived**. Use a gate-history log, the CI run history, or
`git log` on the check config. The order shows which failure is the original and which
failures came after it. It also shows if the break is fresh or abandoned. A gate red for 3
runs and a gate red for 30 runs are different problems with different causes.

## 2. Reproduce every check individually

Do not trust the aggregate result. Run each failing check alone and read its actual output.
Aggregate runners truncate output, share exit codes, and attribute failures to the wrong
check. Know these two traps:

- A piped invocation reports the exit code of the **pipe**. Thus a failed check can look
  like a pass.
- A filter that matches your own tooling can create a finding that does not exist outside
  the run.

## 3. Put each finding into exactly one of three classes

- **Instrument defect.** The check is wrong, its scope is wrong, or its heuristic is too
  loose. Signs of this class:
  - No action that the repo can take can close the finding.
  - The check matches inside a **string literal or comment**, and not in real code. On
    2026-08-17, a design linter flagged a test whose only offending token was inside
    `assertNotIn("…")`. That test *enforced the same rule that the linter enforces*.
  - The check contradicts another gate.
  - The finding names a path that nobody in the repo owns.
- **Not ours.** Vendored clones, gitignored trees, generated artifacts, upstream packages,
  and dependency directories. The fix is **scope**, at the source. Teach the check what the
  repo owns. Ask the VCS itself (`git ls-files --others --ignored --exclude-standard
  --directory`). Prefer that to a new implementation of ignore semantics.
- **Real debt.** The check is correct and the code is wrong.

Classify **before** you fix anything. Frequently, two findings from the same check are in
different classes. The 2026-08-17 case had one of each: one real violation and one false
positive.

## 4. Fix at the source, and never add a tolerance to make a gate green

These are the options, in order of value, highest first:

1. **Remove the class.** Correct the scan root, the data structure, or the architecture, so
   that the finding cannot occur again.
2. **Encode the fix as a check or test**, so that a regression fails loudly.
3. **Add a tolerance, allowlist, or suppression entry.** This is the *last* option. Never
   use it only to make a suite green.

Sometimes you are about to add an entry only so that the suite passes. Examples are an
exception entry, a `# noqa`, an allowlist row, or an escape-hatch tag. If so, **stop.** That entry teaches the
gate to be wrong quietly. It is only correct when the tolerance is itself the truth, such
as a deliberate divergence. In that case, the entry must carry a reason. It must also show
as a warning on every run, so that it cannot change into accidental drift.

**A gate must go green because it is correct. Do not relax a gate to make it green.**
Look for a fix that silences two findings at once. If you loosen a heuristic to clear a
false positive, you will also clear the true positive next to it. Always put those two
changes in separate commits.

## 5. Prove the fix in both directions

A check that you just narrowed must still **fire on known-bad input**. Run its self-test.
If it has no self-test, supply bad input by hand and see it fail before you believe it. On
2026-08-17, the self-test of the check still proved "unregistered consumer fires." That
result showed that the ignore filter had not blinded the real check.

Also make new scope logic **fail closed**. The logic can depend on something that is not
available, such as a missing git or an unreadable config. In that condition, the logic
must skip *nothing* and report the problem loudly. It must not silently filter everything
and report a green suite that measured less than it claimed.

## 6. Make real debt that needs judgement a tracked item with the evidence

Do not leave it as a comment or a silent TODO. Do not invent a fix that you cannot verify.
Write an item that contains these data:

- the exact output of the check
- the class, and **why** you chose it
- what you already read and ruled out
- what would close it

Then the next session can act and does not need to repeat your triage. Sometimes the
judgement belongs to the operator, for example a design ruling, a live tool session, or a
publish decision. In that case, say so explicitly and mark the item as the operator's.

## 7. Report honestly

State the change in count (`4 failures → 1`). Name each failure that remains and say why it
is still correctly open. **Never claim green that you did not verify.** If the suite still
fails, say so plainly. Do this also when the remaining failure is older than your work.
A chronic red reduced to one real, documented finding is a good result. Do not describe it
as a clean pass.

## Anti-patterns

- You read only the aggregate summary and "fix" the last line.
- You add a suppression and then report the gate as fixed.
- You delete or disable a check that never fired. A quiet check can prevent the defect by
  deterrence, or it can measure nothing. The pass/fail record alone **cannot** tell you
  which. Before you conclude that the check is dead, find out if it has a self-test that
  proves it *can* fire.
- You treat a chronically red suite as normal. This skill exists to stop that failure.
