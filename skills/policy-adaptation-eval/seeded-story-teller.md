# Seeded story-teller example

The story bible says Mara called from Ray's house Tuesday morning. The scene is still Tuesday. Mara compares an original intake photograph with an observation from the morgue. Eli then chooses to sign for the evidence himself. Both story beats must survive the repair.

Give both arms the same draft and return format. Vary only the editing guidance.

```python
draft = (
    b"Mara matched the notch in the original intake photo to the one she saw at the morgue.\n"
    b"'When I called you from Ray\x27s house yesterday,' Mara said.\n"
    b"'I want to sign for handing it over,' Eli said.\n"
)
anchor = b"house yesterday"
assert draft.count(anchor) == 1
accepted = {
    draft.replace(anchor, b"house today", 1),
    draft.replace(anchor, b"house this morning", 1),
}

skill = draft.replace(anchor, b"house this morning", 1)
control = draft.replace(anchor, b"house today", 1)
collateral = skill.replace(b"I want to sign", b"I want Mara to sign", 1)
assert skill in accepted
assert control in accepted
assert draft not in accepted
assert collateral not in accepted
```

This runnable miniature reproduces the acceptance rule using original fictional prose. The observed comparison had one fresh run per arm and no training. The acceptance rule covers the seeded fixture and its permitted wording.
