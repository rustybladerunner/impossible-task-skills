---
name: grill-me
description: Ask the operator 5-25 sharp multiple-choice questions to unblock the next steps of the current project. Find every decision that blocks or steers work, send the questions in batches through a structured question tool with selectable options, record the answers durably (a decision record, the backlog, memory), then continue. Use when a long autonomous run is about to start on taste decisions that only the operator can make. Use when the backlog has stopped behind items that nobody has decided. Use when one small question at a time interrupts the work too often. Use when a decision is asked again because nobody recorded the last answer.
---

Ask, decide and unblock. The operator gives you decision bandwidth. Use it only
on questions whose answers CHANGE what gets built, the order of the work or its
constraints. Never ask a question that you can look up, derive or safely default.

## 0. Auto-trigger (operator ruling 2026-08-09)

This pass is a default. The operator does not need to request it. Run this pass
WITHOUT a request when you are about to start a long autonomous run whose intent
is not fully fixed. These conditions start the pass:

- A new directive implies hours of autonomous work, a blast radius across
  multiple projects, or aesthetic or judgment decisions. The conversation has not
  yet fixed the steering decisions.
- A scoping pass found three or more unresolved steering decisions.
- You are starting a dispatch batch in an interactive session, and the text of a
  selected backlog item contains PROPOSED, TBD or "operator decision" markers.

Scale the pass to the ambiguity. The 5-question minimum below applies to a full
grill. An auto-triggered pass may be a single structured question batch of 2-4
questions, if that is all the real decision value. Alignment occurs ONCE, at the
start. After the answers arrive, complete the work end to end. Do not add more
permission checkpoints.

An unattended run cannot grill at all. In an unattended run, ambiguous work stays
gated for a human. A batch must never block while it waits for answers that no
person is present to give.

**Always question yourself first.** Run the `grill-yourself` skill on the
inventory before any question reaches the operator. Lookup, derivation, research
and safe defaults answer most questions. The residue arrives here in a reduced
form, with the research attached. Skip the self-questioning pass only when the
operator explicitly asked for questions without it.

## 1. Build the question inventory before you ask anything

Read these sources. Limit them to the active project: the folder that you are in,
or the project that the conversation is about.

1. **The queue**: the backlog. Read every `[ ]` item. Note which items are blocked
   on a decision and which are blocked on work. Items tagged PROPOSED, TBD or
   "operator decision" are questions.
2. **The decision record**, if the project keeps one. Entries marked *defaulted*,
   *pending*, *flag to change* or *PROPOSED* are questions.
   - Do NOT ask again about an entry that is already DECIDED.
   - The exception: a later fact invalidated that decision. Then ask in this
     form: "X conflicts with your earlier Y — which wins?"
3. **Specs and research**: the spec and research notes of the project. Look for
   "open question" and "[VERIFY" markers.
4. **The conversation**: anything that the operator said in this session that
   implies an unresolved fork.
5. **Memory**: recalled feedback rules that limit which options are legal.
   Examples are no installs, local-only data and demo-only. The options that you
   offer must obey these rules.

Then rank the candidate questions by **decision value**:

- (a) The question blocks work now.
- (b) The question steers architecture soon.
- (c) The question sets thresholds or gates that are cheap to decide now and
  expensive to change later.
- (d) The question calibrates expectations, such as cadence and appetite.

Drop any question below that bar. Ask 5 questions minimum and 25 maximum. If you
cannot find 5 questions with real decision value, say so. Then ask only the real
questions. Do not add filler questions.

## 2. Ask in batches, with multiple choice and a recommendation

- **Use the structured question tool for every batch.** Use the question tool with selectable
  choices that the current mode permits.
  - Every question MUST fill the selectable `options` of the tool.
  - Prose questions, numbered lists and tool prompts with free text only do not
    satisfy this skill.
- Never ask the operator to type an answer. Never invite free text.
  - Supply concrete selectable choices for timing, scope, budget and every other
    decision.
  - If the tool automatically offers an Other field, that field may stay
    available. Do not make it part of the required workflow.
- Send approximately four questions in each batch. Obey the limit of the tool and
  any batch preference of the operator.
- If no suitable question tool is available, report the limitation. Keep those
  decisions pending. Do not use a prose questionnaire as a substitute.
- A submitted tool answer is a decision. A preselected option, an accepted tool
  call or elapsed time is not an answer. Wait for actual selections before you
  start dependent work.
- Order the batches by decision value: blockers first, then architecture, then
  thresholds, then calibration.
- Give every question 2-4 concrete options.
  - Put your recommendation FIRST, and label it "(Recommended)".
  - In each option description, state the cost and benefit in one or two
    sentences: what the option gives and what it costs.
  - Use multiSelect when the choices really combine.
- Write each question from the position of the operator, for example "how should
  X reach you" or "what's your appetite for Y". Do not ask about implementation
  details.
- Ask one decision per question. Do not ask compound questions.
- If an answer invalidates queued questions, drop or rewrite those questions
  before the next batch. Do not ask questions that are no longer valid.

## 3. Record the answers as decisions

Immediately after the last batch, do these steps:

1. Add a dated section to the decision record of the project. If the project has
   no decision record, create one. Summarize every answer. If an answer REVERSES a
   prior decision, state that explicitly.
2. Apply the results to the backlog.
   - Retag PROPOSED items as decided.
   - Reorder items, or add the items that the answers unblock.
   - Close the items that the answers reject. Mark them CLOSED-REJECTED with the
     reason. Do not delete them.
3. If an answer shows a durable operator preference, record it in memory as a
   feedback entry. Use the memory schema of your environment. Do not record
   project state as a preference.
4. Make a scoped commit of the changed documents. Never use `git add -A`. Add the
   `Co-Authored-By` trailer. Do not push.

## 4. Continue

At the end, state these items in a few sentences:

- What is now unblocked.
- The build order.
- Any items that still need the operator.

If an unblocked part is small and clearly next, start it in the same session. Do
not stop at the summary.

## Rules

- Do not ask questions that the operator already answered in this session or in
  the decision record. A repeated question shows that you did not listen.
- Never ask permission questions such as "should I proceed?". Ask direction
  questions.
- Never offer options that break a hard rule. Examples are spending money, installs,
  pushes and routing personal data to the cloud.
- If the operator chooses to use an automatic Other field, record the answer
  word for word. Never require that field. Never offer free-text replies as the
  default.
