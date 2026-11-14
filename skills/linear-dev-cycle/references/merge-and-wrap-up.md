# Phase 8: Merge and wrap up

Skills named below are used by name. If one is not available, stop and ask the developer.

Part of the `linear-dev-cycle` skill. "The developer" and "the agent" are defined in the
`roles` skill.

Runs when the developer says PRs have been merged. The developer merges, either one PR at a
time or a whole stack up to a chosen PR using the `gh-stack` skill. Merge-together stacks are
always merged as a whole stack; never suggest merging their lower PR alone. Afterwards:

1. For stacks, sync the remaining branches onto the updated default branch with the
   `sync-stacked-branch` skill (the `gh-stack` sync, with a fallback when rebase misbehaves).
2. Check the developer's other open PRs from the same project or parent
   (`gh pr list --author @me`) for merge conflicts with the updated default branch. A conflict
   from an additive edit to a shared file (e.g. both PRs appended an export to the barrel) is
   resolved by rebasing and keeping both sides: do it in a fresh worktree, re-run the verify
   step, and push after the developer approves. Report any other conflict to the developer
   instead of resolving it.
3. If the project releases on merge (see `dev-environment`), confirm the release workflow ran
   (`gh run list`) and note the new version. Each PR merged separately can produce its own
   release. Check what a whole-stack merge produced rather than assuming.
4. If issues in other repos were waiting on this release, tell the developer they're now
   unblocked. The dependency bump happens wherever the tickets put it: in a project from
   `create-project`, it's its own ticket; otherwise, it's part of the waiting issue's Scope.
5. **Keep Linear honest.** If what shipped differs from what the ticket planned, patch the
   issue's description and acceptance criteria to match (per `create-ticket`'s patching
   rules). A spec that has quietly drifted from the code wastes the next reader's time.
6. Check each merged sub-issue is in the **done** state (per `linear-workspace`'s workflow
   states), and set it if the GitHub integration hasn't. Once all are, set the parent to
   **done**. Then remove each unit's worktree with the `remove-worktree` skill (for a stack, once
   the whole stack is done), confirm none remain for its branches (`git worktree list`), and
   delete the merged local branches.
