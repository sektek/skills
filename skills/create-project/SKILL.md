---
name: create-project
description: >
  Create a Linear project for a larger piece of work: a design description, numbered
  milestones, and single-task tickets (no sub-issues, written with `create-ticket`) where
  every ticket in a milestone can be worked in parallel. Use when asked to create, plan, or
  set up a Linear project, or when work is too big for a few tickets and the developer wants
  it handed off across several agents/PRs.
---

# Create a Linear project

## Required skills

This skill uses other skills by name: `roles`, `linear-workspace`, `create-ticket`, `linear-dev-cycle`.
**Before relying on one, check that it is available. If a required skill is missing, stop and ask the developer to install it or say how to proceed; do not guess its contents or substitute your own rules.**

*"The developer" and "the agent" are defined in the `roles` skill.*

Workspace-specific values (team, labels, templates) come from the `linear-workspace` skill.
When the project's CLAUDE.md/AGENTS.md or memories say otherwise, follow the project.

Argument: what the project is about. Often it's a design discussed in the current
conversation, in which case use that context.

Projects are worked on later, often by several agents in fresh sessions with none of this
conversation's context. The project description carries the shared background, and each
ticket has to stand on its own with it. Each ticket is picked up with the `linear-dev-cycle`
skill.

**Tickets are the `create-ticket` skill's job.** This skill owns the project, its description,
and its milestones. Every rule about how tickets are split, titled, described, filled in, and
created comes from `create-ticket`, used in its **project mode**: single issues only, no
sub-issues. Don't restate or override those rules here.

If the work fits in one or two PRs, use the `create-ticket` skill in standalone mode instead
and tell the developer why.

## 1. Gather

1. Load the Linear tools with ToolSearch if they aren't loaded yet.
2. Work out the team (per `linear-workspace`) and the labels (`list_issue_labels`). These are
   passed to `create-ticket`.
3. Check `list_templates` for the team (`type: "project"`). If one matches, use its structure
   and apply it via `template` on create.
4. Search for existing projects and issues that overlap (`list_projects`, `list_issues` with
   `query`). Link related work, and ask the developer whether overlapping issues should be
   absorbed into this project.
5. Read the code the project concerns. Record what already exists and what doesn't, verified
   against the current default branch rather than assumed from docs or Linear status. When
   Linear and the code disagree (e.g. an issue marked done whose change isn't in the code),
   say so in the description.
6. Settle open design questions with the developer before drafting tickets. Each decision the
   tickets depend on goes in the description.

## 2. Draft the tickets

Use the `create-ticket` skill in project mode to split the work and draft every ticket (its
sections 2 and 3), giving it the team, labels, and the project's name. Every ticket is a
single task: one PR, in one repo, with no sub-issues. Don't create anything yet.

The drafts' `blockedBy` relations and Scope file lists are what the milestones are built from.

## 3. Arrange milestones

A milestone is a set of tickets that can **all be worked in parallel**. It is not a
sequential "phase". Every milestone must satisfy both rules:

1. **No dependencies inside the milestone.** No ticket is blocked by another ticket in the
   same milestone.
2. **No overlapping edits inside the milestone,** as `create-ticket` defines them (additive
   edits to a shared file are allowed; changes to the same existing code are not). Check the
   files listed in each ticket's Scope. If two tickets would overlap, make one blocked by the
   other so it moves to a later milestone, or give the shared edit to a single ticket.

Arrange them:

- Put each ticket in the **earliest** milestone its blockers allow: one milestone after its
  latest blocker.
- Tickets keep their exact `blockedBy` relations, even when the milestone order already
  implies them.
- **Merge-together stacks:** the upper ticket is blocked by the lower one, so it lands in a
  later milestone. The lower ticket's PR stays open until the upper one is ready, so its
  milestone isn't done until then either.
- **Across repos:** the release → dependency bump → consumer chain from `create-ticket` puts
  each step in a later milestone than the one before.
- Typical shape: new components first, then wiring, then consumers, then wrap-up.
- The **last milestone is `wrap-up`**: CLAUDE.md and README updates, and end-to-end
  verification of the whole project. Only wrap-up tickets touch project-wide docs, and each is
  blocked by everything it documents or verifies. Draft these with `create-ticket` too.
- Name milestones `N. <what it delivers>`, numbered from `0`. Each description is one or two
  sentences saying what the milestone delivers.

Bugs found while working the project that are outside the finding ticket's scope go into a
`follow-up` milestone, created when the first one is found. Don't create it up front.

### Milestone ordering gotchas

- Linear orders milestones by creation order, and `save_milestone` has no `sortOrder` param,
  so a milestone can't be repositioned later. **Create them in execution order.** The `N.`
  prefix keeps the order readable if someone reorders them by hand.
- To insert a step between two existing milestones mid-project, don't create a new
  milestone: it would render after all of them regardless of its number. Fold the step into
  the nearest existing milestone and rename or re-describe it to cover both.

## 4. Write the project

- **Name:** short and specific, e.g. `parser — error recovery policy`.
  It appears in project identifiers and cross-references, so get it right up front rather than
  renaming after tickets and PRs link to it.
- **Summary:** one line, at most 255 characters. Fill it separately; don't rely on it being
  truncated from the description.
- **Lead:** the developer (Linear's `"me"`).
- **Status:** the **new** project status (per `linear-workspace`'s workflow states) unless the
  developer says otherwise.
- **Description:** Markdown with literal newlines. Use this template (or a matching Linear
  template that opens with an equivalent overview), dropping any section that doesn't apply.

```markdown
## Overview

At most 3 sentences: what problem this project solves and how.

## Context

Why this exists, how it came up, and the current behaviour, with file/symbol references. Link
related issues and projects.

## What's already built

What exists today, verified against the current default branch, with file/symbol references.
Gaps found, and any mismatch between Linear and the code.

## Decisions

Numbered decisions the tickets depend on, each with its rationale. Include the key types and
signatures when the tickets must agree on them.

## Deliberately deferred

What's out of scope for this project, and why.

## Repos involved

Each repo/package, and what this project changes in it.

## Related, but distinct

Nearby projects or issues, and how this project differs from them.
```

## 5. Confirm and create

**Checkpoint:** this is the only approval for the project and all its tickets
(`create-ticket` skips its own checkpoint in project mode). Before creating anything, show the
developer:

1. the project's name, summary, and full description;
2. the milestones in order, each with its description, followed by its tickets, each with its
   title, one-line summary, repo, and what it's blocked by;
3. a check of the milestone rules: for each milestone, confirm that no ticket is blocked by a
   sibling and no two tickets make overlapping edits, or list the violations. List the shared
   files with additive edits separately, so the developer can see where rebases are expected.

Show full ticket descriptions only if the developer asks.

Once the developer approves:

1. Create the project (`save_project` without `id`, with the team via `addTeams`, plus
   `leadTeam` when `linear-workspace` calls for it).
2. Create the milestones, in order (`save_milestone`).
3. Create the tickets with the `create-ticket` skill in project mode (its section 4), giving it
   the project's link and each ticket's milestone.
4. To bring existing issues into the project, set `project` on them with `save_issue`. Issues
   can't be attached from the project side.

Reply with the project link, then each milestone with its tickets' identifiers and titles.

Edits to the project, a milestone, or its issues later follow `create-ticket`'s patching
rules.
