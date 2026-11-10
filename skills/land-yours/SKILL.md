---
name: land-yours
description: Commit only the paths that belong to this change, in a tree that other sessions also use. Use when several sessions have uncommitted work, when your edit shares a file with work that is not ready, when a previous commit included a build folder or an unrelated path, or before you commit a staged set that you have not read back.
---

# Land yours

Lens edition of `scoped-commit`. `scoped-commit` is the full version.

Use this skill when the way is ABC and a stage is ready to land. Also use it each time the tree is not only yours.

## Use

- `git status` shows files that you did not touch.
- Your change is in a file that also holds an edit from another person.
- You are about to run `git add -A` because it is faster.

## The move

1. Survey the tree. Run `git status --short` for the area that you touched, and run `git log -1 --oneline`. Mark the paths that belong to this change.
2. Stage explicit paths. Never run `git add -A` or `git add .`.
   - If your hunks share a file with other work, and the tool can stage single hunks, stage only your hunks.
   - If the tool cannot stage single hunks, prepare and verify an exact patch in a private index or authorized isolated copy. If the changes cannot be separated, leave the file uncommitted until its owner agrees on the combined change.
3. Read the full proposed diff, including shared-file hunks. Preserve unrelated staged entries. Recheck ownership and the base immediately before committing.
4. Coordinate one committer, or use a private index and a checked ref update that refuses a changed base. Under exclusive ownership, explicit-path commits preserve unrelated staged paths but take the whole working-file contents of each named path. Use the private index for a partial-file commit. Put `-m` or `-F` before `--`, then verify the commit and preserved index.
5. Do not push unless this session received a request to push.

Add an attribution trailer only if the repo already uses one. Name only the model that did the work. Do not copy a trailer from a different project.

## Do not

- Sweep the index. If another session possibly staged files, see `shared-mat`.
- Amend a commit that you did not create in this session.
- Amend a commit that was pushed.
