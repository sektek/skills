---
name: self-review
description: The agent reviews the branch (or stack of branches) it produced before it becomes a PR, rating findings P0–P3 and fixing every P0/P1 (up to 3 rounds). Use before opening a PR, and from the `linear-dev-cycle` skill for each sub-issue.
---

# Self-review

*"The developer" and "the agent" are defined in the `roles` skill.*

*Environment skills: this skill defers to `dev-environment` for environment-specific values (commands, naming, conventions) and does not hardcode them. If one of them is not available, stop and ask the developer for the value instead of guessing.*

Commands come from the `verify` and `dev-environment` skills. When the
project's CLAUDE.md/AGENTS.md, memories, or `package.json` scripts say
otherwise, follow the project.

Input:
- the branch to review, or for a stack, the branches in order (bottom
  first);
- optionally, the requirements the change must meet (e.g. a Linear
  sub-issue's Scope and Verification);
- optionally, extra coding rules from the calling skill (e.g. `linear-dev-cycle`'s
  comment and JSDoc rules).

Each branch must already be committed and pass verification, except the
lower branch of a merge-together stack (its requirements say `Merge together
with …`), which only has to pass together with the branch stacked on it.
Build or test failures on that lower branch alone aren't findings, and
neither are failures `verify` identified as pre-existing on the base. If a
branch isn't committed or doesn't pass verification,
stop and tell the caller (or the developer) instead of reviewing it.

## 1. Review

For each branch, bottom of the stack first:

1. Determine the branch's **base**: the default branch, or the branch below
   it in a stack. The review covers only `git diff <base>...<branch>`, the changes
   this branch adds.
2. Run the `code-review` skill at `high` on that range. Name the base
   explicitly; if the skill can't take one, check out the branch and give
   it the `<base>...<branch>` diff. Don't use `--comment`, since nothing is
   published yet. Discard any finding on lines outside the range; those
   belong to a lower layer and are reviewed there.
3. Also check the diff against:
   - the requirements, if given, and
   - the **written rules**: CLAUDE.md, the project's AGENTS.md/CLAUDE.md,
     memories, lint config, and any rules the caller passed in.
4. Rate each finding:
   - **P0:** broken. Build, type, or test failures; crashes; data loss;
     security problems; or an unmet requirement (including a Verification
     item that isn't met).
   - **P1:** wrong. Incorrect behaviour in a realistic case, a missing test
     for changed behaviour, a public API or breaking-change mistake
     (including the wrong conventional-commit type), or a violation of a
     written rule (e.g. unnecessary comments added in the diff, or public
     API with missing or outdated JSDoc), or changes outside the branch's
     ticket Scope (the PR should be one component or one piece of wiring).
   - **P2/P3:** everything else, including style preferences that aren't
     written down in any of the written rules, nits, and optional
     refactors.

   The line between P1 and P2 for style is whether the rule is written
   down: a written rule is P1, an unwritten preference is P2.

## 2. Fix

Do at most **3 rounds** of fix → re-review.

1. Fix every P0 and P1 on the branch that owns the change. In a stack,
   follow the `gh-stack` skill's steps for editing an existing stack: check
   out the owning layer, fix, commit, rebase the layers above it, and
   return to the top. Never commit a lower layer's fix on a higher branch.
2. Commit fixes as new commits rather than amending, following
   `dev-environment`'s commit conventions.
3. Re-run the `verify` skill and the build on every branch the agent
   changed or rebased.
4. Review the fixed branches again as in section 1, including layers above
   a fixed layer. Stop when no P0/P1 findings remain.

If P0/P1 findings remain after round 3, stop and report them to the
developer as unresolved.

If a P0/P1 can't be fixed without going beyond the change's scope, stop and
raise it with the developer rather than widening the change.

**NEVER automatically install a new dependency. Dependencies must be
approved.** If a fix needs a new or upgraded package, stop and ask the
developer.

Leave P2/P3 findings unfixed. They're the developer's call.

## 3. Report

For each branch, give:
- **Fixed:** each P0/P1 finding, one line apiece.
- **Unresolved:** any P0/P1 still open (after 3 rounds, or out of scope),
  with file:line and why.
- **Left:** each P2/P3 finding, one line apiece, with file:line.

When called from another skill, hand this report back so it can be shown
alongside the PR drafts.
