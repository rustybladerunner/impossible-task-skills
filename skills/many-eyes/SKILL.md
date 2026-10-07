---
name: many-eyes
description: Review a target through several independent written rubrics. Then keep only the findings that pass a quorum and a check against the code. Use before you commit to an architecture, a plan, or a large refactor, or when someone asks what a sceptic would say.
---

# Many eyes

Lens edition of `perspective-gate`. `perspective-gate` is the full version.

One reviewer finds only what that reviewer looks for. This skill gives structured disagreement, and then a rule that decides which findings stay.

## Use

- You are about to commit to a design after a single read.
- Without this skill, "review this from every angle" becomes one model that pretends to be several people.
- A large refactor needs a reason to cut scope, and personal taste is about to supply that reason.

## The move

1. Select a small number of short rubrics. Each rubric must ask different questions.
   - Unnamed lenses, such as security, reliability, cost and operability, are frequently the useful half.
   - A lens with the name of a real person is a rubric derived from the published work of that person. The lens is not that person.
   - Write "the lens asks." Never write "they say."
   - Never invent a quote.
2. Apply each rubric separately. A lens must not see the notes of another lens until both lenses have answered.
3. Keep a finding only if one of these conditions is true:
   - More than one rubric marks the finding independently.
   - One rubric marks the finding, and a direct check of the code confirms it.
4. Treat disagreement as data. Write it down. Do not average it into a mild recommendation.
5. Each rubric must state what it refuses to judge. For example, a security lens does not decide the palette.

## Hand off

If the review had to select an attack but produced only a pile of notes, return to `intercept`. The findings that stay are the menu. They are not five ways at the same time.
