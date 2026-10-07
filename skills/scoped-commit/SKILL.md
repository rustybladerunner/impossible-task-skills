---
name: scoped-commit
description: Make a clean, scoped git commit that includes ONLY the intended files (never `git add -A`). Verify that nothing unrelated is staged, and follow the house rules (Co-Authored-By trailer, no push). Use when the tree holds in-flight work from several sessions and only part of it is yours, when your change shares a file with edits that are not ready, when a stray build folder or an unrelated path went into the last commit and nobody saw it for a week, when the attribution trailer names something that did not do the work, or before you commit a staged set that you have not read back.
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
   - In some environments `git add -p` is not available, for example non-interactive shells and some agent harnesses. In that case, commit the whole file and SAY SO in the message.
3. **Verify the scope.**
   - Run `git diff --cached --stat`.
   - Then run this guard. It must print nothing:
     `git diff --cached --name-only | grep -vE '^(<expected paths>)$'`
   - Optional: grep the staged diff for your feature markers. This confirms that the staged diff is your work.
4. **Commit** with a clear message.
   - Say what changed and why. Note any bundled WIP.
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
- Before you commit, verify that the staged list is EXACTLY what you intended. One time, a mistyped path created a stray directory.
- On a pure feature addition, 0 deletions is a good signal that no WIP was swept in.
