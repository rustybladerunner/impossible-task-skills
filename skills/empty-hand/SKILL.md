---
name: empty-hand
description: Catch an operation that reports success and changes nothing. Use when you drive an application, editor, or content tool over a socket, plugin, headless mode, or CLI; when a script ran without error and the file that it should have written is unchanged; when a capture continues to return the previous image; or when the same job exists twice because someone wrote it for the wrong transport.
---

# Empty hand

Lens edition of `silent-no-ops`. `silent-no-ops` is the full version.

In `five-ways` terms, this lens is ABD aimed at your own automation. Provoke the path and see whether bytes changed.

## Use

- A script exited 0, and the timestamp of the target file did not change.
- An export is byte-identical after the input changed.
- A screenshot is the image from the previous run.
- You are about to write a second script because the first script "doesn't work when the app is open."

## The move

1. Choose the transport before you write the script. If a live instance owns the file handle, a headless process will often report success and write nothing. While the app is open, use the live bridge. Use headless mode only when the app is closed.
2. Do the operation one time.
3. Verify the artifact on disk. Compare the bytes, the size, or a hash with the previous artifact. A return code is not evidence of a write.
4. If nothing changed, that is the result. Diagnose the transport. Do not make a second copy of the job.

## Do not

- Do not trust a plugin response that says saved.
- Do not keep two scripts in sync with a comment. Use one transport and one script.
- Do not use `catch-it` until you can make the empty write happen on demand. The reproduction is the purpose.
