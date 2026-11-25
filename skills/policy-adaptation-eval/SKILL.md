---
name: policy-adaptation-eval
description: Decide whether to keep a checklist in the prompt or train an open-weight model to follow a stable work policy. Use when a team wants to reduce repeated instructions, qualify a policy adapter, or compare cost per accepted outcome.
---

# Policy adaptation eval

Choose one stable work policy with an observable outcome. Rewrite each relevant rule as a decision with a valid input, expected result, and boundary case. Include cases where the rule should stay dormant, two rules conflict, and the model should abstain. Keep authorization, privacy, and destructive-action controls in the application or harness.

## Freeze the test before making training examples

1. Record the base model revision, decoding settings, tools, task families, graders, and thresholds. Set the acceptance floor for ordinary cases, critical errors, and unrelated work before looking at results.
2. Split by scenario family or upstream source so variations of one incident stay together. Remove overlap and near duplicates. Reserve a sealed final set. Use a separate development set to choose prompts, examples, or training settings.
3. Score observable outcomes with executable checks where possible. For judgment calls, blind the reviewer to the arm, require evidence from the output, and calibrate the rubric on a small human-reviewed development sample.

## Compare the cheapest viable interventions

- Run the same base model with no policy text and with the shortest usable checklist. Keep task inputs, available tools, retries, and review conditions matched. If the checklist meets the acceptance target at an acceptable cost, keep it.
- If prompt overhead or recurring failures still matter, train a low-rank adapter on approved examples. The companion skill `train-policy-adapter` covers training and packaging. Compare the resulting adapter with the same base checkpoint under the same inference conditions. Use an adapter arm without policy text to measure what the adapter learned.
- Release only after the held-out results meet the prespecified thresholds and unrelated capabilities hold their baselines. Check rule changes and rollback with the base model plus checklist. Record the exact model and adapter revisions.

Report accepted runs, error classes, retries, review time, p50 and p95 latency when samples support them, and cost per accepted result. Include preparation, training, serving, retries, and review under the expected workload. If nothing passes, report the spend and failure counts. Cost per accepted result is undefined in that case.

## Example

In the seeded story-teller trial, the story bible placed both of Mara's calls on Tuesday. The supplied chapter incorrectly said she called from Ray's house "yesterday." Both fresh sessions received identical chapter text and an exact replacement format. One also received the editing skill. The skill arm changed "yesterday" to "this morning" and the control changed it to "today." Both passed the byte comparison. The same verifier rejected a deliberately altered chapter that moved Eli's decision to sign over to Mara.

This one pair showed that the replacement format and verifier were sufficient for the fixture. It provides no estimate of a training benefit. Keep the fixture out of training if you plan to use it as a held-out case. See the [minimal reproduction](seeded-story-teller.md).
