---
name: intercept
description: Stop a third attempt at the same fix. Commit to one attack from a closed menu, with a falsifier. Use when a fix failed two times. Use when two plausible attacks exist and nothing decides between them. Use when attempts are started and dropped. Use when the task as written rests on a premise that the code contradicts.
---

# Intercept

Lens edition of `five-ways`. `five-ways` is the full version.

Adapted from Bruce Lee's Five Ways of Attack.

A default approach exists, whether you choose it or not: edit the code, run it, and look. That default is one way. For a problem that already survived the default, it is usually the worst way.

## Use

- The second direct fix failed, and the third idea is a variant of the first.
- You have two real attacks, and you are about to try both at the same time.
- The backlog item describes a system that the code does not contain. The correction replaces the task.

## The move

0. Run `whose-move`. If the obstacle is not yours, stop. A named block is a finished outcome.
1. Write one line for each of these: what you measured, what you already tried, and what the failure looks like from the outside. If you have no measurement, your first move is to get one. If a metric is constant or absent, the instrument is broken.
2. Name one code from the menu below. Name only one.
3. Write: `Way: <code>. I expect <observable>. If I see <X>, this way is wrong and I switch to <other>.`
4. Execute that way fully. Use the matching lens skill. Do not switch because the way feels slow.

## Menu, short

- **SAA**: change the input. Use different data, seed, file, order, or resolution.
- **HIA**: freeze the parts that move. Pin versions, snapshot state, and remove concurrency.
- **PIA**: use one cheap probe that limits the answer before you pay for the full attempt.
- **ABC**: use a chain of stages that you already understand. The output of each stage goes into the next stage.
- **ABD**: make it fail on purpose. Use known-bad input. If you built the check, this way is mandatory.

## Do not

- Do not combine codes in one attempt.
- Do not produce a document. The line from step 3 is the artifact.
- Do not treat the menu as a fixed law. If the problem needs a sixth way, name it. Then say why the five ways did not apply.
