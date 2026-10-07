---
name: repo-extract
description: Extract a subproject of a parent repo into its own nested git repo. Make a code-only cut, scan for secrets, media and production content BEFORE you stage anything, and make the outer repo gitignore the folder. Use when a subfolder has become a project that needs its own remote and its path cannot move without breaking every script that points at it, when app code is mixed with renders, briefs and client work and you must draw the line before you stage anything, when a folder that will become public was never scanned for credentials, or when a folder that was split out weeks ago has silently stopped inheriting its hooks and audit logging.
---

Turn a subfolder into a standalone nested repo with its own GitHub remote.
Keep the folder path unchanged, so that no script, skill or launch reference breaks.

## Steps

1. **Survey before you do anything else.**
   - In the outer repo, run `git ls-files <dir>`. The result is frequently ZERO. In that case, there is no history to keep and you do not need `rm --cached`.
   - Measure the size of each subdirectory (`Get-ChildItem` recurse + Measure).
   - Make sure that no nested `.git` exists already.
   - Check the repo visibility through `api.github.com/repos/<owner>/<name>`.
     - An unauthenticated 404 means private OR nonexistent. It does not tell you which one.
     - Only an AUTHENTICATED request that returns 200 with `"private": true` proves that the repo exists and is private.
2. **Draw the line.** The repo tracks the ENGINE or app only.
   - OUT: generated media (`outputs/`), reference clips, licensed stock, model weights, `*.blend`, logs and caches.
     - Reference clips are copyrighted. NEVER send them to GitHub.
     - A `*.blend` file can be larger than 100MB, which is the GitHub hard limit.
   - OUT: **production content**. This includes shot plans and their JSON files, storyboards, look bibles, HANDOFF files, client material, and runtime or project state. Creative work product is not app code.
   - IN: servers, pipeline scripts, UIs, workflow builders and convention docs.
     - A script with a production name stays IN if it is really the CLI.
3. **Write `.gitignore` FIRST.** Then scan for secrets before you stage anything. There are two classes of secret. Both scans must give zero hits. If a scan gives a hit, stop.
   - **Plaintext secrets.** Grep the code files for this pattern:
     `(api[_-]?key|secret|token|password|Bearer )\s*[:=]\s*["'][A-Za-z0-9_-]{16,}`
   - **Blob-shaped secrets (encrypted reasoning traces, arXiv 2608.09867).** These carry no plaintext keyword, so they need a separate pass.
     - Run the literal-marker pass over all text files:
     <!-- skills-lint-allow reasoning-trace-marker: the marker IS the thing being taught -->
     `grep -rlnE '"signature"\s*:|redacted_thinking' <dir> --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=outputs --exclude-dir=__pycache__`
     - Run the base64 pass over manifests and transcripts only:
     `grep -rlnE '[A-Za-z0-9+/]{200,}={0,2}' <dir> --include='*.json' --include='*.jsonl' --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=outputs --exclude-dir=__pycache__`
     - The base64 pass finds a contiguous run of 200 or more characters from the base64 character set. A sha512 `integrity` hash gives approximately 88 characters, which is much lower. Thus ordinary lockfile and manifest content does not trigger it.
   - Keep fixtures that prove both arms. One fixture must catch the blob. One fixture must show that ordinary long strings are not flagged.
   - Measured on a project with 41k files: the marker pass takes approximately 14s when `.git`, `node_modules`, `outputs` and `__pycache__` are excluded.
   - Do NOT run either pass without these scopes. An unscoped pass does not finish within 2 minutes, and then it gets skipped.
   - The base64 pass, scoped to `.json` and `.jsonl`, takes less than one second.
4. **Init and verify the scope.**
   - Run `git init -b main`, then run `git add -A`.
   - This is the ONE place where `git add -A` is correct. It is correct only because the repo was created seconds before. There is no other writer, no pre-existing index, and nothing to sweep in. In a fresh repo, the `.gitignore` IS the scope.
   - Everywhere else, `git add -A` is forbidden.
   - Then do a leakage check. Filter `git diff --cached --name-only` against the media and production patterns. List the largest staged files.
   - Expect only code, with sizes in KB, not MB.
5. **Write a README** that gives standalone context. The old README usually assumes sibling projects in the parent repo.
   - Then commit, and run `git remote add origin ...`.
   - Push only after the user gives approval.
   - For multi-line commit messages, use a **Bash heredoc with `git commit -F -`**. A PowerShell pipe adds a UTF-8 BOM to the start of the subject line.

5b. **Connect the agent settings again. Extraction BREAKS inheritance.**
   - When the directory gets its own `.git`, sessions that start inside it stop inheriting the hooks and settings of the parent.
   - Copy your standard per-project agent-settings file into the new repo, and commit it THERE.
   - Then confirm that the settings load.
   - This is the bootstrap case with the highest risk. Three projects extracted this way each ran for weeks with no audit log and no destructive-command guard. Nothing announces the loss. Inheritance simply stops.
6. **Update the outer repo.**
   - Add `<dir>/` to the "Standalone nested repos" block in the outer `.gitignore`.
   - If the directory was tracked, also run `git rm -r --cached <dir>`.
   - Make a scoped commit.
7. **Write the change where sessions look.**
   - Record "commit <dir> changes in the NESTED repo now" in the persistent notes of the project and in its agent instructions.
   - If you do not, every future session will commit to the wrong repo.

## Rules

- Keep the folder name as it is. A path rename is a separate move. If you do both at the same time, you cannot revert either one cleanly.
- If the directory WAS tracked and has history worth keeping, use `git subtree split -P <dir>` instead of a fresh init.
  - First, check the history for media and secrets. After a push, history is permanent.
- If dirty content was already pushed and the repo is young, re-init and force-push.
  - This is destructive. User confirmation is REQUIRED.
  - This is better than carrying the dirty content into a future change of the repo to public.
- On Windows, LF→CRLF warnings on `git add` are noise. Ignore them.
