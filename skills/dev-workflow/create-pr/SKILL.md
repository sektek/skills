---
name: create-pr
description: >
  Prepare and publish a GitHub PR (or a stack of PRs) as drafts without asking first,
  with a title per `linear-workspace` and a Summary/Changes/Testing body that always describes
  the PR's current contents. Never marks a PR ready. Use when asked to open, create, or submit
  a PR, whenever a task reaches the point of handing work off for review, from
  `linear-dev-cycle` for each unit, and whenever editing a PR body or posting a changelog
  comment.
---

# Create a PR

*"The developer" and "the agent" are defined in the `roles` skill.*

*Environment skills: this skill defers to `branch-naming`, `dev-environment`, `linear-workspace` for environment-specific values (commands, naming, conventions) and does not hardcode them. If one of them is not available, stop and ask the developer for the value instead of guessing.*

Input:
- the branch to publish, or for a stack, the branches in order (bottom first). A batch can
  hold several independent branches and stacks at once;
- optionally, the Linear issue each branch implements, and its parent;
- optionally, a `self-review` report to show alongside the drafts.

This skill doesn't review the code. When the developer asks for a PR directly, offer to run
`self-review` first if it hasn't been run on these branches.

**The deliverable is the PR URL, not "tests pass".** Don't stop at a clean, pushed branch.

## 1. Preflight

1. Make sure the current branch isn't the default branch. If it is, create a feature branch
   per the `create-worktree` and `branch-naming` skills.
2. Make sure the work is committed per the `dev-environment` skill's commit conventions.
   - Uncommitted changes the developer asked to include: commit them now, as a new commit
     (don't amend unless asked).
   - Any other uncommitted changes: stop and ask the developer what to do with them. Don't
     commit, stash, or discard them.
3. Make sure each branch is green by itself (apart from pre-existing failures `verify`
   identified, which go in the Testing section as failing before this change), except the
   lower branch of a merge-together stack, which only has to be green together with the
   branch stacked on it. Run the `verify`
   skill, then the build. Check `git status` for unstaged lint auto-fixes.

## 2. Draft

- **Title:** per the `linear-workspace` skill's PR-title rule. Without an issue, a
  Conventional Commits line under ~70 characters. If PRs are squash-merged, the title becomes
  the commit on the default branch and its type can drive a release, so pick the type
  deliberately.
- **Body:**
  ```markdown
  ## Summary

  <1–3 sentences of plain prose: what changed and why. Readable from the PR list.>

  ## Changes

  - <bullet per meaningful change>

  ## Testing

  - `<command actually run>`: <result>

  <ticket-link line per `linear-workspace`>
  ```
  - List only the commands that were actually run, with real results. Don't list planned
    checks.
  - Put anything else (implementation notes, screenshots) below `## Testing`.
  - For each PR in a merge-together stack, add under Summary: `**Merge together with
    #<other PR>.** Merging this PR alone breaks the build; merge the whole stack.`
  - Include the ticket-link line only when there's an issue.

## 3. Publish

No approval checkpoint: the developer reviews the code through GitHub's PR tools, which need
the draft PR to exist, so publish as soon as preflight passes. Publish every PR as a **draft**:

- **Single PR:** `git push -u origin <branch>`, then `gh pr create --draft` with the drafted
  title and body.
- **Stack:** use the `gh-stack` skill to submit the stack as drafts (its default; don't pass
  `--open`). Submit generates its own titles and bodies, so set the drafted ones afterwards
  with `gh pr edit <number> --title … --body-file …`. Then confirm the order and the links
  between the PRs.

Confirm each PR is a draft (`gh pr view <number> --json isDraft`).

**Never take a PR out of draft** (`gh pr ready`, `gh stack submit --open`,
`gh stack link --open`), and don't nudge the developer to based on a guess about what's
gating a review. The developer reviews every PR and marks it ready themself. If an automated
review seems stalled, say so and ask. This mistake has happened before: the agent inferred
from two *other* PRs being non-draft that it should un-draft one, without confirming who
un-drafted them or whether the bot requires ready status.

Reply with each PR's number, title, and link. If there's a `self-review` report, include each
PR's part of it: what was fixed, and the P2/P3 findings left for the developer to decide on.

## Keeping the body current

These rules apply whenever a PR body is edited later: new commits, scope changes, or review
feedback (see `pr-review-feedback`).

- **The body describes the PR's current contents, not a log.** Rewrite `## Summary` and
  `## Changes` as work evolves. Don't append dated sections or leave bullets describing
  reverted or superseded work. The body should read correctly to someone seeing the PR for
  the first time.
- **Changelog as comments.** What changed, when, and why (including anything declined in
  review) goes in a PR comment (`gh pr comment <N> --body-file …`), not a body edit.
- **Quoting:** when the text contains backticks or other shell-special characters, write it
  to a scratch file and pass `--body-file <path>` to `gh pr create`/`edit`/`comment`.
  Inlining it with `-b "..."` breaks on command substitution.
