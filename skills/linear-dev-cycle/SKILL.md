---
name: linear-dev-cycle
description: >
  Take a Linear ticket from intake to merged PRs, filing one first if the work has none: read
  the issue and its sub-issues, plan, implement each sub-issue as its own PR in its own
  worktree (stacked where they build on each other), verify, self-review, open draft PRs,
  handle review, and wrap up after merge. Use when asked to work on, pick up, or start a
  Linear issue (e.g. "work on ABC-123", "/linear-dev-cycle ABC-123"), to address review on its
  PRs, or to wrap up after they merge, or whenever hands-on code work starts on a task or bug
  that should end in a PR.
---

# Linear ticket development cycle

## Required skills

This skill uses other skills by name: `roles`, `dev-environment`, `linear-workspace`, `branch-naming`, `create-worktree`, `remove-worktree`, `gh-stack`, `sync-stacked-branch`, `create-ticket`, `create-project`, `create-pr`, `verify`, `self-review`, `pr-review-feedback`.
The `design` skill is optional: use it when available, and skip it silently when not.
**Before relying on one, check that it is available. If a required skill is missing, stop and ask the developer to install it or say how to proceed; do not guess its contents or substitute your own rules.**

*"The developer" and "the agent" are defined in the `roles` skill.*

Commands, worktree location, and commit conventions come from the `dev-environment` skill.
Linear values come from `linear-workspace`. When the project's CLAUDE.md/AGENTS.md, memories,
or `package.json` scripts say otherwise, follow the project.

Argument: a Linear issue identifier or URL. All work is tracked by a ticket; if none is given,
see **No ticket yet** below.

**Decisions that are always the developer's.** The agent never makes these on its own:
- marking a PR ready for review, and merging;
- adding or upgrading a dependency;
- acting on peer review feedback;
- creating tickets or projects;
- destructive operations: force-pushes and history rewrites (other than the routine re-push
  below), and deleting anything the agent didn't create (branches, worktrees, uncommitted
  work).

Everything else proceeds without asking: routine commands, implementing a well-defined ticket,
pushing to the agent's own PR branches, and fixing bot and developer review comments.
**Re-pushing the agent's own branches after a rebase is routine** (e.g. a stack's upper layers
after a fix lower down, or a sync onto the updated default branch): use
`git push --force-with-lease`, never plain `--force`. Only stop
at a **Checkpoint** whose condition applies, or when a ticket is ambiguous.

## Shape of the work

- **Parent with sub-issues** (see the `create-ticket` skill). Each sub-issue is done
  separately and gets its own branch and PR. The parent gets no PR, and is done when all its
  sub-issues are.
