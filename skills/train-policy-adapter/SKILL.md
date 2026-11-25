---
name: train-policy-adapter
description: Build and package a low-rank adapter for an existing open-weight language model to learn one narrow work policy. Use when matched prompt baselines leave a gap and approved training examples and compute are available.
---

# Train a policy adapter

Train a low-rank adapter on a frozen base checkpoint. Start with matched base and checklist results, acceptance thresholds, and a sealed test split. The companion skill `policy-adaptation-eval` covers that design. Confirm that the base license permits the intended use and distribution, training examples are approved, and the run fits the authorized hardware and spend.

## Prepare the data and configuration

1. Version the base checkpoint and tokenizer together. Record the model's chat template, context limit, intended serving format, training library versions, and hardware. Save the run configuration and seed with the output.
2. Write supervised examples in the format used at inference. Include the user input, necessary context, and the desired assistant answer. Include positive cases, boundary cases, and ordinary tasks where the policy stays dormant. If the goal is to serve without policy text, omit the rulebook from training inputs and give each example enough context to infer the correct action. Keep training, development, and sealed examples separate by scenario family.
3. Render and tokenize representative examples before training. Check end-of-turn tokens, truncation, role boundaries, and which tokens contribute to the loss. If using assistant-only loss, verify that examples actually contain unmasked assistant targets. Record trainable parameter count, target modules, rank, learning rate, batch size, sequence length, and precision.

## Train, reload, and qualify

1. Run a small smoke job. Prove a finite loss, a nonzero update to trainable parameters, and a saved checkpoint. Reload the adapter in a fresh process on the pinned base and test generation with the inference template. Verify that the runtime has activated the intended adapter.
2. Run the bounded training job. Record elapsed time, hardware, data hash, settings, checkpoint selection rule, and actual spend. Use development results to select the checkpoint. Open the sealed set only after selection.
3. Evaluate the reloaded adapter against the matched base and checklist baseline. Test policy boundaries and unrelated tasks. If serving uses merged or quantized weights, qualify that exact artifact as well. Use the existing acceptance thresholds and count retries and review.
4. Package the adapter weights and config, base and tokenizer identifiers, data provenance, training recipe, evaluation results, and limitations. Check redistribution rights separately before packaging data or merged weights. Keep the base plus checklist available as the rollback path. Permissions and destructive-action constraints stay enforced at runtime.
