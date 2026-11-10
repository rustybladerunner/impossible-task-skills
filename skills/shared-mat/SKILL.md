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
3. The index and branch are shared. Coordinate one committer, or use a private
   index and a checked ref update that refuses a changed base. Recheck ownership
   at commit time. Explicit-path commits preserve unrelated staged paths but
   include the whole working-file contents of each named path. For a mixed file,
   verify an exact partial-file patch in the private index; do not bundle another
   writer's work because interactive hunk staging is unavailable. Never use
   `git add -A`. Verify the commit and that unrelated index entries survived.
4. Delete only by an allowlist of paths that you just created and listed. Do not
   delete files because you recognize them as "junk."
5. Put new behaviour in a new module, with a small call from the shared file. Do
   not rewrite the shared file from a side task.

## Do not

- Do not rewrite history on a branch that another person uses without explicit
  authority and exclusive branch/index ownership. A soft reset or a plumbing ref
  update changes shared state even when working files stay intact.
- Do not accept "the file looks coherent in my editor" as proof that the other
  writer has stopped. If time has passed, read the file from disk again before
  you edit it.
