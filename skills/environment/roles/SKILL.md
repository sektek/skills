---
name: roles
description: >
  Defines the two roles every skill in this collection uses: "the developer" (the human
  directing the work) and "the agent" (Claude, carrying it out). No names, no pronouns. Read
  before writing or editing any skill in this collection; other skills reference these terms
  rather than redefining them.
---

# Roles

A fixed vocabulary used in place of names or pronouns, so a skill reads the same no matter
which account, environment, or person runs it.

- **The developer:** the human operating Claude Code, whose branches, commits, PRs, and
  tickets these skills act on. Never substitute a name or a pronoun, even when the person's
  identity is known from context.
- **The agent:** Claude, reading and executing the skill. Instructions are addressed to the
  agent, usually as plain imperatives ("run the tests", "open the PR"). Use "the agent" when
  the role needs naming explicitly; don't write "I" or "Claude".

## Why fixed terms

These skills are shared across accounts, environments, and projects. A different developer or
a fresh agent session may pick a skill up with none of the current context, so no skill should
bake in one person's name or assume a pronoun. Nothing outside this file binds who "the developer" is.

## Environment-specific skills

The three skills below are neutral templates. A private implementation supplies the real
conventions, and an install selects exactly one implementation of each, so two copies of the
same skill are never present together. The `roles` skill itself is shared vocabulary, not a
template: install one copy and keep it neutral.

Generic skills never hardcode an environment's conventions. They defer to these skills, which
each environment supplies its own version of:

- `branch-naming`: the branch name format.
- `linear-workspace`: the Linear team, labels, title style, and how PRs link to tickets.
- `dev-environment`: default commands, worktree location, dependency bootstrap, commit
  conventions, and environment quirks.

To change a convention for one environment, change that environment's version of the skill.
Don't edit the generic skills.

## Extending this vocabulary

If a skill needs a third party that doesn't fit either role (an automated reviewer, CI,
another person's role), add the term here instead of inventing one-off phrasing.
