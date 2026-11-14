---
name: sync-stacked-branch
description: >
  Bring a stacked branch (or any branch whose base moved) up to date with its base: the
  `gh-stack` sync for a native stack, `git rebase` otherwise, and a manual cherry-pick
  sequence when rebase fails with "local changes would be overwritten" on a clean tree. Use
  when a PR's base branch gets new commits, after a lower layer of a stack merges, or when a
  rebase misbehaves in a worktree.
---

# Sync a stacked branch

*"The developer" and "the agent" are defined in the `roles` skill.*

*Environment skills: this skill defers to `branch-naming`, `dev-environment` for environment-specific values (commands, naming, conventions) and does not hardcode them. If one of them is not available, stop and ask the developer for the value instead of guessing.*

For a branch stacked on another PR's branch, or one whose base moved, when the base gets new
commits.

This replays one branch's *own* commits onto its updated base. It isn't for consolidating
several diverged branches into one; follow the `dev-environment` skill for that.

## 1. Native stack: use `gh-stack`

If the branch is part of a `gh stack`, sync it with the `gh-stack` skill (rebase the layers onto
the updated base and prune merged ones). Only fall through to the steps below if that fails.

## 2. Otherwise: rebase

```sh
git fetch origin
git rebase origin/<base>
```

Resolve real conflicts normally, then re-run the `verify` skill.

## 3. Fallback: cherry-pick onto the new base

In sandboxed worktrees, the rebase sequencer has repeatedly failed at random with
`error: Your local changes to the following files would be overwritten by merge` on a clean
working tree, on commits with no textual conflict at all. **If `git rebase` fails with that
message on a clean tree, don't keep retrying it.** Switch to this sequence immediately:

```sh
git checkout -b <tmp> origin/<new-base>
git cherry-pick <sha1> <sha2> ...   # the branch's own unique commits, in order
git branch -f <branch> <tmp>
git checkout <branch>
git branch -D <tmp>
```

Find the branch's own commits with `git log --reverse --format=%H origin/<old-base>..<branch>`.

## 4. Verify and push

Re-run the `verify` skill, then:

```sh
git push --force-with-lease origin <branch>
```

Re-pushing the agent's own branch after a rebase is routine and needs no confirmation. Always
use `--force-with-lease`, never plain `--force`. Force-pushing a branch the agent didn't create
still needs the developer's approval.

## Related skills

- `gh-stack`: native stack sync, the first choice.
- `dev-environment`: how to consolidate diverged branches, which is a different operation.
- `branch-naming`: if the branch has to be recreated from scratch instead of synced.
