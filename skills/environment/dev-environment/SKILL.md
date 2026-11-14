---
name: dev-environment
description: >
  Neutral template for an environment's development defaults (no environment-specific values
  set): build, lint, and test commands, worktree location and dependency bootstrap, commit
  conventions, review tooling, and known quirks. Read from linear-dev-cycle, create-worktree,
  verify, create-pr, self-review, and pr-review-feedback whenever they need a command or an
  environment-specific rule. A private implementation replaces it; install only one.
---

# Development environment

*"The developer" and "the agent" are defined in the `roles` skill.*

> **Neutral template.** This is the neutral default of an environment skill. A private
> implementation replaces it with real commands and rules. Install exactly one implementation of
> this skill; do not rely on two skills with the same name overriding each other. See
> **What an implementation must provide** at the end.

No environment-specific values are set. The repo's CLAUDE.md/AGENTS.md, memories, and
`package.json` scripts decide. Where they don't:

## Commands

| Step | Command |
|---|---|
| Type check (TypeScript only) | `typecheck` script, else `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Tests | `npm test` |
| Build | `npm run build`, if the package has one |

## Worktrees

- **Location:** `<repo>/.worktrees/<branch-name>`. Add `.worktrees/` to `.gitignore` if it
  isn't already there.
- **Dependencies:** `npm ci` in the new worktree when it needs its own `node_modules`.

## Commits

- Conventional Commits (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `chore:`,
  `feat!:`), with a body that explains *why* when it isn't obvious.
- Add whatever attribution trailer this session's system prompt specifies.

## Releases and merging

No release tooling is assumed. Check the repo's CI workflows before claiming a merge
produces a release.

## Review

No reviewer bot is recorded. Ask the developer which reviewer to wait for before watching a PR.

## What an implementation must provide

Other skills (`verify`, `self-review`, `linear-dev-cycle`, `create-worktree`, `create-pr`,
`sync-stacked-branch`, `pr-review-feedback`) read these sections, so an implementation keeps
them:

- **Commands**: type check, lint, test, and build.
- **Worktrees**: location and dependency bootstrap.
- **Commits**: commit conventions and any trailer rules.
- **Releases and merging**: whether a merge produces a release, and how to confirm it.
- **Review**: the reviewer bot's login, if any, and how to re-request its review.
- **Known setup and quirks**: environment variables, service hosts, or workarounds that
  `verify` applies before treating a failure as a real one, and how to consolidate diverged
  branches.

An implementation replaces this skill, keeps the same name, and is the only copy installed.
