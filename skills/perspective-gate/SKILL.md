---
name: perspective-gate
description: Review a target through several independent named rubrics ("lenses"). Each lens asks different questions. Then keep only the findings that pass a quorum and adversarial verification. Use for "review this from every angle", "what would a sceptic say about this design", "run the lenses over this repo", or before you commit to an architecture, a plan, or a large refactor.
---

One reviewer finds only what that reviewer looks for. This gate gives **structured disagreement**.
It uses N rubrics. Each rubric asks a different question. The rubrics run blind to each other.
A rule then decides which findings stay.

The gate does not ask the model to be several people. It uses a set of written rubrics.
Each rubric has its own questions and its own refusals, and you apply each one deliberately.
The disagreements between the rubrics are the most useful part of the output.

## The honesty rule

Read this rule first, because it limits all other parts of the gate.

A lens with the name of a real person is **a rubric derived from the published work of that person**.
The lens is not that person. The lens does not speak for that person.
Never present the output of the lens as the opinion of that person about the thing under review.

- Write **"the X lens asks: …"**. Never write *"X says your architecture is wrong"*.
- **Never invent a quote.** Never attribute a specific claim about this target to a real person.
- **Cite the sources of the rubric.** A lens without a citation is an invented lens. Over time, it becomes a way to launder your own opinion through the reputation of another person.
- A lens can be wrong about the person. The lens is a rubric. Label it as a rubric, and correct it when necessary.

Unnamed lenses, such as a security lens, a reliability lens or a cost lens, carry none of this risk.
They are frequently the more useful half. If the persona adds nothing, prefer an unnamed lens.

## Lens format

Use one file for each lens. Keep each lens short. If a lens needs a full page to state, it is not a lens.

```yaml
name:         short-slug
title:        The <thing> lens
derived-from: the public sources this rubric is built from
asks:         5-9 questions, the ones this lens always asks
smells:       what makes this lens uneasy, concretely
refuses:      what this lens says no to outright
not-my-domain: what it should decline to judge
verdict:      the shape of its output
```

**The `refuses` and `not-my-domain` fields make a lens sharp.** A rubric with only questions approves of everything.
A lens that cannot decline comments on everything, and its signal is lost in its own volume.

## Run the gate

1. **Set the scope of the target.** The target can be a repo, a directory, a diff, a plan or a specification.
   - If the target is too large to review honestly, refuse it and suggest a split.
   - A lens that you apply to everything says nothing.
2. **Run the lenses independently and in parallel.**
   - A lens must not see the findings of another lens.
   - Cross-talk collapses the lenses into one reviewer with extra steps. This design exists to prevent that failure.
3. **Each lens returns findings, or declines.**
   - A finding needs a concrete failure scenario. The scenario gives specific inputs or state, and the wrong outcome that follows.
   - "This feels over-engineered" is not a finding.
   - "This abstraction has one implementation and adds two indirections between the caller and the work" is a finding.
4. **Apply the quorum.** Keep a finding if one of these conditions is true:
   - Two or more lenses raised it.
   - One lens raised it *with* a concrete failure scenario.

   Put all other findings in a secondary list. Do not put them in the headline.
5. **Verify adversarially before you report.**
   - Try to refute each finding that stays. Read the source again to do this.
   - Human reviewers, model reviewers and rubric-driven reviewers all produce confident findings that are wrong.
   - This occurs frequently enough that an unverified list destroys its own credibility.
6. **Report the disagreements explicitly.**
   - When two lenses reach opposite conclusions, the target has a real design tension.
   - The name of that tension is worth more than either verdict alone.

## Output

Give ranked findings. Each finding carries these items:

- the lens that raised it
- the concrete failure scenario
- one next action

**Do not produce a score.** People optimize a number. People quote a number without its reasoning.
A number also hides which lens objected and why. The findings *are* the output.

Limit the work items that the gate can file. A review that files thirty items has moved the problem.
It has not solved the problem.

## Keep the set honest

- **Retire a lens if nobody acts on its findings.** This is the same rule as for any check that never catches anything. The lens costs attention and returns no value.
- **Track which lens produced findings that mattered.** After a few runs, this record tells you which rubrics fit your work. You cannot know this in advance.
- **If the operator has a lens, give it more weight than the other lenses.** The taste of the operator is the actual acceptance criterion. A famous rubric that contradicts it loses.
- **Start with two lenses.** Prove that the gate produces findings worth acting on before you add more lenses. A gate with eight lenses that nobody reads is worse than a gate with two lenses that people act on.

## Anti-patterns

- You present the output of a lens as the opinion of a real person.
- You invent a citation or a quote to give a rubric authority.
- You run the lenses in one pass, so that they influence each other.
- You report every finding, unranked and unverified.
- You produce a score.
- You add lenses because more perspectives sound better. Each lens costs a full pass over the target. An additional lens usually repeats an existing one.
- You run the gate on a schedule. The gate is expensive. Run it on a condition, such as a merge, a design decision or a milestone.
