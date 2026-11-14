---
name: branch-naming
description: >
  Neutral template for an environment's branch naming convention (no environment-specific
  convention set). Use whenever a branch name is chosen: `git worktree add -b`,
  `git checkout -b`, a new stack layer, or a PR with no branch yet. Other skills reference it
  rather than hardcoding a convention. A private implementation replaces it; install only one.
---

# Branch naming

*"The developer" and "the agent" are defined in the `roles` skill.*

> **Neutral template.** This is the neutral default of an environment skill. A private
> implementation replaces it with real branch naming rules. Install exactly one implementation of
> this skill; do not rely on two skills with the same name overriding each other. See
> **What an implementation must provide** at the end.

No environment-specific convention is set. If the repo's CLAUDE.md/AGENTS.md or memories
define one, follow it. Otherwise:

1. **Tied to a Linear issue:** the issue's Linear `gitBranchName`, unchanged, so Linear's
   GitHub integration links the PR to the issue.
2. **No Linear issue:** `<type>/<short-description>`, where `<type>` is a conventional-commit
   type (`feat`, `fix`, `chore`, …) and the description is short and kebab-case.
3. **Never reuse an issue's identifier for work that isn't that issue's deliverable.** Linear
   auto-links a PR to the issue its branch name matches and can complete that issue when the
   PR merges, whatever the PR contains. Unrelated work gets rule 2's shape.

## What an implementation must provide

Other skills (`create-worktree`, `create-pr`, `linear-dev-cycle`, `sync-stacked-branch`) read
only this: the **branch name format** for each case where a branch is created, namely work tied
to a ticket and work with no ticket, plus any rule on reusing identifiers. An implementation
replaces the rules above, keeps the same skill name, and is the only copy installed.