- **Single issue with no sub-issues:** if it covers exactly one component or one piece of
  wiring (per `create-ticket`'s "Smallest unit"), the work is one PR. Treat the issue as a
  parent with exactly one sub-issue, which is the issue itself.
- **Single issue that bundles several pieces:** break it down before implementing. Use the
  `create-ticket` skill to turn it into a parent with one sub-issue per component and one per
  piece of wiring, with `blockedBy` between them, and continue with those sub-issues. Every PR
  gets its own ticket. The breakdown goes through `create-ticket`'s checkpoint, since it
  creates tickets.
- **Given one sub-issue of a larger parent:** do just that sub-issue, after checking that its
  blockers are merged or stackable.
- **No ticket yet:** ask the developer whether a ticket already exists for the work. If it
  does, use it. If not:
  - one component or one piece of wiring → create it with `create-ticket` (standalone mode,
    including its checkpoint);
  - several pieces that fit under one parent → `create-ticket` as a parent with sub-issues;
  - a sizable, multi-part feature → suggest a project via `create-project` instead.

  Planning isn't wasted, because the plan becomes ticket content. Then continue with the
  created ticket(s). Never do the work untracked.

## How the phases run

- Phases 1–3 run once per ticket, in the main session.
- Phases 4–5 run once per **unit**, each in its own **subagent**. A unit is either a stack (a
  chain of dependent sub-issues in one repo) or an independent sub-issue.
  - **Ready units run in parallel.** A unit is ready when nothing it's blocked by is still
    unmerged or, across repos, unreleased. Stacked sub-issues are inside one unit, so they
    never block another unit.
  - **Blocked units wait.** Report them, and start them when their blockers land (usually in a
    later invocation, after phase 8).
- Phase 6 runs in the main session once the running units have returned: one batch of PRs for
  all of them.
- Phases 7 and 8 run only when the developer invokes the agent again (e.g. "address the review
  on ABC-124", "ABC-124 is merged"). Don't poll GitHub or wait for reviews or merges unless
  asked to watch.

## 1. Intake

1. Fetch the issue with the Linear MCP (`get_issue` with `includeRelations`), plus its
   comments, attachments, linked documents, sub-issues, and project. Load the Linear tools
   with ToolSearch first if they aren't loaded yet.
2. Follow references: linked PRs, related issues, and the code the ticket names.
3. Build the sub-issue execution order from the `blockedBy` relations between siblings. Note
   any sub-issue that's blocked by unfinished work outside this parent.
4. For each sub-issue, note its repo. In multi-repo workspaces (several separate repos
   checked out side by side), stacking only works within one repo. A sub-issue that depends
   on another repo's change has to wait until that change is merged *and released*.

Tickets are often one section of a larger plan already worked out with the developer (e.g. a
project from `create-project`), and "do ABC-123" is the whole instruction. The ticket, its
parent, and its project description *are* the plan. **Only check in when the ticket is
ambiguous about what to do.**

**Checkpoint (only if something is ambiguous):** ask about exactly the unclear points, and
don't guess. Ambiguity means, for example:
- the requirements, Scope, or Verification are missing, vague, or contradict each other or
  the code;
- the ticket doesn't say *how* to do something and there's more than one reasonable way,
  with real consequences (public API shape, behaviour change, data handling);
- a sub-issue looks too big, out of order, or missing, or a blocker isn't merged or
  stackable.

If nothing is ambiguous, don't stop. Go straight to phase 2.

## 2. Plan

1. Explore the code. If the project has a design skill (e.g. `design`), apply its checklist
   to new components and interfaces.
2. Plan each sub-issue in execution order. Call out any new dependency, breaking change
   (`feat!`), or public API change explicitly. For each new or upgraded dependency, name
   the package and exact version so the developer can approve it. **NEVER automatically
   install a new dependency. Dependencies must be approved.** npm is a frequent target for
   supply-chain attacks.
3. Decide the units, with one branch per sub-issue:
   - **Stack** a sub-issue on the one it's blocked by when they're in the same repo and the
     blocker isn't merged yet.
   - **Branch off the default branch** when a sub-issue has no unmerged blocker in the same
     repo. Independent sub-issues are separate PRs that can go in any order.
4. If the plan shows the split is wrong, propose sub-issue changes (split, merge, reorder, add)
   instead of drifting from the tickets.

**Checkpoint (only when the ticket doesn't define the plan):** if the ticket's Scope and
Verification (with its parent and project) already say what to build, follow them without
asking for approval. Enter plan mode and get the developer's approval before writing code only
when:
- the ticket doesn't define the plan (e.g. a thin ticket that states a goal but no Scope);
- the plan has to deviate from the ticket, including sub-issue changes from step 4 (a
  breakdown already approved through `create-ticket`'s checkpoint doesn't need a second
  approval here);
- the work needs a breaking change or public API change the ticket doesn't mention;
- the work needs a new or upgraded dependency. **This always needs explicit approval,** even
  when the ticket names the package.

When a plan was approved here, publish it (with any agreed changes) as a Linear document
attached to the issue's project, or as a comment on the parent if it has no project, and apply
any agreed sub-issue changes in Linear.

Either way, set the parent to the **started** state (per `linear-workspace`'s workflow
states), assigning it per the rule below.

**Assign when work starts, never at creation.** Whenever the agent sets a parent or sub-issue
to **started**, it also assigns it to the developer (Linear's `"me"`) if it's unassigned. If
it's already assigned to someone else, don't reassign it or start it: tell the developer and
ask first, since a peer has likely picked it up.

## 3. Set up

- Name each branch per the `branch-naming` skill.
- Give each ready unit its own worktree per the `create-worktree` skill: an independent
  sub-issue gets a new branch off the default branch; a stack gets a detached worktree. The
  main session creates them one at a time before starting the subagents, so parallel units
  don't race on the repo's git lock.
- Set each ready unit's sub-issues to the **started** state and assign them per the rule in
  phase 2. A unit with a sub-issue assigned to someone else doesn't start until the developer
  says so.
- Use the `gh-stack` skill for all stack operations (native GitHub stacked PRs). The first
  time the agent runs a stack in a worktree, check that its local tracking works there
  (`gh stack view --json` after init). If it doesn't, manage the branches with git and link
  them into a stack through the `gh-stack` skill's worktree path (`gh stack link`).

## 4–5. Implement and self-review each unit (in subagents)

Start one subagent per ready unit, all at once. A subagent has none of this conversation's
context, so give it everything it needs:

- the worktree path and branch name(s), and whether the unit is a stack;
- each sub-issue's identifier, title, Scope, and Verification, in execution order;
- the plan decisions that affect it, and the dependencies the developer approved (package and
  version), or "none approved";
- the path to this skill's `references/implement-unit.md`, and the instruction to follow it.
  It covers implementing, verifying, committing, self-reviewing, and what to report back, and
  it loads `verify`, `self-review`, `gh-stack`, and `dev-environment` as needed.

**A subagent never** pushes, opens PRs, changes Linear, creates tickets, or asks the developer
anything. If it hits ambiguity, a needed dependency that wasn't approved, or anything else
that needs the developer, it stops that unit and reports back instead of guessing or
installing. The main session raises it with the developer; the other units keep going.

## 6. Open the PRs (main session, one batch)

The task isn't done at "tests pass". It's done when the draft PRs exist.

Once the running units have returned:

1. Raise every stopped unit's question or approval request with the developer, together, and
   resume those units in new subagents once answered.
2. Open the PRs for **all** done units with **one** `create-pr` run, so the whole batch is
   published together. Don't ask before creating the draft PRs; the developer reviews through
   GitHub's PR tools, which need them to exist. Pass it, per unit:
   - the branches (bottom first for a stack),
   - each branch's sub-issue and parent,
   - the `self-review` report.

   `create-pr` publishes the PRs as drafts. Leave each unit's worktree in place; the developer
   can open it directly.
3. Set each published sub-issue to the **in review** state. Never mark a PR ready for review; the
   developer does that after their own pass.
4. Report the combined follow-up list. Offer to file each item with the `create-ticket` skill;
   don't create them unasked.
5. List the units still blocked and what they're waiting on. When a later unit stacks on a
   branch that's already published, give it a new worktree and use the `gh-stack` skill to
   check out the existing stack there. If that branch is still checked out in the earlier
   unit's worktree or the main workspace, ask the developer before removing or switching it.

## 7. Review

Runs when the developer asks the agent to address review comments. Read
`references/review.md` and follow it.

## 8. Merge and wrap up

Runs when the developer says PRs have been merged. Read `references/merge-and-wrap-up.md`
and follow it.
