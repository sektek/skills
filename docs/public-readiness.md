# Public-readiness report

This report records what was checked before deciding whether to make the repository public. It
gives evidence, not a clearance: the developer reviews it, spot-checks the history, and decides.
Names of private profiles, repositories and skills that were searched for are deliberately not
listed here.

Checked against `main` at commit `60e3ee5`, with a mirror clone (`git clone --mirror`) that
includes every ref GitHub keeps, including pull request refs.

## Scope and method

- **Tree:** every file on `main`.
- **History:** every commit reachable from any ref, 41 commits, as full diffs (`git log -p --all`).
- **Refs:** branches, tags and pull request refs.
- **Pull request text:** titles, bodies, comments and review comments of pull requests 1 to 14.
- **Search terms:** the names of the private profile skills and private repositories in the
  developer's dotfiles, the names of the employers and clients the developer works with, and the
  names of internal projects. Terms that are also names of skills in this repository were excluded,
  because they are expected to appear. Generic patterns were also searched: email addresses,
  absolute home and workspace paths, ticket keys, credential-shaped strings, and URLs.

## Results

| # | Check | Result |
|---|---|---|
| 1 | Private names in the tree on `main` | Pass. No match in any file. |
| 2 | Private names in the history of `main` | Pass. No commit on `main` adds or removes one. |
| 3 | Private names on other refs | **Fail.** One commit on `refs/pull/2/head` contains them (see finding 1). |
| 4 | Email addresses in the tree and history | Pass, with a note (finding 3). Only the author identity appears. |
| 5 | Absolute home or workspace paths | Pass. The only match is the devcontainer's fixed `/workspace` folder, which is intended. |
| 6 | Credential-shaped strings | Pass. No match. The devcontainer refers to `GH_TOKEN` as a local environment variable and holds no value. |
| 7 | Ticket keys | Pass in the tree and history (only placeholder keys). **Fail** in pull request text (finding 2). |
| 8 | URLs | Pass. Every host is a public documentation or project site. |
| 9 | Tags | Pass. There are none. |
| 10 | Base image in the devcontainer | Pass. The image it builds from is public. |
| 11 | License | **Open.** There is no license file (finding 4). |
| 12 | Workflow secrets | Pass. The CI workflow uses no secrets. Repository secrets and settings were not inspected. |

## Findings

1. **Closed pull request 2 keeps a deny-list of private names.** An abandoned scanner proposal was
   closed and its branch deleted, but GitHub keeps `refs/pull/2/head`. That ref holds one commit
   (`cf570ff`, plus a fix on top) with a file that lists private profile and skill names. It is not
   on `main`. A public repository exposes every pull request ref. Options: ask GitHub support to
   remove the ref, or create a fresh repository from the current `main`.
2. **The Linear integration copied ticket descriptions into pull request comments.** Each pull
   request that links a ticket has a comment from the Linear integration with the ticket's full
   description in a collapsed block. Those descriptions name private profile and skill names, other
   internal projects and internal ticket keys. Pull requests 2, 4, 5, 6 and 7 mention a private
   term; the ticket keys appear across the set (20 distinct). They are public as soon as the
   repository is. Options: delete those comments (the integration may add them back on later
   edits), turn off the integration's link-back comment for this repository, or create a fresh
   repository, which has no pull requests.
3. **The git author identity is a work email address.** All 41 commits are authored by one identity,
   and 13 were committed through GitHub's web flow. The address becomes visible to anyone on
   publication. Rewriting it needs a history rewrite.
4. **No license file.** Without one, others have no right to reuse the skills. The imported skills
   come from the developer's own repositories. `gh-stack` is deliberately not included.
5. **The README and CLAUDE.md name the `sektek-skills` marketplace and the `sektek/skills`
   repository.** These are the intended public names. Review them if a different public name is
   wanted.

## Not checked

- Repository, organization and Actions settings and secrets.
- The contents of the developer's private repositories, beyond comparing file names.
- Whether any skill text paraphrases private conventions. Each import was reviewed line by line at
  import time, and the developer reviewed it again before merging.
- Pull request review comments from external services other than those found by the API.

## Decision checklist

- [ ] Finding 1 resolved: ref removed, or repository recreated.
- [ ] Finding 2 resolved: comments removed or repository recreated.
- [ ] Finding 3 accepted or the author identity rewritten.
- [ ] License chosen and added.
- [ ] Developer has skimmed the history and the report.
- [ ] Decision recorded on the tracking ticket. If yes, the developer changes the repository
      visibility in GitHub.
