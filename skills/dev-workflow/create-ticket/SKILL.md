---
name: create-ticket
description: >
  Create well-formed Linear issues (one issue per PR; a parent with ordered sub-issues when the
  work takes more than one PR), with context, scope, and verification criteria so they can be
  picked up cold by the developer or an agent. The authority on how tickets are split,
  written, created, and patched, including for `create-project`. Use when asked to file, open,
  create, or write up a Linear ticket/issue, to break work into tickets, to log out-of-scope
  work found mid-ticket, or to edit an existing issue's description.
---

# Create Linear ticket(s)

## Required skills

This skill uses other skills by name: `roles`, `linear-workspace`, `create-project`, `linear-dev-cycle`, `gh-stack`.
`gh-stack` is needed only when stacking or merging stacked PRs is discussed.
**Before relying on one, check that it is available. If a required skill is missing, stop and ask the developer to install it or say how to proceed; do not guess its contents or substitute your own rules.**

*"The developer" and "the agent" are defined in the `roles` skill.*

Workspace-specific values (team, labels, templates, title style) come from the
`linear-workspace` skill. When the project's CLAUDE.md/AGENTS.md or memories say otherwise,
follow the project.

This skill is the single authority on how tickets are split, titled, described, filled in,
created, and patched. Other skills (e.g. `create-project`, `linear-dev-cycle`) use it rather
than defining their own rules.

Tickets get picked up later, often by an agent in a fresh session with none of this
conversation's context, so each one has to stand on its own. The `linear-dev-cycle` skill uses
them as its source of truth: Scope drives the plan, and Verification drives the tests and
acceptance.

## Modes

- **Standalone** (default): the developer asks for tickets directly. The argument is what the
  ticket is about. Often it's something from the current conversation ("file #3 as a
  ticket"), in which case use that context. Every section below applies.
- **Project mode:** the `create-project` skill uses this skill to draft and create a project's
  tickets. It provides the team, labels, the project (its name and, once created, its link),
  and each ticket's milestone. In project mode:
  - Skip section 1 (Gather), since `create-project` has already done it.
  - Every ticket is a **single issue**: no parents, no sub-issues. Work that would otherwise
    be a parent with sub-issues becomes separate single issues, ordered with `blockedBy`.
  - Use the project-mode variant of the single-issue description (section 3).
  - Skip the checkpoint in section 4. `create-project` shows the developer the whole project,
    milestones, and tickets in one checkpoint, then asks this skill to create the tickets.

## 1. Gather

1. Load the Linear tools with ToolSearch if they aren't loaded yet.
2. Work out the team (per `linear-workspace`), the project and milestone (`list_projects`, or
   ask the developer if none fits), and the labels (`list_issue_labels`).
3. Check `list_templates` for the team (`type: "issue"`). If one matches, use its structure
   and apply it via `template` on create instead of writing freeform.
4. Search for duplicates or closely related issues (`list_issues` with `query`) and link to
   them rather than creating a duplicate.
5. Read the code the ticket concerns, so file paths, symbols, and current behaviour are
   accurate and not guessed.

## 2. Split

### Shape

Every PR maps to exactly one issue.

- **Single issue:** the work is one PR in one repo. Create one issue with no sub-issues. This
  is always the shape in project mode.
- **Parent with sub-issues** (standalone only): the work takes more than one PR. The parent
  describes the whole change and gets no PR of its own. The work is divided into sub-issues
  (`parentId`), each of which becomes its own branch and PR.

For something bigger than a few parents, suggest a Linear project instead, created with the
`create-project` skill (single-task tickets arranged into parallel milestones). Confirm with
the developer before going that route.

### Smallest unit

**Aim for the smallest unit of work per PR that can be safely merged.** Every PR represents a
single piece of code, and every PR has its own ticket. Small PRs are a standing goal of the
developer's. When a small piece depends on another unmerged piece in the same repo, stack
their PRs (see "Ordering and parallel work") rather than combining them.

**Why:** three reasons, and they should decide borderline cases.

1. **Parallel development:** small, independent tickets let several agents work at the same
   time without waiting on or colliding with each other.
2. **Less review for the developer:** the developer reviews every PR. A small PR with one
   concern is fast to review and easy to approve or reject; a large or mixed one costs far
   more attention per change.
