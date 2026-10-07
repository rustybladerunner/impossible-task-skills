---
name: silent-no-ops
description: Stop scripted automation that reports success while it changes nothing. Choose the execution transport before you write the script, then verify the artifact on disk. Do not trust a return value. Use when you drive an application, editor, or content tool over a socket, plugin, headless mode, or CLI; when a script "ran fine" but the file that it should have written is unchanged; when a screenshot or capture continues to return the image from the previous run, or an exported file is byte-identical after you changed the input; or when the same job exists twice because someone wrote it for the wrong transport.
---

# Operations that succeed and change nothing

Two failure modes are the most frequent in application automation. Both waste much more
time than the work itself.

The first failure mode is a script written for the wrong **transport** and then written
again. The result is two copies of the same job. Each copy has a comment that asks future
maintainers to keep the two copies in sync.

The second failure mode is an operation that **returns success and writes nothing**.

**Decide the transport first. Verify the write second. Both steps are mandatory.**

## Choosing a transport

Most applications have several entry points. The entry points are not interchangeable:

| You need to… | Usually wants |
|---|---|
| Batch-edit files with the app closed | headless / commandline mode |
| Change live scene or document state, capture views | a full running instance |
| Act on the instance a human already has open | its plugin, socket, or RPC bridge |
| Explore once, throwaway | the app's own script console |

**The deciding question is: does a live instance own the file handle?**

A headless process usually *cannot* write a file that the running application has open.
The headless process will frequently report success while the bytes do not land. This one
fact is the reason that duplicate scripts multiply. Someone writes the headless version.
The headless version fails silently when the app is open. Then someone writes a second
version and does not diagnose the cause.

Thus, ask this first: is the application open now? If yes, use its live bridge. If no,
use headless mode, because it is faster and easier to script.

## A constrained sandbox is a different language from the one you know

A plugin or RPC sandbox often looks like the host language, but it is different:

- The sandbox can **reject** the obvious import. Then every operation must go through an
  orchestration call. This constraint alone can force the dual-script split above.
- The list of importable modules can be very short.
- Familiar methods can have **different signatures**. For example, a default argument
  can be missing, or a parameter can require a pre-encoded string instead of a native
  object. If you pass the native object, the method frequently **returns false silently**
  and does not raise an error.
- Some capabilities are absent. Find out which capabilities are absent before you design
  around them.

Before you write code against the bridge, read the bridge's own documentation for its
constraints. If the transport is stateful, open a new session for each call.

## The catalogue of silent failures

Each pattern below reports success and changes nothing. These patterns occur in very
different applications because they have one cause in common. The API records an *intent*,
and a different layer overrides that intent or never flushes it.

**Saving**
- A property setter does not mark the containing file dirty, so the next save is a
  legitimate no-op. Force the write, then read the value back.
- A property of a container type takes effect only when you assign the **whole
  collection** again. A change in place has no effect.
- A save call returns true for a path that it does not actually handle. Check the
  modification time of the file on disk.
- **A per-instance override wins over the shared default.** You changed the asset, but
  the object on screen has its own override and does not change.

**Capturing**
- Some screenshot facilities allow **one capture per session** and refuse to overwrite it.
  When you run them again, they silently give you the previous image.
- Some capture objects must be posed again for each view. If you move one between shots,
  you get byte-identical output.
- Some buffer formats default to a high dynamic range. They write bytes that no ordinary
  viewer can decode. The result is a file that exists but that you cannot use.

## The rule that covers all of them

**Verify the artifact. Do not verify the call.** A return value describes the call. Check
the thing that you meant to change:

- Confirm that the file exists and that its modification time is *after* your run.
- Read the property again from a newly loaded copy. Do not read it from your in-memory
  handle.
- For images, open the file. A capture that is the wrong size, all black, or identical to
  the last capture is a failure. The exit code will never report it.

When a run produces nothing, **confirm that the tool you called exists** before you
conclude that the operation is broken. If a binary is missing and stderr is redirected to
null, the run looks exactly like a clean, empty pass.
