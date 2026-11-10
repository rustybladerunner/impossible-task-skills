---
name: scoped-commit
description: Make a clean, scoped git commit that includes ONLY the intended files (never `git add -A`). Preserve unrelated staged entries, and follow the house rules (Co-Authored-By trailer, no push). Use when the tree holds in-flight work from several sessions and only part of it is yours, when your change shares a file with edits that are not ready, when a stray build folder or an unrelated path went into the last commit and nobody saw it for a week, when the attribution trailer names something that did not do the work, or before you commit a staged set that you have not read back.
---

Commit deliberately. The working tree frequently holds many unrelated in-flight changes across many projects.
Never sweep all changes into the commit.

## Steps

1. **Survey.**
   - Run `git status --short` for the area that you touched. Run `git log --oneline -1`.
   - Identify exactly which files are YOURS for this change.
   - Identify which files are pre-existing work or work in progress (WIP) from another agent.
2. **Stage explicitly.**
   - Run `git add <path> <path>...`. NEVER run `git add -A` or `git add .`.
   - If your edits share a file with pre-existing WIP, try `git add -p` to stage only your hunks.
   - If interactive hunk staging is unavailable, prepare an exact patch against the intended base in a private index or an authorized isolated copy. Verify that it contains only your changes. If you cannot separate the edits, leave the file uncommitted until its owner agrees on the combined change. A note in the commit message does not authorize bundling their work.
3. **Verify the scope.**
   - Run `git diff --cached --stat`.
   - Read the full proposed diff, including any shared-file hunks. A matching path list alone does not prove ownership.
   - Preserve unrelated staged entries. Do not unstage another session's files to make the index look clean.
   - Recheck ownership and the base immediately before committing. Coordinate one committer, or use a private index and a checked ref update that refuses a changed base.
4. **Commit** with a clear message.
   - Say what changed and why. Include only the reviewed, authorized changes.
   - With coordinated exclusive ownership, commit explicit paths: `git commit -m "<message>" -- <paths>`. This takes the full working-file contents of those paths, so do not use it to commit only selected hunks of a mixed file. Commit a reviewed partial-file tree from the private index instead.
   - For a multi-line message, use a `git commit -F -` heredoc.
   - Follow the trailer convention that the project already uses. Check an existing commit. Do not assume.
   - Some projects want an assistant attribution trailer. Some projects want no trailer.
   - If the project wants a trailer, name the model that actually runs the session:
     `Co-Authored-By: <Name> <email>`
   - Do NOT hardcode a model version here. Until 2026-08-15, this line read `<assistant model name and version>` with one fixed model. That model had stopped running sessions long before. As a result, sessions attributed their work to a model that did not do it. The git trailer is the permanent attribution record.
5. **Do NOT push** unless someone explicitly asks you to push.
   - If the repo convention is solo commits to `main`, you can commit there.
   - Keep the commit scoped and additive.

## Rules

- Hard rules:
  - Never run `git add -A`.
  - Never commit `.env` files or secrets.
  - Never push without a request.
  - Do not run destructive git operations (`reset --hard`, `clean -f`, `checkout .`) without confirmation.
- Before you commit, verify the exact proposed tree and diff. Afterward, verify the commit paths and that unrelated working files and staged entries were preserved.
- On a pure feature addition, 0 deletions is a good signal that no WIP was swept in.
