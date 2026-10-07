---
name: one-press
description: Do one press that moves a project forward from its current state. Orient from cheap probes, refuse to act blind, resolve the goal, select one movable item, route it deterministically to the skill that owns it, verify by artifact instead of exit code, and record a verdict that the next press can read. Use for "continue", "keep going", "what's next", "advance the project", or as the single repeatable step of an unattended improvement loop.
---

A press is one unit of work that is selected and finished.
A sweep, a plan or a status report is not a press.

This design answers one failure: **a loop that reports success but produces nothing.**
This failure occurred in practice. A nightly automated improvement job ran for sixteen days.
During that time it reported *ready, last run today*.
Every iteration exited non-zero and produced nothing.
The cause was in the queue for a fortnight, and nothing surfaced it.
Each rule below exists to prevent the loop from reaching that state silently.

**A press that fires has not necessarily done work. A press is green only if it produced a durable artifact.**

## The nine steps

Do the steps in order.
Steps 1–2 are deterministic and must cost no model tokens.
A press that finds nothing to do must be almost free. If it is not, nobody can press often.

### 1. ORIENT: build the state card

Use cheap probes only, with a hard time limit. A good default limit is 30s.
Produce a short card of ≤30 lines. Generate the card again on every press.
The card shows these items:

- version control: the branch, ahead/behind counts, dirty paths and the last few commits
- the checks of the project: do they pass now, and did they pass before this press
- the queue: the number of items that are actionable, blocked and in progress
- liveness: are the services that this project needs actually up
- **freshness: the age of the newest durable artifact that this project produced**
- **delta: what changed since the last press.** This is the most useful line on the card.

Derive the card fresh each time. A state file that you update incrementally drifts, and nothing tells you when it drifted.

If a probe times out, mark it `unknown` and continue.
**Never read `unknown` as OK.**
A router must not use an unknown field.
A step that depends on an unknown field is not eligible for this press.

### 2. GATE: refuse to act blind

Stop the press, and give a reason, when one of these conditions is true:

- **The paths that this press would touch** are dirty, and this press did not make them dirty.
  Another worker possibly is in the middle of an edit. Their uncommitted delta is not yours to sweep.
  - **Scope this check to the touched paths. Never scope it to the whole tree.**
  - A whole-tree check seems safer. In practice, it decides whether the loop runs at all.
  - A healthy shared tree carries a large, permanent population of untracked files. Examples are build output, renders, scratch files and gitignored trees.
  - In one real tree, that population was **1,590 paths, and 1,548 of them were untracked**.
  - A press gated on that population refuses every time. It records honest refusals and reports zero artifacts. Then the metric below retires it, and it never executed once.
  - Untracked files are not evidence of another worker. Uncommitted modifications to *your* target paths are evidence of another worker.
- Another worker holds a lease on the files that you would touch.
- A previous press stopped mid-flight, and nobody resolved its state.
- The checks of the project were already failing. Record the pre-existing failure. Do not adopt it. Do not report green afterwards.
- The stop file exists (see **Stopping**).

A refusal is a legitimate result of a press. Record it like every other result.
Refusing well is the most underrated thing that this loop does.

### 3. GOAL: resolve what forward means

Take the goal from a declared source.
Use a fixed precedence order that the project can state.
Possible sources are a north-star document, an in-progress specification, the top queue item or a README.

**Never infer a goal from the code.**
An inferred goal that is slightly wrong steers every later press, and nothing in the loop will see it.

If no goal is declared, the work for this press is *"declare a goal"*. Then stop. That is a complete press.

Resolve the **non-goals** also. Non-goals stop drift, and they are the half that nobody writes down.

### 4. CANDIDATE: list what is actually movable

Do not list everything that someone could do. List everything that *can be finished now*:

- a queue item that is ready, unblocked, and has a stated blast radius
- a failing check with a known cause
- work that is finished but not promoted to a place where people can see it
- a stale artifact that you can regenerate mechanically
- an unanswered question that blocks someone else

Rank the candidates in this order:

1. goal alignment
2. blast radius (the smaller one wins)
3. cost

**A failing check always ranks above feature progress.**
A red check means that the instruments are wrong, and you cannot verify any measurement made after it.

### 5. ROUTE: use a table, not a judgment call

Map the *class* of the candidate to exactly one skill.
Use a static table that the project owns.
The route must be deterministic. The same state card must produce the same route.

**Start the table EMPTY. Add rows only for classes that you actually saw.**
If you write the table in advance, you write it against zero observed candidates.
Then the first real candidate falls through to the generic path, and the press produces a plan instead of an artifact.
Run the loop by hand until the same class occurs three times. That class is your first row.

**Two items must be checks, not intentions.** If they are only intentions, the table decays the same way as every unenforced rule:

- **A route must not point at a skill that nobody has ever invoked.** Make the build fail on it.
  Routes to cold skills only look busy. One real census of 1,520 transcripts found 15 of 44 skills that were never used.
- **Commit and assert card-in, route-out fixtures.** A "deterministic" router that nothing tests is only a claim.
  The same card must give the same route in CI, on every change to the table.

These rules keep the table honest:

- **One class, one skill.** Two candidate skills for one class is a decision, and decisions belong in the table.
- **Routes carry preconditions.** Examples are "service up", "checks green" and "tree clean". The preconditions must be machine-checkable. Check them before dispatch, not after.
- **Routes carry a cost tier.** Deterministic work may run freely. Work that spends model tokens or a GPU must be condition-gated (see **Pacing**).
- **Routes carry a failed-methods list.** If an approach already failed repeatedly on this class, the route must say so and select a different approach. A repeated failed method is the most expensive way to look busy.
- **Never route automatically to an action that a human decision gates.** Examples are installing software, publishing, deleting, spending money, and any action on the account of another person.
- **When no row matches, log the unrouted class.** That log is the roadmap for the next skill worth writing. No other place holds that information.