3. **Focused peer review:** when a PR needs peer review, a reviewer can give one component
   their full attention and useful feedback quickly. A PR that mixes several components gets
   skimmed.

Make each ticket (a single issue or a sub-issue) the smallest unit of work that still:

- does one thing: **one component, or one piece of wiring**,
- leaves the repo building, linting, and passing tests on its own, and
- can be verified, reviewed, and merged on its own,

except for merge-together stacks (below).

Keep these in separate tickets, never combined:

- **Each new component** (a type, interface, class, or function, with its own tests) vs
  **every other new component.** Two components never share a ticket, even when they're small
  or will only ever be used together.
- **Creating** components vs **wiring** them into existing code or into each other. The
  wiring ticket is blocked by the component tickets it uses.
- Refactoring existing code vs changing its behaviour.
- A dependency bump vs code that uses the new version.
- Docs (README, CLAUDE.md) vs code changes.

**Example:** a new report pipeline needs a loader to retrieve some data, a formatter that
calls the loader to enrich each row, a filter, and a grouper. That's five tickets and five
PRs:

1. the loader;
2. the formatter, blocked by the loader (it calls it);
3. the filter;
4. the grouper;
5. the pipeline that wires them together, blocked by all four.

Tickets 1, 3, and 4 can run in parallel. Ticket 2 stacks on ticket 1 (same repo).

A quick test: if a ticket's Overview needs "and" to describe what it builds, it's probably two
tickets. When unsure whether to split, split if it makes either PR easier to review or lets
work run in parallel. Don't split if the pieces couldn't be reviewed without each other.

### Pieces that can't exist without each other

Hopefully rare: if merging either piece on its own would break the build, the pieces must not
become independently mergeable tickets. Handle it in this order of preference:

1. **Merge-together stack:** keep the pieces as separate tickets, so each PR stays small to
   review, but stack the dependent one on the other (same repo, `blockedBy` the lower one).
   Mark both with a `Merge together with <other>` line in Scope. They're reviewed as separate
   PRs and merged as one with the `gh-stack` skill's all-or-nothing stack merge, so the
   default branch never sees the broken intermediate state. The lower ticket alone doesn't
   have to build; the top of the stack does.
2. **One ticket:** only when stacking isn't possible (e.g. the pieces are in different
   repos). Keep the pieces in one ticket and say why in its Scope.

### Ordering and parallel work

- Record every dependency as an exact `blockedBy` relation to the specific tickets it needs.
  Prose alone isn't enough. Tickets with no dependency on each other stay unblocked relative
  to each other, so they can run in parallel.
- **Overlapping edits:** tickets that can run in parallel must not change the same existing
  code. Each ticket's Scope lists every file it touches, which is how this is checked.
  - **Allowed:** additive, order-independent edits to the same file, such as each ticket
    appending its own export to the package barrel (`src/index.ts`) or adding its own entry to
    a list or registry. These can conflict textually when the second PR lands, but resolving
    them means keeping both sides. Each such ticket's Scope names the shared file and says the
    edit is additive.
  - **Not allowed:** two parallel tickets modifying the same existing lines, function, or
    type, or both editing `package.json` dependencies, lockfiles, or project-wide docs
    (README, CLAUDE.md). Make one ticket blocked by the other, or give the shared edit to a
    single ticket.
- **Stacking:** a ticket that builds on an unmerged ticket in the same repo is stacked on it
  (GitHub stacked PRs, via the `gh-stack` skill).
- **Across repos:** a ticket can't stack on work in a different repo. A ticket that uses
  another repo's change needs that change merged *and released*. Put the dependency bump in
  its own ticket, blocked by the release, and make the tickets that use the new version
  blocked by the bump. A parent can span repos, but each single issue and sub-issue targets
  exactly one.

## 3. Write

### Titles

Follow the `linear-workspace` skill's title rule. Where titles are conventional commits:

- **Single issue and sub-issue:** the title becomes the PR title and the squash commit, so its
  type drives the release. Match it to the change.
- **Parent:** produces no commit. Its type describes the overall change: use the most
  significant type among its sub-issues, in the order `feat!`/`fix!` > `feat` > `fix` >
  anything else. For a parent spanning several packages, drop the scope or use the main one.

