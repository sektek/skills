# Implementing a unit (phases 4–5, in a subagent)

Skills named below are used by name. If one is not available, stop and report back so the main session can ask the developer.

Part of the `linear-dev-cycle` skill. "The developer" and "the agent" are defined in the
`roles` skill. The main session gave you a worktree, the unit's sub-issues, the relevant plan
decisions, and the approved dependencies.

**Never** push, open PRs, change Linear, create tickets, or ask the developer anything. If
you hit ambiguity, need a dependency that wasn't approved, or need the developer for anything
else, stop this unit and report back instead of guessing or installing.

## 1. Implement

Go through the unit's sub-issues in execution order. For each sub-issue:

1. **Branch.**
   - First sub-issue of a stack: in the detached worktree, use the `gh-stack` skill to start
     the stack on the default branch with this branch.
   - Later sub-issue of a stack: use the `gh-stack` skill to add a layer on top.
   - Independent sub-issue: the branch was created with the worktree.
2. Make only the change its Scope describes, with its tests. Follow CLAUDE.md, the project's
   AGENTS.md/CLAUDE.md, and memories. Cover every Verification item, and any bug being fixed.

   **NEVER automatically install a new dependency. Dependencies must be approved.** Only add
   or upgrade a package the developer approved in the plan, at the approved version. If the
   work turns out to need one that wasn't approved, stop and report back. Don't install it
   to "try it out".

   **Types (TypeScript only; JavaScript projects skip this):** prefer the properly typed,
   upstream-aligned solution over a pragmatic shortcut. Avoid `any` (and disabling its lint
   rule) when a named type following an existing convention would work. Match the underlying
   library's own shapes rather than optimizing for a minimal diff, and verify a looser type
   is actually needed before keeping it "just in case".

   **Comments (Clean Code):** write as few as possible. Make the code explain itself through
   names, small functions, and types. Only comment when a reader would be genuinely *stuck*
   without it, not merely curious (blame, the PR, and the ticket answer curiosity): a
   workaround, a non-obvious constraint, or something that prevents a costly future mistake
   the code's shape invites (e.g. test fixture values that silently stop testing anything if
   "simplified").
   - No comments that restate what the code does, narrate steps, label sections, explain why
     something *isn't* there, or describe the change ("added X", "now handles Y"). Design
     rationale and rejected alternatives belong in the PR description. No commented-out code,
     and no TODOs unless they point at a Linear issue.
   - **JSDoc is documentation, not comments,** so the rule above doesn't apply to it. Every
     exported class, function, interface, and type of the public API gets JSDoc describing how
     to use it: purpose, parameters, return value, thrown errors, and generics (`@template`).
     Keep it to the contract of the thing it documents; a builder's JSDoc doesn't re-describe
     the type it builds. Keep JSDoc up to date with the code. Non-exported helpers get none,
     even if a warning-level `jsdoc/require-jsdoc` flags them; check whether that rule
     actually fails CI before adding a stub to quiet it.
   - Leave existing comments alone unless the change makes them wrong.
   - Re-read the diff once more after trimming comments. The first pass usually leaves too
     many.
3. **Verify:** run the `verify` skill, then the build. `verify` separates failures the change
   caused (fix them) from pre-existing ones (don't fix them here; they go in the report and the
   follow-up list). Each branch must be green by itself, apart from pre-existing failures,
   except the lower branch of a merge-together stack (its Scope says `Merge together with
   …`): that one only has to be green together with the branch stacked on it, so verify the
   top of the pair. Check `git status` for unstaged lint auto-fixes.
4. **Commit** per the `dev-environment` skill's commit conventions.

**Keep unrelated fixes off the ticket's branch.** Linear auto-links a PR to the issue its
branch name matches and completes that issue when the PR merges, whatever the PR contains.
Put unrelated problems the agent finds on a follow-up list (returned in the report) instead of
fixing them in passing. If one must be fixed now, report it; the main session files a ticket
for it with `create-ticket` and it gets its own branch.

## 2. Self-review and report

Run the `self-review` skill on the unit's branch(es), bottom of the stack first. Pass it:
- each branch's sub-issue Scope and Verification as the requirements, and
- the dependency, type, comment, and JSDoc rules from step 1 as extra coding rules.

Then return to the main session:
- **status:** done, or stopped (and why: the question or approval needed);
- the branch(es), bottom first, and the worktree path;
- the `self-review` report;
- the follow-up list;
- the verify results, as the commands run and their outcome.
