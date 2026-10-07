---
name: five-ways
description: Choose an approach deliberately before you attack a stuck problem. Use the Five Ways of Attack as the taxonomy (SAA/HIA/PIA/ABC/ABD). Use when a fix failed two times and the third attempt is another variant of the same edit. Use when attempts are started, dropped, and teach you nothing. Use when hours go into an obstacle that nobody here can clear, such as a licence, an operator decision, or busy hardware. That obstacle needed the label "blocked" at the start. Use when the task as written rests on a premise that the code contradicts. Use when two plausible attacks exist and nothing decides between them.
---

Adapted from Bruce Lee's Five Ways of Attack.

A default approach exists, whether you choose it or not: edit the code, run it, and look.
That default is *one* of five approaches. For a problem that already survived the default,
it is usually the worst approach. This skill makes you choose the approach explicitly.

In the source, tactics depend on **observation and analysis of the opponent** before the
choice of action. Observe first. The taxonomy is only a menu of choices. Suspect the
instrument before you suspect the code.

## Step 0: Decide if the obstacle is yours to move

The taxonomy assumes that you can already reach the problem. **The taxonomy can help you
choose an excellent attack on a problem that was never yours.** That is how effort goes
into an operator-gated decision, a lane that another session holds, or a GPU that is not
free.

First, name which one of these the obstacle is:

- **Yours.** Code, data, or a measurement that you can take. Continue to step 1.
- **Not yours.** An operator decision, a licence, the uncommitted tree of another person, a
  missing credential, or busy hardware. **Name it in `blocked_by` and stop.** A conclusion
  that a work item is blocked is a valid and valuable outcome. Do not invent work to avoid
  that conclusion.
- **Not yours yet.** The obstacle becomes yours after something clears. Name that
  something, so that the reason for the wait is clear.

On 2026-08-03, three work items stopped correctly at this step, and all three were
wins. The first was a licence gate that no effort could move (AMASS forbids commercial
training). The second was 2921 MiB of free VRAM for a job that needs more. The third was a
blind test that only a human can run.

**If the obstacle is a false premise, the correction replaces the work. The work item does
not fail.** Ten work items in sequence proved that a backlog entry is a claim about the
past. The findings included these:

- an ANSI sanitizer that no code called
- a terrain layer that did not draw at all
- a vehicle that rendered inside a tower
- canon that claimed five meshes that were already purged

Each finding was more important than the task as written.

## Step 1: Observe before you choose

This step is mandatory. Write one line for each of these:

- what you **actually measured** (do not include assumptions)
- what you **already tried**
- what the failure **looks like from the outside**

If you cannot name a measurement, your first move is to get one. If a metric is constant
or absent, the instrument is broken. Do not conclude that the bug is subtle.

## Step 2: Name the way, then commit to it

| Code | Source technique | Engineering form | Use it when |
|---|---|---|---|
| **SAA** | Single Angular Attack: one strike from an unexpected angle, with footwork that sets the distance | Change the **input**. Do not change the code. Use different data, resolution, seed, file, or order. | The code looks correct and continues to be wrong |
| **HIA** | Hand Immobilizing Attack: immobilize while you close the distance | **Freeze the moving parts first.** Pin versions, snapshot state, isolate to a fresh instance, and remove concurrency. | Many things move at the same time and the results do not reproduce |
| **PIA** | Progressive Indirect Attack: move out of line, and the boundaries close as a result | **Measure small, extrapolate, then commit.** Use one cheap probe that limits the answer before you pay the full cost. | The full attempt is expensive or slow |
| **ABC** | Attack By Combination | Use a **deterministic chain**. The output of each step goes into the next step. You fix the orchestration in advance. | The work has many stages and you understand each stage |
| **ABD** | Attack By Drawing: cause the attack so that it becomes visible | **Make it fail on purpose.** Supply known-bad input, force the error path, and break it deliberately to see the shape of the failure. | You do not trust the check, or the failure is intermittent |

**ABD is the discipline behind a test of a gate with known-bad input.** If you built the
thing that you test, ABD is mandatory.

## Step 3: State the choice and the falsifier

Write one line:

*"Approach: <WAY>. I expect <specific observable>. If instead I see <X>, this approach is
wrong and I switch to <other way>."*

Then execute the approach fully. Do not switch before the falsifier occurs. A switch
without a falsifier is thrashing, and this skill exists to stop thrashing.

## Rules

- **Use one way at a time.** If you combine approaches, you cannot interpret the result.
- **After two failed direct attempts, stop and run this skill.** That is the trigger. Do
  not try a third variant of the same fix. A recurring bug shows that nobody found the
  cause.
- Do not apply the taxonomy too strictly. The editor of the source book notes that its
  divisions have no real lines between them, except the lines that you draw. If a problem
  needs a sixth way, use it and say so.
- This skill produces a decision. It does not produce a document. Do not write a file
  unless the decision itself needs a note.
