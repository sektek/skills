---
name: create-worktree
description: >
  Set up a git worktree for work that needs its own branch: new work, a stack, continuing an
  open PR, or stacking a follow-up on one. Use whenever work is about to
  start on a new branch; never `git checkout -b` in the main checkout for feature work.
---

# Create a worktree

*"The developer" and "the agent" are defined in the `roles` skill.*

*Environment skills: this skill defers to `branch-naming`, `dev-environment` for environment-specific values (commands, naming, conventions) and does not hardcode them. If one of them is not available, stop and ask the developer for the value instead of guessing.*

## Why a worktree

Never create or switch branches in the main checkout for the agent's own work: no
`git checkout -b`, no `git switch -c`, and no checking out a branch there to work on it. All
of the agent's branch work happens in a worktree, however small the change. There are no
"quick fix" exceptions.

The main checkout belongs to the developer, who uses it to check out existing branches for PR
review (e.g. `gh pr checkout <N>`). When the developer asks the agent to check out a PR branch
there for review, do it: that's reviewing, not working. Don't commit on it; any changes that
come out of the review go in a worktree.

## Location, branch name, and dependencies

- **Location:** per the `dev-environment` skill.
- **Branch name:** per the `branch-naming` skill.
- **Dependencies:** install them per `dev-environment` if the worktree needs its own
  `node_modules`. Install only what the lockfile already pins (e.g. `npm ci`). Never run a
  command that adds or upgrades a package. **NEVER automatically install a new dependency.
  Dependencies must be approved.**

`<default-branch>` below is the repo's default branch
(`git symbolic-ref --short refs/remotes/origin/HEAD`, minus `origin/`).

## Creating one

Run `git fetch origin` first. Then:

- **New work:** `git worktree add -b <branch> <path> origin/<default-branch>`.
- **A stack:** `git worktree add --detach <path> origin/<default-branch>`, then start the stack
  inside it with the `gh-stack` skill.
- **Continuing an open PR:** `git worktree add <path> <existing-branch>`. Don't switch the main
  checkout onto it.
- **Stacking a follow-up on an open PR:** when the new work builds on an open PR but can be
  reviewed on its own, branch a *new* worktree off that PR's branch rather than adding commits
  to it: `git worktree add -b <branch> <path> <existing-pr-branch>`. The PR from it targets
  `--base <existing-pr-branch>`, or use the `gh-stack` skill.

If git refuses because the developer has the branch checked out in the main workspace, ask
them to switch away. Never work in the developer's checkout.

## Existing branches

- **The branch of one of the developer's open PRs** (review fixes, continuing that PR): work on
  it directly, adding new commits. Don't rewrite its history except to rebase it (see
  `sync-stacked-branch`).
- **Any other existing branch** (usually the developer experimenting: an earlier attempt, a
  spike, leftover WIP): read it for reference if it's relevant, but never use it directly.
  Don't check it out to build on, commit to, rebase, merge, squash, or cherry-pick from it.
  Start the ticket's own branch per `branch-naming` and write the work there. Leave the old
  branch exactly as it is.
