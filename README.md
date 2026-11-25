# impossible-task-skills

Method skills for agent work, from [Impossible Task](https://impossibletask.dev).

A skill is a folder with a `SKILL.md` file. The file has YAML frontmatter and then
instructions. The frontmatter gives the skill name and tells the assistant when to use
the skill. The format is plain text. Any assistant that reads skill folders can use it.

The skills name no vendor and no product. They describe a capability, for example
"a browser tool". A lint enforces this rule.

## Core skills and lens editions

Each core skill is the full version. A lens edition is a short version of the same
method. Use the lens edition when you need the method in less than one page.
The lens editions use the language of a martial art. They are adapted from
Bruce Lee's Five Ways of Attack.

### Method

| Core skill | Lens edition | Use it to |
|:--|:--|:--|
| [`baseline-first`](skills/baseline-first/SKILL.md) | [`read-the-gauge`](skills/read-the-gauge/SKILL.md) | Record what the system reports before you change it. |
| [`five-ways`](skills/five-ways/SKILL.md) | [`intercept`](skills/intercept/SKILL.md), [`whose-move`](skills/whose-move/SKILL.md) | Choose one attack after a fix fails two times. |
| [`fix-once`](skills/fix-once/SKILL.md) | [`catch-it`](skills/catch-it/SKILL.md) | Turn a fixed bug into a check that fails if the bug comes back. |
| [`gate-triage`](skills/gate-triage/SKILL.md) | [`red-gate`](skills/red-gate/SKILL.md) | Sort each failure in a red check suite, then fix the cause. |
| [`perf-pass`](skills/perf-pass/SKILL.md) | [`one-hog`](skills/one-hog/SKILL.md) | Measure, fix the largest cost, and measure again. |
| [`queue-constraint`](skills/queue-constraint/SKILL.md) | | Find the stage of a work pipeline that limits the output. |
| [`reference-match-loop`](skills/reference-match-loop/SKILL.md) | [`match-the-reference`](skills/match-the-reference/SKILL.md) | Close a visual task only when a new capture matches the reference. |
| [`silent-no-ops`](skills/silent-no-ops/SKILL.md) | [`empty-hand`](skills/empty-hand/SKILL.md) | Find automation that reports success and changes nothing. |

### Judgment

| Core skill | Lens edition | Use it to |
|:--|:--|:--|
| [`skip-cost`](skills/skip-cost/SKILL.md) | [`refuse-the-strike`](skills/refuse-the-strike/SKILL.md) | Test a new tool before you adopt it. Most tools stop at "skip". |
| [`grill-yourself`](skills/grill-yourself/SKILL.md) | [`burn-the-questions`](skills/burn-the-questions/SKILL.md) | Answer every question you can before you ask a person. |
| [`grill-me`](skills/grill-me/SKILL.md) | | Ask the decisions that block the work, and record the answers. |

### Model adaptation

| Skill | Use it to |
|:--|:--|
| [`policy-adaptation-eval`](skills/policy-adaptation-eval/SKILL.md) | Decide whether a checklist or adapter earns its cost on held-out tasks. |
| [`train-policy-adapter`](skills/train-policy-adapter/SKILL.md) | Train, reload, and package a low-rank adapter for an open-weight base model. |

### Shipping

| Core skill | Lens edition | Use it to |
|:--|:--|:--|
| [`concurrent-writers`](skills/concurrent-writers/SKILL.md) | [`shared-mat`](skills/shared-mat/SKILL.md) | Work safely in a repository that other sessions also change. |
| [`handoff`](skills/handoff/SKILL.md) | [`pass-the-mat`](skills/pass-the-mat/SKILL.md) | Stop work so that the next session can continue without the transcript. |
| [`repo-extract`](skills/repo-extract/SKILL.md) | | Move a subproject to its own repository without secrets or media. |
| [`scoped-commit`](skills/scoped-commit/SKILL.md) | [`land-yours`](skills/land-yours/SKILL.md) | Commit only the files that belong to your change. |

### Loops

| Core skill | Lens edition | Use it to |
|:--|:--|:--|
| [`one-press`](skills/one-press/SKILL.md) | | Move a project forward by one verified step. |
| [`perspective-gate`](skills/perspective-gate/SKILL.md) | [`many-eyes`](skills/many-eyes/SKILL.md) | Review a target with several independent rubrics. Keep only the findings that more than one rubric supports. |

## Evidence

A skill is useful only if the assistant loads it at the correct time. We measure this
with trigger sets. Each set in `evals/<skill>/triggers.json` has realistic prompts that
must load the skill, and near-miss prompts that must not load it.

These are historical trigger observations, not a new evaluation of the current
release. The result files do not bind the measurements to a model version or a
skill-text hash. Each prompt was attempted three times; repeats are not new unique
cases. "Recall" and "Specificity" below use only completed, non-error attempts.
Errored attempts are reported separately and are not counted as successful loads
or correct refusals.

| Skill | Recall | Specificity | Errored / attempted | Data |
|:--|--:|--:|--:|:--|
| `concurrent-writers` | 12/12 | 11/11 | 1/24 | [results](evals/results/concurrent-writers-reps3.json) |
| `fix-once` | 10/10 | 16/16 | 4/30 | [results](evals/results/fix-once-reps3.json) |
| `gate-triage` | 11/11 | 9/9 | 4/24 | [results](evals/results/gate-triage-reps3.json) |
| `silent-no-ops` | 12/12 | 10/10 | 2/24 | [results](evals/results/silent-no-ops-reps3.json) |
| `handoff` | 9/15 | 15/15 | Not recorded | [results](evals/results/2026-08-26-handoff-reps3.json) |
| `grill-yourself` | 0/15 | 15/15 | Not recorded | [results](evals/results/2026-08-26-grill-yourself-reps3.json) |

We publish the failures too. Before a description rewrite, `handoff` did not load on
any should-load prompt (one run of each prompt). After the rewrite, it loaded on 9 of 15
(three runs of each prompt). `grill-yourself` did not load on any prompt. We tried a
longer description, measured it, and reverted it, because it did not help. The result
file records the reason we think it fails. The skill asks the assistant to change how
it behaves. It does not ask for an artifact. The assistant then follows the prompt
directly and does not load a procedure.

The `handoff` result measured a 648-character description. The shipped skill now
uses a different checkpoint compatibility description, so the historical 60% recall
is not a measurement of that current description. The other core skills have
trigger sets but no published measurement. The lens editions have no trigger sets.

Two kinds of text in the result files were redacted before publication: local
temporary paths (now `<tmp>/...`) and the name of an assistant configuration folder
(now `<assistant-config>`). We changed nothing else in the measured data.

## Install

Copy skill folders into the skills folder that your assistant reads. Install the
whole collection when you want the procedures that call other skills. For example,
`grill-yourself` refers to the inventory in `grill-me`, and `intercept` calls
`whose-move`. A single-folder installation may need those procedures supplied too.

`grill-me` requires a structured question tool with selectable choices. Without
that tool, its question batches remain pending. Follow your host's permissions
for tools, memory writes, commits and other actions; installing a skill does not
grant those permissions.

## Checks

```bash
npm test
```

This runs the lint and its self-test. The lint checks skill structure and known
patterns for vendor names, local paths, private addresses and credentials. Git
must be available so the repository-wide inventory can be checked. These pattern
checks do not prove that content or commit history contains no sensitive data.
Review the exact publish set and any private denylist before publication.

## Language

The text in this repository follows the writing rules of ASD-STE100 Simplified
Technical English: short sentences, one instruction in each sentence, active voice and
one meaning for each word. We applied these rules and checked the result with a
heuristic review. This is not a certified conformance check against the official
ASD-STE100 dictionary.

## License

MIT. See [LICENSE](LICENSE).
