# End-to-end verification report

Date: 2026-11-18. Tested revision: `5bf081b` on `main` (`v1.0.1` plus one commit; latest tag
`v1.0.1`, first release `v1.0.0`). The repository was public.

Every check ran in a throwaway home directory and an isolated config directory, never in a real
user profile. "No credentials" means the environment variables for GitHub tokens were unset and
git's system and global config were disabled, so no credential helper could answer.

## Summary

| Area | Result |
|---|---|
| Claude Code: add marketplace and install the three plugins, no credentials | Pass |
| Claude Code: pin to a tag, update commands | Pass |
| Claude Code: private environment plugins (two private repos) | Pass, from local checkouts at `v1.0.0` (see notes) |
| Dotfiles: `install.sh` installs no skills, for each of its three profiles | Pass |
| Release: a `feat` merged to `main` produced a tag and GitHub release | Not verified (see notes) |
| README and `docs/harnesses/` commands | Pass for Claude Code, Codex, Copilot and the skills CLI; Goose and Docker Agent not run |

Three gaps are tracked as follow-up tickets in the project's `follow-up` milestone.

## Claude Code

Clean profile, no credentials:

```text
claude plugin marketplace add sektek/skills          # added: sektek-skills
claude plugin install documentation@sektek-skills    # installed
claude plugin install dev-workflow@sektek-skills     # installed
claude plugin install environment@sektek-skills      # installed
```

`claude plugin details <plugin>@sektek-skills` lists exactly the expected skills and nothing else:

| Plugin | Skills |
|---|---|
| `documentation` (10) | api-research, code-examples, conceptual-documentation, documentation-review, documentation-workflow, how-to-guide, jsdoc, markdown-authoring, readme, technical-writing |
| `dev-workflow` (10) | create-pr, create-project, create-ticket, create-worktree, linear-dev-cycle, pr-review-feedback, remove-worktree, self-review, sync-stacked-branch, verify |
| `environment` (4) | branch-naming, dev-environment, linear-workspace, roles |

Each plugin reports version `5bf081bf3d41`, the tested revision. Each plugin's cache directory holds
a full copy of the repository, but only the skills above are exposed.

- Pinning, `claude plugin marketplace add sektek/skills#v1.0.0`, with no credentials: pass. The
  installed plugin was the `v1.0.0` revision, not `main`.
- `claude plugin marketplace update sektek-skills` and
  `claude plugin update documentation@sektek-skills`: pass; the plugin was already at the latest
  version.
- Attempting to add one of the private skill repos from GitHub with no credentials fails with
  "Please make sure you have the correct access rights", as expected for a private repository.

## Private environment plugins

Each private repo has an `environment` plugin and was installed in its own profile, so only one
implementation of each environment skill is present. The neutral `environment` plugin from this
repository was not installed in either profile.

| Repo | Version | Skills exposed |
|---|---|---|
| First private repo | `v1.0.0` | 6 |
| Second private repo | `v1.0.0` | 5 |

Each list matches that repo's `skills/environment/` directory exactly, with no other skills. The
skill names are not listed here because the repos are private.

Note: both were added from local checkouts at the `v1.0.0` tag, the form the README documents as
tested. Adding a private repo from GitHub needs git credentials; that path was not run with a
developer's credentials in this verification.

Neither private plugin includes `roles`, so a profile using one still needs `roles` from the
neutral plugin or another source, as the README says.

## Dotfiles

`install.sh` was run once per profile (three profiles) in a clean home directory (with an
existing `~/.oh-my-zsh` so it did not download Oh My Zsh):

| Profile | Exit status | Skill directories created |
|---|---|---|
| Profile 1 (`default`) | 0 | none |
| Profile 2 | 0 | none |
| Profile 3 | 0 | none (it copies its own dotfiles) |

No `.claude`, `.codex`, `.copilot` or `.agents` directory appeared in any home.

## Release

- `sektek/skills`: tags `v1.0.0` and `v1.0.1`, each with a GitHub release and a `CHANGELOG.md`
  entry.
- Both private repos: `v1.0.0` released by dispatch on 2026-11-18, each with a tag, a GitHub release
  and a changelog entry.

Not verified: that a `feat` merged to `main` produces a release on its own. Every release so far
was dispatched by hand or came from a docs-only commit made before the bump rules were fixed
(`v1.0.1`). Dry runs of the bump rules passed, but the push-triggered workflow has not run for a
`feat` or `fix`. A follow-up ticket records the check for the next releasable merge.

## README and harness pages

| Page | Commands | Result |
|---|---|---|
| README, Install with Claude Code | marketplace add, plugin install, pin with `#<tag>` | Pass |
| `docs/harnesses/codex.md` | `codex plugin marketplace add`, `codex plugin add` (3 plugins), `codex plugin list` | Pass; all three installed and enabled |
| `docs/harnesses/copilot.md` | `copilot plugin marketplace add`, `browse`, `plugin install documentation@sektek-skills`, `skill list` | Pass; installing one plugin exposes all 24 skills (plus 3 built in), as documented |
| `docs/harnesses/skills-cli.md` | `npx skills@1.8.1 add <source> --list` | Pass; lists the 24 skills |
| `docs/harnesses/goose.md`, `docs/harnesses/docker-agent.md` | `goose`, `docker-agent` | Not run: neither CLI is installed in the verification environment |

Only the discovery and listing commands in the Codex, Copilot and skills CLI pages were run; the
harness-specific install variants (`--copy`, `-g`, per-skill selection, `skills update` and so on)
were not repeated.

## Findings

1. The README still has an "Install with dotfiles" section, and a sentence in "Releases and
   versions" about the dotfiles pin. Dotfiles no longer installs skills, so both are stale. The
   README also says adding the marketplace from GitHub "was not run"; it has now been run.
2. No push-triggered release has been verified (above).
3. The Goose and Docker Agent commands were not run (above).
