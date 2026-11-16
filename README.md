# Skills

A collection of reusable Agent Skills for documentation work and for a
ticket-to-pull-request development workflow. Each skill is a directory with a `SKILL.md` that an
agent loads when a task matches the skill's description.

The skills are written for Claude Code and organized as a Claude Code plugin marketplace. They are
plain `SKILL.md` files, so other harnesses can read them too; see [Other harnesses](#other-harnesses).

Environment-specific implementations of the environment skills live outside this repository.

## Plugins and skills

Skills live at `skills/<group>/<skill>/SKILL.md`. The marketplace manifest,
[`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json), defines a marketplace named
`sektek-skills` with one plugin per group. A plugin's skills are invoked as `<plugin>:<skill>`, for
example `documentation:readme`.

### documentation

Researching, writing, and reviewing developer documentation.

| Skill | Purpose |
|---|---|
| `api-research` | Research a project's public APIs, terminology, and contracts before documenting them |
| `code-examples` | Write and verify code examples |
| `conceptual-documentation` | Explain a system's mental model without duplicating reference or how-to guides |
| `documentation-review` | Review documentation |
| `documentation-workflow` | Decide where a documentation change belongs |
| `how-to-guide` | Task-oriented guides that end in a verifiable outcome |
| `jsdoc` | JSDoc and TSDoc comments on JavaScript and TypeScript declarations |
| `markdown-authoring` | Markdown conventions |
| `readme` | Create, revise, or review README files |
| `technical-writing` | Editorial conventions for developer-facing documentation |

### dev-workflow

Taking work from a Linear ticket to reviewed pull requests.

| Skill | Purpose |
|---|---|
| `create-pr` | Publish a PR, or a stack, as drafts with a consistent title and body |
| `create-project` | Create a Linear project with milestones and parallelizable tickets |
| `create-ticket` | Write well-formed Linear issues |
| `create-worktree` | Set up a git worktree for work that needs its own branch |
| `linear-dev-cycle` | Take a ticket from intake to merged PRs |
| `pr-review-feedback` | Handle review feedback on a PR |
| `remove-worktree` | Safely remove a worktree once its work is published |
| `self-review` | Review the agent's own branch before it becomes a PR |
| `sync-stacked-branch` | Bring a stacked branch up to date with its base |
| `verify` | Run type check, lint, and tests before committing |

### environment

Shared vocabulary (`roles`) and neutral templates (`branch-naming`, `linear-workspace`,
`dev-environment`) for the conventions the other skills read. See
[Environment skills](#environment-skills).

| Skill | Purpose |
|---|---|
| `roles` | Defines "the developer" and "the agent" (shared vocabulary, not a template) |
| `branch-naming` | Branch naming convention |
| `linear-workspace` | Linear team, labels, and title conventions |
| `dev-environment` | Build, lint, and test commands, worktree setup, commit and release rules |

`gh-stack` is intentionally not in this repository. Several `dev-workflow` skills refer to it by
name; install it from its upstream GitHub repository, [github/gh-stack](https://github.com/github/gh-stack).

## Install with Claude Code

Add the marketplace, then install the plugins you want:

```text
/plugin marketplace add sektek/skills
/plugin install documentation@sektek-skills
/plugin install dev-workflow@sektek-skills
/plugin install environment@sektek-skills
```

The same operations are available in a shell as `claude plugin marketplace add <source>` and
`claude plugin install <plugin>@sektek-skills`. The source can also be a local path to a checkout,
which is the form that was run to check these commands. Adding it from GitHub was not run. A private checkout needs access through a signed-in GitHub
account or git credentials.

Skills refer to each other by name. Many tell the agent to stop and ask when a skill they need is
missing, so install the plugins together. `dev-workflow` also needs `gh-stack`, which is not in
this repository.

## Environment skills

The `environment` plugin holds `roles`, which is shared vocabulary, and three neutral templates:
`branch-naming`, `linear-workspace`, and `dev-environment`. The templates set no
environment-specific values. Other skills read them whenever
they need a branch name, a ticket or PR title style, or a build, lint, or test command.

To supply your own values, write a private implementation of each template under the same name,
keeping the sections the template lists under "What an implementation must provide". Install
exactly one implementation of each template. `roles` has no implementation contract: install one
copy and keep it neutral. Do not rely on two skills with the same name
overriding each other: harnesses differ in how they treat duplicates, and some list both.

Plugins are per group, so with a private implementation either skip the `environment` plugin and
install `roles` another way, or make sure the duplicates are not both loaded. On Copilot, any one
plugin exposes every skill, so install the private implementation in place of this repository's
plugins.

## Other harnesses

The skills are plain `SKILL.md` files, so harnesses that read the Agent Skills format can use
them. Each page records what was tested and how.

| Harness | Finding | Details |
|---|---|---|
| Codex | Reads the grouped tree as is, and also installs the plugins from the marketplace manifest. All 24 skills were discoverable | [codex.md](docs/harnesses/codex.md) |
| GitHub Copilot | The CLI discovers the grouped tree. Installing any one plugin exposes all 24 skills, not just its group | [copilot.md](docs/harnesses/copilot.md) |
| skills CLI | Installs from the grouped tree unchanged into several harnesses with one command | [skills-cli.md](docs/harnesses/skills-cli.md) |
| Docker Agent | Finds the grouped tree only under `~/.agents/skills/`. Block-scalar descriptions (`description: >` or `|`) are read as the literal `>` or `|`, which affects 12 of the 24 skills | [docker-agent.md](docs/harnesses/docker-agent.md) |
| Goose | Finds the grouped tree in every location tested; all 24 skills listed with correct descriptions | [goose.md](docs/harnesses/goose.md) |

These checks show that skills are installed and discovered. Whether a model actually used a skill
on a real prompt was not verified for any harness. Skills that mention Claude Code tools, or
`gh-stack`, will not resolve everywhere.

## Install with dotfiles

A dotfiles setup can install the portable skills straight from a release instead of through a
plugin marketplace. The author's dotfiles installer does this:

1. It reads the pinned tag from a `skills.version` file in the dotfiles repository (currently
   `v1.0.0`).
2. It clones this repository at that tag into a temporary directory. It stops with an error, and
   leaves the installed skills alone, if the clone fails.
3. It copies each `skills/<group>/<name>` directory to `~/.claude/skills/<name>/`, dropping the
   group directory. Skill names are unique across groups.
4. It then copies the profile's own skills over the top. A profile overrides a skill, such as one
   of the environment skills, by shipping a directory with the same name.

To move to a newer release, change the tag in `skills.version` and run the installer again.

## Releases and versions

Releases are cut from `main` with [release-it](https://github.com/release-it/release-it). Each
release is a git tag (`v1.0.0` is the first), a GitHub release with generated notes, and an updated
`CHANGELOG.md`. Nothing is published to npm.

Versions follow semantic versioning, derived from the commit types since the last tag:

| Commit | Release |
|---|---|
| `feat` | minor (`1.0.0` to `1.1.0`) |
| `fix`, `perf` | patch (`1.0.0` to `1.0.1`) |
| a breaking change (`!` or a `BREAKING CHANGE` footer) | major |
| `docs`, `chore`, `ci`, and the like | no release |

A tag identifies the whole repository, so plugin entries in the manifest carry no `version` field.
To pin a Claude Code marketplace install to a release, add `#<tag>` to the source:

```text
/plugin marketplace add sektek/skills#v1.0.0
```

Without the `#<tag>`, the marketplace follows the default branch. In the dotfiles install, the pin
is the tag in `skills.version`.

## Contributing

See [CLAUDE.md](CLAUDE.md) for the layout, checks, and rules for adding or changing skills.

## License

[MIT](LICENSE)
