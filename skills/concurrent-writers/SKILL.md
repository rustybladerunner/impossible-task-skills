---
name: concurrent-writers
description: Work safely in a repository that several people or agent sessions write to at the same time. Covers the shared git index, file ownership, deletion by allowlist instead of recognition, and why a clean-looking tree does not prove that you are alone. Use when a commit that you made disappeared after someone else rebased. Use when the staged work of a teammate went into your commit. Use before any history rewrite on a shared branch. Use when two people have the same asset or binary open in an editor and the last save wins. Use when you need a protocol for who edits which file. Use before you stage, reset, delete or edit anything that another session can hold open.
---

# Several writers, one repository

When more than one session writes to a repository at the same time, coordination
is the only control that prevents lost work. Binary assets make the problem
worse, because a file that cannot merge means that the last save wins. But the
worst failures occur in *git itself*, and they affect text repositories equally.

## Before you touch anything

- **Run `git status`.** Is the tree already dirty, and who made the changes? A
  tree that contains changes from other people is not your tree.
- **Find out if an application holds the file open.** An idle editor with an old
  copy in memory overwrites your change when it saves later.
- **Find out if another session owns this area.** Ask before you assume that the
  area is free.
- **Run `git log --oneline -5`.** Find out if the commit that you build on
  actually landed.

## The shared index is the trap

**Concurrent sessions share one staging area.** This fact is the least obvious
one here, and it causes the most damage. The staged, in-progress work of another
session is in the same index as yours.

- Coordinate one committer, or prepare the reviewed tree in a private index and
  update the branch only if its expected base still matches. Recheck ownership
  immediately before staging and committing.
- Under exclusive ownership, commit explicit paths with `git commit -m "<message>" -- <paths>`.
  This preserves unrelated staged paths but takes each named file from the working
  tree. It does not preserve partial hunk selection in a mixed file.
- **Never use `git add -A`.** Never use `git add <directory>`. Both commands
  collect the entries that another session staged.
- Run `git status` immediately before any reset.
- Read the proposed full diff immediately before the commit. Preserve unrelated
  staged entries. Stop for overlapping ownership or an uncertain commit scope;
  do not unstage another session's work to empty the index.
- **A blanket `git checkout -- <path>` is a destructive operation** in this
  setting. It discards the uncommitted edit of another session to that file, and
  it gives no warning. Use a targeted edit that changes only the lines that you
  intend to change.

## History rewrites delete sibling commits

A rewrite of unpushed history can move your commits. It can also delete the
commits of another session completely, with no error and no notification.

- **Verify your own commit hashes again** before you cite them. The rebase of
  another session can remove them.
- **Do not use `git rebase --onto` in a live shared tree.** It checks out the
  commit from before the rewrite. During the rebase it removes files from disk
  that other sessions are reading.
- A soft reset moves shared HEAD even though it leaves working files intact.
  Unstaging afterward changes the shared index. Neither action is a safe
  workaround for another writer's ownership.
- `commit-tree` can create an object without changing working files. Moving the
  shared ref still needs coordination and a checked expected base.
- Rewrite history only with explicit authority and exclusive ownership of the
  affected branch and index. Verify that the plan preserves concurrent commits.
  Otherwise retain additive commits or use an authorized isolated workflow.

## Deleting

- **Delete only an explicit removal-target allowlist.** Resolve the authorized
  scope to exact files or owned subtrees. Check ownership and references first.
  Do not delete everything outside a list of files to preserve. An unfamiliar
  file is not permission to remove it.
- Untracked files can belong to another writer, and Git has no recovery copy.
  Do not move or delete them without authority and coordination with their owner.
  Use a reversible quarantine only within that authorized scope.
- **Delete dependents before the item that they depend on.** If you do not, you
  leave broken references.

## The work of other sessions can run as a side effect of your work

Shared tooling contains the behaviour of other people. In one incident, a shared
screenshot script contained a guarded conversion step. Each image capture
started the job of another session without a warning. **If you measure something,
run a private copy** of the tool without their additions.

Sessions also start short-lived processes that can stop in the middle of a call.
**Design for a process that stops halfway.** Make scripts idempotent. Verify that
the write landed on disk. Do not trust the return value.

## Anti-patterns

- `git add -A`, `git add <directory>` or `git reset --hard` in a live tree.
- A blanket `git checkout --` on a file that another person can have edited.
- The assumption that a clean-looking tree means that you work alone.
- A rebase of shared unpushed history.
- Deletion by recognition, or `rm` on untracked binaries.
- A message to another session, or an action for it, without a request for
  permission first.

## Reporting

State which paths you committed. Confirm that unrelated staged entries were preserved. If you
discarded or overwrote anything that was not yours, state it clearly and
immediately. If you do not, the person who lost the work finds the silent
overwrite hours later.
