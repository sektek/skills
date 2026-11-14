---
name: verify
description: Run type check, lint, and tests before committing
---

*"The developer" and "the agent" are defined in the `roles` skill.*

*Environment skills: this skill defers to `dev-environment` for environment-specific values (commands, naming, conventions) and does not hardcode them. If one of them is not available, stop and ask the developer for the value instead of guessing.*

Run the three-step pre-commit verification for the current package in order, stopping and
reporting if any step fails. Check `package.json` scripts first and prefer the project's own
scripts over ad-hoc commands. Where the project doesn't settle it, use the commands and quirks
in the `dev-environment` skill.

1. **Type check (TypeScript only):** a `typecheck` script if one exists, otherwise the
   `dev-environment` fallback. Skip this step for a JavaScript project: JSDoc types aren't
   verified.
2. **Lint:** the `dev-environment` lint command.
3. **Tests:** the `dev-environment` test command.

## When a step fails

**Environment problem or code problem?** First check whether the failure is about the
environment rather than the code: a service that can't be reached, missing credentials, or
missing infrastructure. Signs: connection refused or timeout errors, auth errors, "command not
found".

- **First, apply the known setup in `dev-environment`** (e.g. service hosts or environment
  variables it lists). An environment error on a check that `dev-environment` explains how to
  run means the setup wasn't applied, not that the check can't run.
- **Only if it still can't run:** it's **not run**, not failed. Don't change code to get
  around it, and don't invent environment changes beyond what `dev-environment` describes.
  Record it as not run, with the reason, and continue with the remaining steps. The PR's
  Testing section lists it as `not run: <reason>`, so CI is its first real run. Add it to the
  follow-up list so the missing setup can be added to `dev-environment` and the check runs
  next time.

Otherwise, check whether the change caused it before fixing anything: run the same check on
the default branch (or the stack base) in a temporary detached worktree
(`git worktree add --detach <tmp-path> origin/<base>`), then remove that worktree.

- **Passes on the base:** the change caused it. Show the relevant output and stop; don't
  proceed to later steps until it's fixed.
- **Fails on the base too (pre-existing):** don't fix it on this branch. Record it as
  pre-existing, with the failing test or error, and continue with the remaining steps. Add it
  to the follow-up list so the developer can decide on a ticket. If it prevents verifying the
  change at all (e.g. the build or type check fails outright), stop and report.

Never report a pre-existing failure or a check that didn't run as passing. The PR's Testing
section lists a pre-existing failure as failing before this change, and a check that didn't
run as `not run: <reason>`.

## Report

The outcome of each step: passed, failed (caused by the change), failed (pre-existing), or not
run (with the reason). If nothing failed because of the change, confirm it's ready to commit.
