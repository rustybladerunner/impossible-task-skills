---
name: handoff
description: Compatibility entry for the checkpoint workflow when you hand work to another session or stop. Save the verified state, the unfinished acceptance criteria and the next action. Do not turn a checkpoint into a completion. Use when you hand work to another session or stop. For both save and fresh-session resume, use the checkpoint workflow.
---

# Handoff

If a checkpoint skill is installed, use it for the combined save-and-recover workflow.
This name stays available for existing callers.
This name means the save-and-transfer side of the workflow.
It does not declare that unfinished work is complete.

If no checkpoint skill is installed, keep the same essential behavior:

1. Update the existing current resume record. Do not create a second record.
2. Put these items in the record:
   - the objective
   - the pending user requests
   - the actual working copy and its dirty files
   - the verified checks, separate from the missing proof
   - the worker ownership
   - the limits and approvals
   - one next action
3. Read the record back before you report the transfer.
4. Keep durable, non-obvious lessons in the existing memory store. Do not duplicate the task record there.

Report the work as complete only when the acceptance criteria are actually met.
If they are not met, state the real intermediate state or stopped state.
Never start an execution kickoff as a side effect of a handoff or a resume.
