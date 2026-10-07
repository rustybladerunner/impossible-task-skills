---
name: shared-mat
description: Work in a repository that several people or agent sessions write to at the same time. Use when a commit disappeared after someone else rebased. Use when the staged work of another session went into your commit. Use before any history rewrite on a shared branch. Use when two editors have the same binary open. Use before you stage, reset, delete or edit a path that another session can hold.
---

# Shared mat

Lens edition of `concurrent-writers`. `concurrent-writers` is the full version.

## Use

- More than one session has the repository open.
- You are about to reset, clean or delete.
- A binary or generated asset cannot merge, so the last save wins.

## The move

1. Before you touch anything, do these checks:
   - Run `git status`.
   - Run `git log --oneline -5`.
   - Make sure that no editor holds an old copy of the file.

   A clean status does not prove that you are alone. It shows only one look at
   the tree.
2. Allow one writer per file. If another session owns the path, do your work in a
   different file or wait. Do not edit the shared file together with the other
   session and then reconcile later.
3. The index is shared. The staged files of another session are in the same index
   as yours. Commit by explicit path, so that you leave their staged entries
   alone. Never use `git add -A`.
4. Delete only by an allowlist of paths that you just created and listed. Do not
   delete files because you recognize them as "junk."
5. Put new behaviour in a new module, with a small call from the shared file. Do
   not rewrite the shared file from a side task.

## Do not

- Do not rewrite history on a branch that another person uses.
- Do not accept "the file looks coherent in my editor" as proof that the other
  writer has stopped. If time has passed, read the file from disk again before
  you edit it.
