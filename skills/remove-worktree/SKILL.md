---
name: remove-worktree
description: >
  Safely remove a git worktree the agent created, keeping its branches. Use once the work in a
  worktree is published (e.g. its draft PRs are open) or otherwise finished, so the developer
  can check the branch out in the main workspace.
---

# Remove a worktree

*"The developer" and "the agent" are defined in the `roles` skill.*

A branch still checked out in a worktree can't be checked out anywhere else, and the developer
reviews in the main workspace (e.g. `gh pr checkout`). So a worktree the agent is done with
should go.

**Never remove a worktree the agent didn't create.** Tell the developer and ask.

1. Confirm the worktree is clean (`git -C <path> status --porcelain` prints nothing) and every
   branch in it is pushed and matches its remote. If either check fails, stop and tell the
   developer. Don't discard work.
2. From the repo's main checkout, run `git worktree remove <path>`. Don't use `--force`. Keep
   the branches.
3. Confirm with `git worktree list`.