The model may **refuse** a route and record the reason. The model must not silently substitute a different route.

### 6. EXECUTE: run the routed skill on its own terms

Hand off to the skill, and let the skill own the work.
The job of the press was to select. The press does not second-guess the specialist during the task.

If the work writes files, and something else possibly writes too, run the work in an isolated copy of the tree.
Merge the copy on success.

### 7. VERIFY: assert the artifact, never the exit code

An exit code tells you that a process ended. It does not tell you that anything changed.

- Run the checks of the project again. Compare the result with the pre-press state from step 1.
- Confirm that the **specific artifact** that the press had to produce actually exists and is new.
- If a person looks at the result, look at it yourself. Use a rendered capture, not a clean compile.
- Verify findings and claims adversarially before you report them. All types of reviewer produce confident findings that are wrong at a significant rate.
- **Never close an item that you could not verify.** "Moved, not done" is an honest and common result.

### 8. RECORD: write the verdict where the next press will read it

Write one durable record for each press, always. This includes a refusal and a no-op. The record contains:

- the state card, in one line
- what the press selected and why, and what it did *not* select
- what the press produced, with a path or an identifier
- what the press verified, and what it could not verify
- **what the press cost.** Record the cost even if there is no budget limit.
  A ruling to spend freely is not a ruling to spend blindly.
  Without a cost column, nobody can answer the question "did this beat doing it by hand".
  Then nobody can stop the loop on evidence, only on mood.
- **each item that the press could not route**, and each item that it marked blocked
- what the next press should look at

Silence is how a dead loop hides. A press that writes nothing looks the same as a press that never ran.

### 9. PACE: decide whether another press is necessary

Do not chain presses by reflex.
Press again when a condition shows that there is work to do.
Back off when the last presses produced nothing.

## Pacing, and the trap it prevents

**A press that spends model tokens must be condition-gated. It must never be clock-driven.**
A clock-driven token loop gives a job that fires forever, reports success and does nothing.
Because the scheduler shows green, nobody looks.
The cheap deterministic part (steps 1–2) may run on a clock. That part decides whether the expensive part runs.

Two commitments make this real:

- **A freshness bound, as a NUMBER and as a registered check.** "We will watch it" is not sufficient.
  - Select the number of hours. 24 is a reasonable default for a loop that presses several times a day.
  - Register the job with the artifact path and that bound.
  - Give the job a `--check` subcommand. When the newest artifact is older than the bound, the subcommand exits non-zero and says why.
  - Prose has no value here. The job that caused this rule was registered, scheduled and green, **and had no check**. That is why its 391-hour-old artifact went unnoticed.
  - If your scheduler cannot express this check, fix the scheduler before the loop runs unattended. Do not fix it after.
- **Escalate visibly on repeated failure.** Never retry silently.
  If the press selects the same candidate for several presses in sequence with no artifact, stop routing it. Mark it blocked and surface it.

To detect spinning, read the last several press records. A loop that cannot see its own history will repeat it.

**Something must read everything that the loop writes.**
The unrouted-class log and the blocked list are queues.
If nobody drains a queue, the queue grows while the no-op rate still looks healthy.
Put both queues in the delta line of the state card and in the freshness check.
Then people can see a rising unread count without a search.

## Stopping

The stop control is a **file**. Do not use a flag or a signal.
A file works when the process is wedged. A file survives a restart.
A person who cannot reach the running process can still create a file.
While the file exists, nothing presses. The file is a stop *and* a lock.

**The stop file must stop the press that is running, not only the next press.**

- Check for the file between steps, and again before each dispatch.
- Kill the **process tree**. Agent runners are frequently a thin shim with child processes that outlive it. A plain kill leaves the actual work running while the console says that it stopped.
- Test this one time. Create the stop file during a press, and assert that the process tree is gone. A stop control that was only tested against an idle loop is untested.

## What a press must never do

- Act on modified target paths that it did not create. (This does not mean to refuse because the tree has untracked files somewhere. See step 2.)
- Continue after a failed verification.
- Close an item that it could not verify.
- Do an action that a human decision gates.
- Edit its own instructions. Self-modifying prompts cannot be audited. Propose the change instead.
- Report a green result over a check that was already red.

## Measure whether the loop is worth running

The main number is **durable artifacts per press**, and its trend.

Presses per day is the metric of a zombie loop. That metric increases when the loop does nothing. A loop that does nothing faster gets a higher number.

Also track these numbers:

- operator interventions per press. The goal is a decrease.
- the rate of no-ops. A healthy loop does a no-op frequently. A *useless* loop does a no-op every time.

Stop the loop if it does not do better than the same work done by hand within a stated trial period.
That is a real possible result. The willingness to accept that result keeps the loop honest.

## Anti-patterns

- You sweep every lane in one press. Then nothing finishes, and you cannot attribute anything.
- You infer the goal from the code.
- You route by model judgment and call it deterministic.
- You chain presses on success until something breaks.
- A no-op writes no record.
- You measure the loop by how often it ran.
- You build the press before the work that it routes to exists.
  A router that points at skills that nobody has ever used routes into cold storage.
  If you write the route table before you observe any candidate, the result is the same.
  The first real candidate falls through to the generic path, and nine steps produce a plan instead of an artifact.
  Run the loop by hand first. Let the classes that you actually see write the table.
- A safety check has a scope so wide that it never passes.
  From the outside, a gate that refuses every time looks the same as a loop that works carefully.
  People will defend it as caution until someone counts the artifacts.
