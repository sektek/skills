# Installing with the skills CLI

The [`skills` CLI](https://skills.sh) (npm package `skills`, run with `npx skills`) installs skills
from a git repository into the skill directories of many agent harnesses in one command. This page
records what was tested against this repository and what is documented but not tested.

- **CLI version tested:** `skills@1.8.1`, run through `npx`. It is not a dependency of this repository.
- **Test setup:** isolated `HOME` and XDG directories, a throwaway project directory, no GitHub token,
  `DISABLE_TELEMETRY=1` and `DO_NOT_TRACK=1`. The source was a local clone of this repository,
  because the repository is private.

## Summary

- The grouped layout (`skills/<group>/<skill>/SKILL.md`) works unchanged. The CLI found all 24 skills
  and no flat layout is required.
- One command installs chosen skills into several harnesses' skill directories.
- Pinning to a release tag such as `v0.0.1` or to a full commit hash works.
- A plain skills repository plus the CLI is simpler for skills-only distribution, because there is
  no per-harness manifest to maintain. The Claude Code marketplace manifest stays useful for
  Claude Code users who want plugin-style installs and updates.

## Discover skills

```sh
npx skills@1.8.1 add <source> --list
```

Against a local clone this reported `Found 24 skills`, including nested ones such as
`skills/dev-workflow/verify`. The skill name is the `name` in its `SKILL.md`, not its path.

## Install

Non-interactive flags: `-y` skips prompts, `-s` selects skills, `-a` selects harnesses.

```sh
# One skill into two harnesses
npx skills add <source> -s verify -a claude-code windsurf -y

# A set of skills
npx skills add <source> -s verify self-review roles -a claude-code -y

# All skills, all harnesses
npx skills add <source> --all

# User-level instead of project-level
npx skills add <source> -s verify -a claude-code -g -y

# Real copies instead of symlinks
npx skills add <source> -s verify -a claude-code --copy -y
```

Verified results (project scope, `-s verify -a claude-code cursor codex`):

- The files land in `.agents/skills/verify/` and `.claude/skills/verify` is a symlink to it.
  Cursor and Codex read `.agents/skills/`, so they need no separate directory.
- With `-a claude-code windsurf gemini-cli --copy`, `SKILL.md` was copied into
  `.claude/skills/`, `.windsurf/skills/` and `.agents/skills/`.
- With `-g`, files land in `~/.agents/skills/` and `~/.claude/skills/` and
  `~/.codeium/windsurf/skills/` hold symlinks to them.
- A project install writes `skills-lock.json` (source, ref, skill path, content hash). Commit it
  to share the installed set.
- `-a claude-code` alone created a real directory in `.claude/skills/`, not a symlink.

## Target harnesses

The `-a` values and directories are listed in the CLI's `docs/agents.md` (documented, not all
tested). At 1.8.1 there are around 70, including `claude-code`, `codex`, `cursor`, `gemini-cli`,
`github-copilot`, `opencode`, `windsurf`, `cline`, `roo`, `goose` and `kiro-cli`. Many of them share the
universal `.agents/skills/` project directory; others have their own (`.claude/skills/`,
`.windsurf/skills/`). Tested: `claude-code`, `cursor`, `codex`, `windsurf`, `gemini-cli`. Whether a
harness actually loads the installed files was not tested.

## Update and remove

```sh
npx skills check          # report available updates
npx skills update -y      # update all installed skills
npx skills list           # installed skills and lock status
npx skills remove verify -g -y
```

Verified with a local git source: after a new commit, `check` reported an update, `update -y`
fetched it, and `remove` deleted the skill from the global agent directories. A skill installed
from a pinned ref stayed on that ref: `check` and `update` reported it up to date after a newer
commit landed.

## Pin to a tag or commit

```sh
npx skills add <owner>/<repo>@v1.2.3 -s verify
npx skills add <owner>/<repo>#v1.2.3 -s verify
npx skills add <owner>/<repo>#<full-commit-sha> -s verify
npx skills add https://<host>/<owner>/<repo>.git#v1.2.3 -s verify
```

Verified by installing a skill whose content differed between `v0.0.1` and the branch head: each
form above installed the tagged content, and the unpinned form installed the head content. The lock
file records `"ref": "v0.0.1"`.

- The `@` form is read as a pin only when the value looks like a version (`v1.2.3`, `1.2`) or a
  commit hash; otherwise it is read as a skill name. Use `#<ref>` for branches and other names.
- A local path source does not accept a ref (`path@v0.0.1` fails with `Local path does not exist`).
  Test pinning through a git remote.
- To move to a new tag, install again with the new ref (not tested).

## Private repositories

Documented only; the private repository itself was not installed from.

- The CLI uses the authentication already configured for the repository URL. For GitHub shorthand
  and HTTPS sources it tries normal git credentials, then `gh repo clone` if GitHub CLI is logged
  in, then SSH. SSH URLs (`git@github.com:<owner>/<repo>.git`) and other git hosts use the
  configured SSH keys or credential helper.
- It does not run `gh auth token` or copy the stored GitHub CLI credential.
- `GITHUB_TOKEN` or `GH_TOKEN` is optional and used only for GitHub API calls (tree lookups,
  update checks).
- Failures surface as `SKILLS_GIT_AUTH_FAILED`.

## Known gaps

- Private-repository access was not exercised.
- The CLI discovered skills by `SKILL.md`; no use of `.claude-plugin/marketplace.json` was observed, so the per-group plugin bundles do not apply.
  Installing a group means listing each skill after `-s`.
- A claude-code-only install is laid out differently from a multi-harness one (real directory
  versus symlink); `update` re-laid the project out as a symlink to `.agents/skills/`.
- The CLI sends anonymous usage telemetry and security-audit requests unless `DISABLE_TELEMETRY=1`
  or `DO_NOT_TRACK=1` is set (documented). GitHub repository identifiers are sent only for
  repositories GitHub confirms as public. Network traffic was not inspected.
- With a local path as the source, the lock file stores a relative path, so it is not portable.
- Pin the CLI version in scripts (`npx skills@1.8.1 ...`); flags and `experimental_` commands change between releases.
  scripts, since flags and the `experimental_` commands change between releases.
- Skills must have a `SKILL.md` with `name` and `description`; the existing validator already
  enforces this.
