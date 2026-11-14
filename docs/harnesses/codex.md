# Using the skills in Codex

Codex CLI reads the `skills/` tree as it is. The grouped layout
(`skills/<group>/<skill>/SKILL.md`) needs no adapter and no extra manifest.
It also reads this repository's Claude Code marketplace manifest, so the groups
install as Codex plugins.

Tested with `codex-cli 0.167.0`. Everything marked "verified" below was run
against an isolated Codex home (a temporary `HOME` and `CODEX_HOME` with no
credentials). Items marked "from documentation" were not run.

## Installed, discovered, used

Codex exposes only the middle step.

| Stage | Meaning | Observable in Codex |
|---|---|---|
| Installed | The files are in a location Codex scans, or a plugin is enabled | `codex plugin list`, the filesystem |
| Discovered | Codex put the skill in the catalog sent to the model (name, description, path) | `codex debug prompt-input` |
| Used | The model read the `SKILL.md` body for a prompt | Needs a real model call; not observed here |

`codex debug prompt-input "<prompt>"` prints the model-visible input as JSON,
including the "Skills" section, without calling the model and without
credentials. Run it from the directory you would start Codex in. Use this to
check discovery.

## Install

Pick one. All three were verified to make all 24 skills discoverable.

### Option 1: user-wide, link the tree

```sh
git clone <repository-url> ~/src/skills
mkdir -p ~/.agents
ln -s ~/src/skills/skills ~/.agents/skills
```

Updates are then a `git pull`. A real copy (`cp -r skills ~/.agents/skills`)
works the same way but does not update itself.

### Option 2: per project

Put or link the tree at `<project>/.agents/skills`. Codex scans it from the
working directory up to the repository root.

### Option 3: Codex plugins from the marketplace manifest

```sh
codex plugin marketplace add <path-or-git-source-of-this-repository>
codex plugin list
codex plugin add documentation@sektek-skills
codex plugin add dev-workflow@sektek-skills
codex plugin add environment@sektek-skills
```

Each plugin exposes one group. Plugin skills are listed with a prefix, for
example `documentation:readme`. Codex copies the whole repository into
`~/.codex/plugins/cache/<marketplace>/<plugin>/local/` and generates a
`.codex-plugin/plugin.json` there from the Claude manifest entry. Only the
group named in the entry's `skills` path is exposed.

## Where skills land and are discovered

Verified, by listing the catalog with `codex debug prompt-input`:

| Location | Scope | Result |
|---|---|---|
| `~/.agents/skills` (real copy or symlink) | User | Discovered |
| `~/.codex/skills` | User | Discovered |
| `<project>/.agents/skills`, from the project root or any subdirectory | Project | Discovered |
| `<project>/.codex/skills` | Project | Discovered |
| `<project>/.agents/skills` in a directory that is not a git repository | Project | Discovered |

From documentation, not verified: `/etc/codex/skills` (admin) and skills
bundled with Codex. The bundled ones (`skill-creator`, `skill-installer`,
`openai-docs`, `imagegen`) appeared in every catalog, written to
`~/.codex/skills/.system`.
Source: <https://learn.chatgpt.com/docs/build-skills> (reached from
<https://developers.openai.com/codex/skills>).

## Nesting

Verified with copies of the tree outside the repository:

- Grouped (`<root>/<group>/<skill>/SKILL.md`): all 24 skills discovered, in
  both a user-wide and a project location.
- Flat (`<root>/<skill>/SKILL.md`): all 24 skills discovered.
- Extra depth: a skill four directories below the root (`a/b/c/d/deep`) was
  discovered, so Codex scans recursively and the group level is not a problem.
- The skill name comes from the `name` frontmatter, not the directory name.
- A `SKILL.md` without `description` was silently skipped.

## Precedence

Verified: a skill with the same `name` in all four of `~/.agents/skills`,
`~/.codex/skills`, `<project>/.agents/skills` and `<project>/.codex/skills`
was listed four times. Codex does not merge or override same-named skills, so
there is no precedence to rely on. The documentation says the same ("not
merged"; both appear in selectors). Listed order was project `.agents`,
project `.codex`, user `.agents`, user `.codex`, but that order is observed,
not a documented rule.

Keep each skill name in one place. In particular, do not install both a plugin
and a user-wide copy of the same tree. That should list every skill twice (not
tried). The `environment` skills are templates that
a private profile replaces, so install only one implementation of each.

## Updates

- Linked or project tree: Codex reads the files directly. From
  documentation, changes are detected automatically and a restart is needed
  only if a skill does not show up. Not verified, because
  `codex debug prompt-input` starts fresh each time.
- Plugins: the install is a snapshot. Verified: editing a skill in the source
  checkout did not change the installed plugin until `codex plugin remove` and
  `codex plugin add` were run again for that plugin.
  `codex plugin marketplace upgrade` is documented by `--help` to refresh Git
  marketplace snapshots only (not tried; a local source was used).

## Check that a documentation skill is loaded

Discovery, verified:

```sh
cd <project>
codex debug prompt-input "Write a README for this project" | grep -o 'readme: [^(]*'
```

The catalog line for `readme` (or `documentation:readme` for the plugin) is
present with the description from its frontmatter.

Use on a real prompt: not observed. `codex exec` in the isolated home failed
with `401 Unauthorized` (no credentials, and no login was run), so no model
call was made. From the instructions Codex puts in the prompt: the model sees
only name, description and path, and reads `SKILL.md` when the task matches the
description or the skill is named. To check use with a signed-in Codex, start
it, type `$` or run `/skills` to select `readme`, or ask for a README and
confirm in the transcript that the model opened `.../readme/SKILL.md`.

## Known gaps

- Use on a real prompt, and update detection in a running session, were not
  verified (no credentials in the test home).
- No precedence between same-named skills. Avoid duplicates.
- Plugin installs copy the whole repository for each plugin.
- Git marketplace sources (`owner/repo`, HTTPS or SSH) were not tried, only a
  local path.
- Skills that reference Claude Code tools or other skills by name (for example
  `gh-stack`, which is not in this repository) will not resolve in Codex.
- Optional `agents/openai.yaml` (for example `allow_implicit_invocation`) is not
  provided for any skill.
