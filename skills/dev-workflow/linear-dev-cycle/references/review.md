# Phase 7: Review

Skills named below are used by name. If one is not available, stop and ask the developer.

Part of the `linear-dev-cycle` skill. "The developer" and "the agent" are defined in the
`roles` skill.

Runs when the developer asks the agent to address review comments: the developer's on a
draft, or a bot's and others' once a PR is ready.

1. **Check the PR isn't already merged** (`gh pr view <N> --json state`) before pushing
   anything to a PR not opened in this same turn. The developer often merges without
   announcing it. Pushing to a merged PR's branch strands the commit. If that's happened,
   cherry-pick the new commit(s) onto a fresh branch off the current default branch and open a
   small follow-up PR. Rebasing a squash-merged branch conflicts.
2. `git fetch origin`, then work in the unit's existing worktree (`git worktree list`). If
   there isn't one, create it per `create-worktree`: the PR's branch for an independent PR, or
   a detached worktree with the stack checked out via `gh-stack`.
3. Triage the comments with the `pr-review-feedback` skill, which splits them by author:
   - **Bot and developer comments:** handled straight through (steps 4–8).
   - **Peer comments:** assessed and presented to the developer, with the agent's opinion on
     each (**Checkpoint**). Nothing is done about them until the developer approves. The
     approved ones then go through steps 4–8.
4. Fix on the branch that owns each change, as new commits, and re-run the verify step from
   `references/implement-unit.md`. In a stack, use the `gh-stack` skill's steps for editing an existing stack.
5. Run the `self-review` skill on the changed branches, with the same requirements and rules as
   in `references/implement-unit.md`.
6. Push: `git push` for an independent PR, or the `gh-stack` skill's push for a stack. The PRs
   stay in their current draft or ready state. There's no pre-push checkpoint: the developer
   reviews the changes in the context of the PR.
7. Reply to and resolve threads, and update the PR body and changelog comment, per
   `pr-review-feedback`.
8. Leave the worktree in place; it's removed at wrap-up once the ticket is done. When the
   developer approves peer changes later, that's another run of this phase.

Reply with the PR link(s), a one-line outcome per bot and developer comment (fixed in which
commit, or why it was declined), and any P2/P3 findings `self-review` left for the developer.
Peer comments awaiting approval are listed in the checkpoint.
