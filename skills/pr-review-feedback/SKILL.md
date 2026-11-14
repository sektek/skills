---
name: pr-review-feedback
description: |
  Handles review feedback on a GitHub PR, split by who wrote it. Bot findings are assessed
  (empirically verifying disputed claims), fixed or declined with evidence, then replied to and
  resolved. The developer's own comments are acted on. Peers' comments are assessed and
  presented to the developer, and nothing is done about them until the developer approves.
  Keeps the PR body and any tracked issue in sync. Use once a PR is opened/marked ready and
  review feedback needs watching or handling: "watch for the review bot," "check the PR for
  review comments," "address the review feedback." Called from linear-dev-cycle's review
  phase, whose worktree rules still apply.
---

# PR review feedback

*"The developer" and "the agent" are defined in the `roles` skill.*

*Environment skills: this skill defers to `dev-environment` for environment-specific values (commands, naming, conventions) and does not hardcode them. If one of them is not available, stop and ask the developer for the value instead of guessing.*

A recurring workflow: a PR goes up, reviewers leave feedback (an automated reviewer named in
the `dev-environment` skill, the developer, and peers), and the job is to separate real
findings from noise, act on each according to who wrote it, and leave a clean paper trail. Not
just silently push fixes and hope, and not just dismiss whatever's inconvenient.

## Procedure

### 1. Locate the PR and wait for review, if not posted yet

```sh
gh pr view <N> --repo <owner>/<repo> --json isDraft,reviewRequests,reviews
```

Only watch when the developer asks to; otherwise work from whatever feedback already exists.
`<bot-login>` is the reviewer bot's login from the `dev-environment` skill; if it names
none, ask the developer which reviewer to wait for.

To watch for the bot's review, or re-request one that never arrives, read
`references/gh-api.md`. Always read bot reviews through `gh api`, never
`gh pr view --json reviews`, which returns `user: null` for bot authors.

### 2. Fetch the full feedback

```sh
gh api repos/<owner>/<repo>/pulls/<N>/reviews --jq '.[] | {id, user: .user.login, type: .user.type, state: .state, body: .body}'
gh api repos/<owner>/<repo>/pulls/<N>/comments --jq '.[] | {id, path, line, body, user: .user.login, type: .user.type}'
gh api repos/<owner>/<repo>/issues/<N>/comments --jq '.[] | {id, body, user: .user.login, type: .user.type}'
```

The last command gets the PR's conversation comments, which aren't attached to code. People
often leave feedback there.

**Classify each review and comment by author** before assessing anything:

| Source | How to tell | Handling |
|---|---|---|
| **Bot** | `type == "Bot"` (login ends in `[bot]`) | Assess, then act: fix, or decline with evidence, then reply and resolve. |
| **The developer** | login matches `gh api user --jq .login` | An instruction: make the change. If it's unclear or technically infeasible, ask instead of declining. |
| **Peer** | any other `User` | Assess and give an opinion, but **take no action until the developer approves** (step 3a). |

AI output posted through a person's account can't be told apart from a human, so treat any
`User` comment that isn't the developer's as a peer's.

The review body's own "Suppressed comments" section (when present) often contains findings the bot
decided not to post inline but that are still worth reading — don't skip it.

### 3. Assess each comment's validity — before touching any code

