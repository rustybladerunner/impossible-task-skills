# Security policy

## Reporting a vulnerability

Report it privately through GitHub:
[Report a vulnerability](https://github.com/rustybladerunner/impossible-task-skills/security/advisories/new).
Do not open a public issue for a security problem.

Reports are handled on a best-effort basis by one maintainer. Only the `main` branch receives
fixes.

## Scope

The skills are plain-text instructions that an assistant reads. In scope:

- a skill whose instructions would lead an assistant to leak secrets or personal data, run a
  destructive command, or act outside what the user asked;
- text in a skill that an assistant could mistake for instructions from the user (prompt
  injection);
- a bug in the repository's tools (`tools/`) or lints that lets a skill that breaks these rules
  pass.

Out of scope: the behaviour of a particular assistant or vendor that loads the skills, and harm that
needs the user to edit a skill first.
