---
name: fix-once
description: Turn a bug that you just fixed into a check that prevents its return. Reproduce the bug first, write the check while the check still fails, then connect the check to the process that runs on every change. Use immediately after you fix any defect. Use when you write a rule down instead of enforcing it. Use when the same bug occurred more than once. Use when a fix is about to ship and nothing proves that it stays fixed.
---

# Every bug fix needs a check

A fix that ships without a check has a half-life. Today the fix works because you keep
the whole problem in your head. In three weeks, nobody does. Then the only protection
against the same bug is that nobody touches that path.

A written rule does not hold. People read it once, agree with it, and then ignore it.
Usually, that person never saw the rule. Sometimes, that person wrote the rule. The only
durable form of "do not do this again" is something that fails.

**Every bug fix has two deliverables: the fix, and the check that would have caught the
bug.**

## The loop

**1. Reproduce the bug first, mechanically.**

Before you change any code for the fix, make the failure occur on demand. Use a script, a
test, or a one-liner. If you cannot make it fail on command, you do not understand it yet.
Then a "fix" only disturbs the bug.

Reproduction is also the only honest way to know that your check works. A check written
after the fix never saw the bug. A check that never failed is theatre.

**2. Write the check while the bug is still live, and see it go red.**

The order is important and it has a function. A check written against code that is
already fixed can pass for reasons that are not related to the defect. Examples are a
wrong assertion, a wrong path, a wrong file, or a typo that makes the check a no-op. You
will never know, because green was the expected answer.

Run the check now. It must fail. The failure message must name the actual problem. If the
check passes against the broken code, the check is wrong and the code is not the problem.

**3. Apply the fix. See the same check go green.**

The evidence is red, then green, on the *same unchanged check*. Any other result is only
correlation.

**4. Connect the check to the process that runs on every change.**

A check that nobody runs is only a file. Find the process that already runs, such as the
test command, the lint suite, the CI job, or the pre-commit hook. Add the check there. If
your project has a single registry of checks, one row is all of the work. A registry
exists for that purpose.

If the check is hard to add, that difficulty is itself a finding. People do not add checks
that are expensive to add.

**5. State the class that the check covers, and also the instance.**

The bug that you found is one member of a family. For example, `\b` fails inside
snake_case. That is one instance of a class: every rule that uses that boundary. Where you
can, fix and gate the class. Where you cannot, state which instance you covered. Then the
next person knows that the rest of the class is still open.

## Properties of a useful check

**The check must be able to fail.** Supply the known-bad input and confirm that the check
goes red. A gate that never went red looks the same as a broken gate. Both report success
forever.

**The check must not give false alarms.** Also write adversarial *clean* cases. These are
realistic inputs from the domain that must NOT trip the check. People switch off a rule
that matches a common English word within a week. A check that is switched off protects
nothing. Here, precision is more important than recall. A rule that sends an ambiguous
case to human review is much better than a rule that people learn to ignore.

Write those clean cases *before* you trust the rule. Take them from the vocabulary of the
domain. Do not invent them. If you invent them, you will unconsciously avoid the words
that would trip your own regex.

**The check must fail closed.** Decide what happens when the check cannot run. Examples are
no network, a missing tool, or an unreadable file. If the check passes in that condition,
it reports success for work that it did not do. Prefer a loud error to a silent skip.

**The floor of the check must be between "present" and "absent".** If a threshold passes
when the subject is present and also when the subject is deleted, it measures nothing.
Test that case.

## The self-test is mandatory, and it must call the real check

A self-test that restates the rule, and does not call it, will pass against an empty
implementation. Import the actual function. Supply the actual payloads to it.

Keep both halves of the self-test permanently:

- **known-bad**: each case must trip a *named* rule. Then, if a person deletes a rule, the
  case for that rule fails. Coverage does not decrease silently.
- **known-good**: realistic content that must stay clean.

Use a different exit code when the self-test itself breaks and when the subject is dirty.
"The gate stopped working" and "the code is wrong" are different emergencies. If you use
the same signal for both, you hide the worse one.

## When no check is possible

Sometimes the defect is a judgement call, or it is in a place that you cannot reach. Then
say so explicitly. Do not skip the step silently. Name the check that would have caught the
defect, and say why it is not practical here. That gives a real record. The next person
can possibly see a seam that you did not see.

The silent version must never occur. In that version, a fix ships with no check and no
statement. Somebody adds only a note to a document that nobody reads again.

## Reporting

Report these three items:

1. the class of the bug
2. the check that now covers it
3. **when the check last failed on known-bad input**

The third item is the most important. If a green check has never been red, it has told you
nothing.
