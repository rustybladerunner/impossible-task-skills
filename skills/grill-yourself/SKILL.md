---
name: grill-yourself
description: Question yourself BEFORE you question the operator. Build the full question inventory, then answer every question that you can by lookup, derivation, research or a safe default. Only the residue that the operator owns goes to /grill-me, in a reduced form. Use for "grill yourself", at the start of any large directive, before any /grill-me, or when a plan seems underspecified.
---

The decision bandwidth of the operator is the most limited resource in the
project. /grill-me uses that bandwidth. This pass protects it.

Build the complete question inventory. Then question YOURSELF first. Research
answers most questions. The few questions that remain reach the operator in a
sharper form, with your research attached.

## 1. Inventory

Build the same question inventory as /grill-me §1. Use the same sources: the
queue, the decision record, specs, the conversation and memory. Use the same
decision-value bar. Do not pre-filter the questions that you think the operator
can answer. The full inventory goes into the funnel.

## 2. Answer the questions with the resolution ladder

Apply the rungs to each question in this order. Stop at the first rung that
answers the question.

1. **Look it up.** Examine the decision record, memory, specs, any indexed corpus
   and docs/. An operator ruling about METHOD applies to every project. Before you
   decide that a question is open, examine the rulings in sibling projects. You
   may read all projects, and you must search for prior art first.
2. **Derive it.** Read the code, run the tool or measure the item. If `grep`, a
   probe script or a prior-art search can answer a question, it was never a
   question.
3. **Research it.** Use a local knowledge store and sibling projects. Use the web
   when the question justifies it. If a stuck fork survives one direct attempt,
   run the `five-ways` skill on it before you escalate.
4. **Default it safely.** Use this rung only when these three conditions are true:
   - The answer is reversible.
   - The answer has a low blast radius.
   - Any reasonable operator would accept the answer.

   Pick the default. Record it in the decision record as *defaulted (flag to
   change)*. Then continue. A recorded default that the operator can veto later
   is better than a question that blocks a run now.

## 3. The residue: questions that the operator owns

A question goes to /grill-me only if it is one of these types:

- **Taste** that a style document or aesthetic ruling does not already cover.
- **Money or spend appetite**: budgets, paid tiers, the scale of agent batches.
- **Risk and irreversible actions**: any action that a hard rule gates. Examples
  are installs, pushes, deletes, external accounts, public posts and live
  financial actions.
  - NEVER default these questions. Rung 4 is forbidden here.
  - Never ask "should I?" about these actions. Ask which sanctioned option the
    operator wants.
- **Scope forks** that change the order of weeks of work, or that change what a
  project IS.
- **External commitments** that only the operator can make or knows about.

## 4. Hand off

- Record each question that you answered in the decision record. Give the date
  and mark it *derived* or *defaulted (flag to change)*. Use one line for each
  question. This audit trail lets the operator veto at a low cost.
- Run the `grill-me` skill on ONLY the residue. Its §1 inventory step is already
  complete. For each question, give a one-line summary of your research: what you
  found, and why the question still needs the operator.
- If no residue remains, say so and start the work. This result is the ideal
  outcome. It is not a shortcut.

## Rules

- Never give the operator a question that this ladder could have answered. That
  question shows that you did not listen. Diagnose the question yourself first.
- Most inventories should reduce to 4 or fewer residue questions. If more
  questions remain, one of two causes applies. The directive really forks, which
  is acceptable. Or your defaults were too timid. Find which cause applies before
  you ask.
- Defaults must be honest defaults. If a veto would surprise you, the question
  was a residue question. Record it as a residue question.
