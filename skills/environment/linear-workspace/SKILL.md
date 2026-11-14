---
name: linear-workspace
description: >
  Neutral template for an environment's Linear conventions (no environment-specific values set):
  team, labels, templates, ticket and PR title style, and the PR-body line that links a PR to
  its issue. Read from create-ticket, create-project, create-pr, and linear-dev-cycle whenever
  they need a workspace-specific value. A private implementation replaces it; install only one.
---

# Linear workspace

*"The developer" and "the agent" are defined in the `roles` skill.*

> **Neutral template.** This is the neutral default of an environment skill. A private
> implementation replaces it with real team, label, status, and title conventions. Install exactly one implementation of
> this skill; do not rely on two skills with the same name overriding each other. See
> **What an implementation must provide** at the end.

No environment-specific values are set. If the repo's CLAUDE.md/AGENTS.md or memories define
them, follow those. Otherwise:

## Team

The team used by the developer's recent issues (`list_issues` with `assignee: "me"`). If that's
ambiguous, ask. Lead and assignee for the developer: Linear's `"me"`.

## Workflow states

The shared skills set issue status by role, never by name:

- **new:** where new tickets and projects start;
- **started:** work has begun;
- **in review:** the PR is up;
- **done:** merged.

No names are recorded for this environment. Look up the team's states with
`list_issue_statuses` and map them by Linear's state type: **new** = `backlog` (or `unstarted`
if the team has no backlog state), **started** and **in review** = `started`, **done** =
`completed`. If a role matches more than one state (e.g. two `started` states, where one is a
review state), or none, ask the developer which one to use. For projects, map the project
statuses the same way.

## Labels

No fixed scheme. Use `list_issue_labels` and apply what fits.

## Templates

Check `list_templates` for the team and apply a match via `template` on create.

## Ticket titles

A short summary of the change. No ticket id, since Linear assigns it.

## PR title

A Conventional Commits line (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `feat!:`)
under ~70 characters, with no ticket id.

## Linking a PR to its issue

Last line of the PR body: `Closes <issue identifier>`, preceded by
`Part of <parent identifier>. ` when the issue has a parent.

## What an implementation must provide

Other skills (`create-ticket`, `create-project`, `create-pr`, `linear-dev-cycle`) read these
sections by name, so an implementation keeps them:

- **Team**: the team to file in, and who leads and is assigned.
- **Workflow states**: the issue and project status for each role (**new**, **started**,
  **in review**, **done**).
- **Labels**: which labels exist and when to apply them.
- **Templates**: whether to apply a Linear template on create.
- **Ticket titles**: the title style for issues.
- **PR title**: the title style for pull requests.
- **Linking a PR to its issue**: the exact last line of the PR body.

An implementation replaces this skill, keeps the same name, and is the only copy installed.
