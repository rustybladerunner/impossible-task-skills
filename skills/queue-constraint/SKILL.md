---
name: queue-constraint
description: Find which stage of a work pipeline is the actual bottleneck (discovery, promotion, or execution). Measure all three stages before you build anything. Use when a runner is idle on a fraction of its budget and that looks like thrift; when agents work ready items vaguely and call them done because no item states a verifiable finish; when the top item needs a human act that no agent may perform, so it stalls and is picked again each night; when a feeder emits duplicates, mid-sentence fragments, and titles that lost the decision; or before you add another scanner to a pile that nobody promotes from.
---

A queue-driven system has three stages. Each stage can fail independently of the other stages.

| stage | question | measured by |
|---|---|---|
| **discovery** | is work being found? | candidates found per run; how many sources feed it |
| **promotion** | is found work turned into *actionable* work? | items that are ready **and well-formed enough to execute** |
| **execution** | is actionable work being done? | concurrency actually used, spend vs ceiling, items completed |

**Everyone instruments the stage that they find most interesting. That stage is almost always discovery.**
Discovery gets new scanners, more auditors, and more fan-out. Promotion is plain work. In promotion, a person decides what a found item means and writes a verifiable done-condition. The jam usually forms in promotion. If you count only the top of the funnel, you cannot see the jam.

This skill generalizes a case that was recorded on 2026-08-17. In one day, an autonomous loop ran **1 agent and spent $1.27 of a $260/day ceiling**. That looked like a cautious executor. The actual cause was starvation. Of 185 queue items, **exactly 2 were ready, and both failed lint** because their done-condition was empty. At the same time, **186 candidates stayed unpromoted** in the inbox. Discovery was healthy. Execution was idle and cheap. Promotion had zero throughput. The research feed that week had many ideas for better discovery. One of them was a much-admired multi-agent auditor that produced 93 ranked findings overnight. Each of these ideas would have made the jam **worse**.

## 1. Measure all three stages before you propose anything

Get real numbers from the system's own state. Do not use impressions.

- **Discovery.** Count the candidates. Count the distinct sources. A feeder that reads two documents can emit hundreds of items and look productive.
- **Promotion.** Count the items that are ready **and** pass the validity check of the queue, if it has one. Count these two groups separately. `ready` is a claim. `ready and well-formed` is the throughput.
- **Execution.** Compare configured concurrency with used concurrency. Compare spend with the ceiling. Count the items completed per day. Find out whether the executor refused to run, and why.

Write the three numbers down together. When the numbers are in one place, the constraint is usually clear. Frequently, the constraint is not the stage that people were arguing about.

## 2. Tell an empty queue apart from a queue of items that nothing can execute

From the executor's side, these two states look the same. Their fixes are opposite. Check the *quality* of the ready set, item by item:

- **No verifiable done-condition.** If an item does not state its done-state, the executor will stop at "something plausible happened." Such an item is a wish and not a task.
- **Marked ready, but blocked on a human.** The worst example is an item where all remaining work is acts that an agent may not perform. Examples are account creation, publication of public content, purchases, and approvals. On 2026-08-17, one of the only two ready items was this type. It was fully built and waited for a human to click publish. **An item that an agent cannot do must never occupy the ready queue.** Such an item changes a status error into a throughput bug. An agent that gets the item will stall or improvise something that nobody wants.
- **Blockers written as fragments that nobody can read.** If a blocker is cut off mid-sentence, nobody can clear it, because nobody can tell what would clear it.

## 3. Audit the output composition of a feeder before you promote from it or trust it

Do not sample. Read the titles of the whole set and classify them. On 2026-08-17, an audit of all 186 candidates found **zero promotable items**:

- 117 were near-duplicate LLM "recommended next steps", harvested from approximately 2 source documents. One idea appeared 3 times and one template appeared 5 times.
- 51 were checklist bullets copied from the done-conditions of *other* documents.
- 13 were mid-sentence fragments.
- 4 kept only the phrase that matched a regex and none of the decision. One title contained the leaked regex alternation itself.

The sign of the worst class is a feeder that records **that** something was deferred, but does not record **what** was deferred. To promote its output, you must do again the expensive work that the feeder was built to avoid.

## 4. Never invent scope from a fragment

If a candidate does not carry enough information to write a real done-condition, you have two honest options:

1. Read the original source and write the item correctly.
2. Discard the candidate.

**Do not invent plausible scope to fill a queue.** This is the failure mode to avoid completely. Invented scope gives an executor confident-looking work that nobody asked for. In an autonomous loop, the executor spends real money on that work. A queue of 3 real items performs better than a queue of 180 invented items.

If you cannot promote from the inbox, refill the queue from a source that is already a decision. Examples are verified findings, reproduced failures, and explicit rulings. These sources include their evidence, and the evidence makes it possible to write a done-condition.

## 5. Fix the constraint stage at the source

- If **promotion** is the constraint, fix it upstream in what gets captured. Capture enough to promote the item, or do not file it. Alternatively, run a deliberate promotion pass. Do not add another scanner.
- If **execution** is the constraint, find which ceiling actually limits it: concurrency, wall clock, spend, or a guard that refuses to run. When the money ceiling limits parallelism, cost-per-item routing can be a lever for *concurrency* instead of a lever for savings.
- If **discovery** is actually the constraint, build the auditor. Discovery is the constraint only when the queue is clean, well-formed, and empty, and the executor is idle. In this case, the popular advice is correct.

## 6. Report the numbers, and name what you did not do

State the depth of each of the three stages before and after your work. Say clearly which stage you moved. If you refused to promote a set, say how many items you refused and why. A queue that stayed small on purpose is a result. Readers must not mistake it for a search that found nothing.

## Anti-patterns

- Adding discovery capacity without measuring promotion. This is the most common error.
- Counting `ready` items without checking that they are well-formed.
- Reading an idle executor as caution, or a low spend as thrift.
- Promoting items in bulk to make a queue look healthy.
- Treating the item count of a feeder as evidence that the feeder works. The composition is the measurement. The count is vanity.