For every comment, the agent should read the **current** code at that file/line itself (never
trust the comment's quoted snippet as still-accurate) and reach one of these verdicts:

- **Valid, straightforward** → fix it.
- **Valid concern, but the suggested fix doesn't hold up** → find the real fix; explain why the
  suggestion doesn't work in the reply.
- **Technically correct claim, suggested remediation is infeasible** → say so with evidence (see
  below), and don't force a change just to look responsive.
- **Not applicable / already handled / based on a misreading** → decline with a specific reason
  pointing at what's actually true.

**Empirically verify any disputed claim about tool/language/runtime behavior — don't reason about it
from memory alone, in either direction.** This is the single highest-value habit in this whole
workflow. Concrete examples from past reviews:
- A comment claimed `execFile`'s real callback shape didn't match a test stub → confirmed by reading
  Node's docs *and* running a two-line repro.
- A comment suggested stubbing `execFile[util.promisify.custom]` instead of `execFile` itself →
  `Object.getOwnPropertyDescriptor` showed `{writable: false, configurable: false}`, and both
  `sinon.stub()` and direct assignment were confirmed (empirically, in a throwaway `node -e`) to fail
  silently or throw — the underlying observation was right, the suggested fix was impossible.
- A comment flagged a token appearing in `git push`'s argv (a real `ps`-visible leak) → the suggested
  `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`/`GIT_CONFIG_VALUE_0` fix was verified against a real local git
  repo before trusting it, not just assumed to work from the git docs.

A `node -e '...'` or a scratch shell repro costs a minute and turns a guess into a fact. Do this before
writing the reply, not after.

**When fixing one instance of a bug pattern, grep for the same pattern elsewhere in the diff** — a
reviewer flagging one occurrence doesn't mean there's only one (e.g. an identical stub-shape mistake
copy-pasted into a sibling `.spec.ts`).

### 3a. Peer feedback: present, then wait

**Checkpoint:** for every peer comment, don't change code, reply, react, or resolve anything
until the developer approves. Show the developer, per comment:

- the reviewer, a link to the comment, and a one-line summary of what it asks;
- the agent's verdict (one of the four above) and the evidence behind it, including any repro
  already run (investigating is fine; acting isn't);
- the proposed action: the fix, or the reply that would decline it.

Then do exactly what the developer approves, per comment, including whether to reply and
whether to resolve the thread. Bot and developer comments don't wait on this checkpoint.

### 4. Fix what's valid

Covers bot findings, the developer's comments, and peer comments the developer approved.

- Implement the fix. **NEVER automatically install a new dependency. Dependencies must be approved.** If a suggested fix needs a new
  or upgraded package, ask the developer before installing anything.
- Add or extend test coverage for the specific scenario the finding describes — a fix with no new
  test is a fix nobody will notice regressing.
- Rebuild, run the full test suite, and lint before moving on. If the original failure was
  environment-specific (see `references/ci-vs-local.md`), reproduce the *actual* failing condition
  locally rather than trusting a green local run in an environment that quietly differs from CI.

### 5. Reply to every thread, then resolve it

Push the fixes first, so each reply can name the commit that fixed it.

Reply first (so the reply is attached to the finding, and to leave a record even for declined ones):

```sh
gh api repos/<owner>/<repo>/pulls/<N>/comments/<comment_id>/replies -f body="..."
```

Write replies that a future reader can act on without re-deriving anything: name the commit SHA that
fixed it, name the test that now covers it, and for declines, state the evidence plainly (not just
"won't fix").

Then resolve the thread via GraphQL (REST has no resolve endpoint). The commands are in
`references/gh-api.md`.

Resolve threads for both fixed *and* thoughtfully-declined findings — a clear decline with evidence is
"addressed," not something to leave dangling. Never resolve a thread the agent didn't actually reply
to. For peer threads, reply and resolve only as the developer approved in step 3a.

### 6. Keep the PR body current

Per the `create-pr` skill's "Keeping the body current" rules: rewrite `## Summary`/`## Changes` to match what's actually in the
PR now that review feedback has been incorporated, and post a changelog of what changed and
why (including declined items and the reasoning) as a PR comment rather than a body edit.

### 7. Update any tracked issue

If the work is tracked (Linear, Jira, etc.), patch the issue's description/acceptance-criteria to
match what was actually built, same as the PR description. For Linear, follow `create-ticket`'s
patching rules. Specs that silently drift from reality
waste the next person's time re-deriving what's already known.

### 8. Re-verify

Watch CI go green (the `Monitor` pattern in `references/gh-api.md`, polling
`gh pr checks <N>`) rather than assuming the push will pass. Confirm `mergeable`/`mergeStateStatus` before calling it done.

## Related skills

- `create-pr` — the PR body structure and comment-as-changelog convention step 6 follows.
- `linear-dev-cycle` — the surrounding ticket workflow; its review phase hands off here.
- `create-ticket` — patching rules for step 7.
- `sync-stacked-branch` — if the PR's base moved and its branch needs bringing up to date
  before (or after) pushing fixes.
