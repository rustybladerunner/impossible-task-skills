---
name: red-gate
description: Triage a red gate, CI job, or lint suite. Put each failure into one class (instrument defect, not yours, or real debt), then fix it at the source. Use when a gate has been red so long that people route around it, when a noisy rule hides real findings, or when you are about to add an ignore, a suppression, or a baseline to make a check pass.
---

# Red gate

Lens edition of `gate-triage`. `gate-triage` is the full version.

If a gate is never green, it does not operate as a gate. The cost is the real finding under the noise, which nobody reads.

## Use

- CI or a local gate has been red across many runs.
- You are about to add an ignore so that a different change can ship.
- One noisy rule causes people to treat the suite as advisory.

## The move

1. Measure the streak before you read the newest failure. Find how long the gate has been red. Find the order in which the failures arrived. A gate that is red for three runs and a gate that is red for thirty runs are different problems.
2. Run each failing check alone and read its output. Aggregate runners truncate output, share exit codes, and assign failures to the wrong check. A piped command reports the exit code of the last command in the pipe.
3. Put each finding in exactly one class:
   - **Instrument defect.** The check is wrong, its scope is wrong, or it matches a comment or a string. Fix the check. Do not tolerate the defect.
   - **Not yours.** The finding is in a dependency, a generated file, or a clone that this repo does not own. Apply `whose-move`. Do not pin or classify files that you do not commit.
   - **Real debt.** The repo can close the finding. This is the work, also when it is smaller than the noise.
4. If the instrument defects hide the debt, fix the instrument first. Then fix the debt. Do not use a suppression as the repair.

## Recorded shape

A gate stayed red for 27 runs. Two of four failures came from checks that examined a third-party clone that the repo does not commit. Under that noise were two real failures that nobody had read. "The gate is red" had become the normal state.