### Single-issue description

Overview is always required. Drop any other section that doesn't apply. A matching template's
structure replaces this one, as long as it opens with an equivalent summary.

```markdown
## Overview

At most 3 sentences: what problem this solves and how it's expected to be solved. Someone who
reads only this should know what the ticket is for.

## Repo / base branch

`<org>/<repo>`, branch off the current default branch, or stacked on <ticket> when it builds
on that unmerged ticket.

## Blocked by

<tickets that must merge first, and "and released" for a cross-repo dependency>

## Context

Why this exists: the problem, how it was found, and the current behaviour with file/symbol
references. Link related issues, PRs, and the project. Say explicitly what is *not* broken, if
that affects the scope.

## Scope

* Every file this ticket modifies or creates, and the symbols in each.
* Tests to add or update.
* New or upgraded dependencies: <package@version>, pending the developer's approval.
* Shared files: <file> (additive: <what's appended>), when a ticket that can run in parallel
  also appends to it.
* Merge together with <ticket>, for a merge-together stack.
* Out of scope: <anything a reader might reasonably assume is included, and what other tickets
  handle instead>.

## Verification

* How to confirm this ticket alone is done: commands to run and expected results, plus
  behaviours the tests must cover.
```

**Rewrites and refactors** (more than a small parameter change): don't describe the approach
only in prose. Paste the current implementation, write the proposed replacement as real code,
and spell out the non-obvious decisions (atomicity/transaction behaviour, error propagation,
exact return shape). A prose-only "loop over X, reuse pattern Y" ticket has come back as "not
sure what the ask is."

**Project mode:** Context starts with `Part of <project link>. Read the project description
for full background.` and then holds only the context specific to this ticket: file/symbol
references, and the project decisions it implements. Don't repeat background the project
description already covers.

### Parent and sub-issue descriptions

For a parent with sub-issues (standalone mode only), read
`references/parent-and-sub-issues.md` for the parent and sub-issue templates.

### References to other tickets

Identifiers don't exist until tickets are created. In drafts, refer to other tickets by title
(e.g. `stacked on "feat(parser): add Token type"`). Section 4 replaces the titles with
identifiers.

### Fields

- **Labels:** per `linear-workspace`.
- **Status:** the **new** state (per `linear-workspace`'s workflow states) unless the
  developer says otherwise.
- **Project/milestone:** as determined in section 1, or as given by `create-project` in
  project mode, on every issue. One milestone per issue (`save_issue`'s single `milestone`
  param).
- **Priority and assignee:** leave unset unless the developer says otherwise.

### Formatting

Markdown with literal newlines, not escaped `\n`. Pass a literal `&`, not `&amp;`: Linear
stores text verbatim and doesn't unescape HTML entities.

## 4. Confirm and create

**Checkpoint** (standalone only): before creating anything, show the developer each parent's
or single issue's title, fields, and full description. For a parent, follow it with its
sub-issues in execution order, each with its title, a one-line summary, and what it's blocked
by. Show the full sub-issue descriptions only if the developer asks.

Once approved (by the developer, or through `create-project`'s checkpoint in project mode),
create everything with `save_issue` (no `id`):

1. Create the tickets in dependency order, so `blockedBy` can point at tickets that already
   exist: parents and single issues first, then each parent's sub-issues in execution order
   with `parentId`. In project mode, go milestone by milestone, in order, setting `project`
   and `milestone`.
2. Update each description that refers to another ticket by title, replacing the title with
   its identifier (`save_issue` with `id` and `patch`; see below).

Reply:
- **Standalone:** a tree of each parent's identifier, title, and link, with the ordered list
  of its sub-issue identifiers and titles under it. List single issues on their own lines.
- **Project mode:** hand the created identifiers back to `create-project`, grouped by
  milestone.

## Patching an existing issue, project, or milestone

`save_issue`/`save_project`/`save_milestone` `patch` ops must match the *stored* text
exactly. Linear silently wraps inline issue references in auto-link tags
(`<issue id="..." href="...">ABC-123</issue>`), so a plain-text anchor spanning one won't
match. Anchor patches on text outside those spans, or re-fetch with `get_issue`/`get_project`
first and copy the stored text.
