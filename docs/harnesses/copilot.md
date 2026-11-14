# GitHub Copilot

How to use the skills in this repository with GitHub Copilot, what was tested, and what is still open.

Each claim is labelled:

- **Verified**: run with the Copilot CLI, in an isolated home directory.
- **Docs**: taken from the cited GitHub or VS Code documentation, not run here.

## Tested

| Item | Value |
|---|---|
| Tool | GitHub Copilot CLI 1.0.109 (`copilot --version`) |
| Date | 2026-11-14 |
| Surfaces tested | CLI only |
| Not tested | VS Code agent mode, Visual Studio, JetBrains, Copilot cloud agent, GitHub Copilot app, Copilot code review |
| Not possible | A real prompt: the isolated home has no Copilot authentication (see [Check that a skill is used](#check-that-a-skill-is-used)) |

All CLI tests used a throwaway `COPILOT_HOME` and `HOME` outside the repository, so no personal configuration or credentials were read or changed. Flat and grouped layouts were tested on copies outside the repository.

## Terms

| Term | Meaning | Copilot CLI exposes it with |
|---|---|---|
| Installed | The files are in a place or registry Copilot reads | `copilot skill list`, `copilot plugin list` |
| Discovered | Copilot parsed `SKILL.md` and offers the skill by name and description | `copilot skill list`, `/skills list`, `/skills info` (location) |
| Used | The model chose the skill, or the developer invoked it, and `SKILL.md` entered the context | Not checked here. Docs say the model decides from the description, or the developer types `/skill-name` |

`copilot skill list` proves discovery only. It does not show that a skill was used.

## Surfaces

| Surface | Agent Skills | Status |
|---|---|---|
| Copilot CLI | Yes | Verified |
| Copilot cloud agent | Yes | Docs, not tested |
| Agent mode in VS Code, Visual Studio, JetBrains | Yes, depending on IDE version | Docs, not tested |
| GitHub Copilot app, Copilot code review | Listed as supported | Docs, not tested |

Sources:

- <https://docs.github.com/en/copilot/concepts/agents/about-agent-skills>
- <https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills>
- <https://code.visualstudio.com/docs/copilot/customization/agent-skills>
- <https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills>

The concepts page warns that supported locations depend on the surface.

## Where skills are discovered

| Scope | Directories | Status |
|---|---|---|
| Project | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | Verified for `.github/skills/` and `.claude/skills/` (CLI); `.agents/skills/` Docs |
| Personal | `~/.copilot/skills/`, `~/.agents/skills/` | Verified (CLI) |
| Custom | Directories registered with `copilot skill add <dir>` (stored as `skillDirectories` in `settings.json`), or listed in `COPILOT_SKILLS_DIRS` (comma-separated) | Verified (CLI) |
| Plugin | Skills bundled in an installed plugin | Verified (CLI, local marketplace) |
| Cloud agent personal skills | `.copilot/skills` in a dotfiles repository; not for GitHub Actions-based sessions | Docs |

`~/.copilot` can be moved with `COPILOT_HOME`. `XDG_*` variables do not move it (`copilot help environment`).

VS Code looks in the same project and personal directories for Copilot, Claude (`.claude/skills/`) and Codex (`.agents/skills/`) clients. Its `chat.agentSkillsLocations` setting is deprecated, and its Local harness is documented as being removed in February 2027. Docs.

## Does the grouped tree work as is?

This repository uses `skills/<group>/<skill>/SKILL.md` (groups `documentation`, `dev-workflow`, `environment`). Most tools expect `skills/<skill>/SKILL.md`.

Verified with the CLI (`copilot skill list`):

| Layout | Result |
|---|---|
| Flat: `<dir>/<skill>/SKILL.md`, registered with `COPILOT_SKILLS_DIRS` | All skills discovered |
| Grouped: `<dir>/documentation/<skill>/SKILL.md`, registered with `COPILOT_SKILLS_DIRS` | All skills discovered |
| This repository's `skills/` directory, registered with `COPILOT_SKILLS_DIRS` or `copilot skill add` | All 24 skills discovered |
| Grouped tree copied to `.github/skills/documentation/…` | Discovered as Project skills |
| Grouped tree copied to `.claude/skills/environment/…` | Discovered as Project skills |
| Grouped tree copied to `~/.copilot/skills/dev-workflow/…` | Discovered as Personal skills |

The CLI therefore searches below the registered directory recursively, so no adapter or flattening is needed for the CLI. The group directory is not part of the skill name; the name comes from the `name` frontmatter.

Not tested: whether VS Code, the cloud agent and `gh skill install` also recurse. The VS Code page says each skill needs its own directory with a `SKILL.md` and does not mention nesting. `gh skill install` documents the `skills/*/SKILL.md` convention, nested only under a prefix above `skills/`, and accepts an exact path such as `skills/documentation/readme` (<https://cli.github.com/manual/gh_skill_install>).

## Install steps

### Copilot CLI

Verified. Pick one.

**Register the checkout as a skills directory** (recommended for development; edits apply on the next session, or after `/skills reload`):

```sh
copilot skill add <path-to-this-repo>/skills
copilot skill list
```

For one session or a script, without touching settings:

```sh
COPILOT_SKILLS_DIRS=<path-to-this-repo>/skills copilot skill list
```

Undo with `copilot skill remove <path-to-this-repo>/skills`.

**Install as a plugin from this repository's marketplace manifest.** Copilot reads `.claude-plugin/marketplace.json`:

```sh
copilot plugin marketplace add <path-to-this-repo>
copilot plugin marketplace browse sektek-skills
copilot plugin install documentation@sektek-skills
```

A local marketplace is loaded live and nothing is copied. Adding it from GitHub (`copilot plugin marketplace add <owner>/<repo>`) is expected to work for a remote repository but was not run.

**Single skill:** `copilot skill add <path>/SKILL.md` copies one skill into `~/.copilot/skills/<name>/`; add `--project` to copy it into the project's `.github/skills/`. The help text says it materializes the `SKILL.md` file; copying of sibling files was not checked.

### VS Code, Visual Studio, JetBrains

Not tested. Docs: put skills in `.github/skills/` (project) or `~/.copilot/skills/` (personal), one directory per skill. The grouped layout may need flattening; see [Follow-ups](#follow-ups).

### Copilot cloud agent

Not tested. Docs: commit the skills under `.github/skills/`, `.claude/skills/` or `.agents/skills/` in the repository the agent works on. The documentation does not say which branch is read.

### `gh skill install`

Not tested. Docs: `gh skill install <owner>/<repo> [skill] --agent github-copilot --scope project|user` copies skills into the Copilot directories. `--scope user` installs for all projects.

## Precedence

Verified in the CLI with a skill named `readme` defined in several places at once. Only the winner is listed by `copilot skill list`. Removing the winner one location at a time gave this order, highest first:

1. Project `.github/skills/`
2. Project `.claude/skills/`
3. Personal `~/.copilot/skills/`
4. Personal `~/.agents/skills/`
5. Custom (`copilot skill add` or `COPILOT_SKILLS_DIRS`)

Project `.agents/skills/` was not placed in the order. Plugin skills were not compared with the others. The GitHub documentation does not state precedence, so this order is an observation of CLI 1.0.109 and may change.

Practical consequence: a project that carries its own skill of the same name overrides the shared one, and a personal copy overrides a registered directory.

## Plugin grouping gap

The marketplace manifest declares three plugins (`documentation`, `dev-workflow`, `environment`), each with `source: "."` and a `skills` path. Verified: after `copilot plugin install documentation@sektek-skills`, the CLI listed all 24 skills as plugin skills, including the `dev-workflow` and `environment` groups. Copilot does not apply the manifest's per-group `skills` path, so installing one plugin exposes the whole tree. The GitHub plugin documentation describes components in a `skills/` directory and does not mention a `skills` manifest field (<https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-plugins>).

Consequences:

- Per-group install is not possible with the current manifest in Copilot.
- The `environment` skills are neutral templates meant to be replaced by a private profile. If a private profile installs the same skill names, install only one implementation, as the manifest says.

## Check that a skill is used

**Not done.** `copilot -p "<prompt>"` in the isolated home stops with `No authentication information found`. Running a prompt would require signing in or passing a token, which was out of bounds for this test, so no model call was made.

What was verified is discovery only: `copilot skill list` showed `readme` (and the other documentation skills) with the description from `SKILL.md`, in each layout above.

To check use on a signed-in machine:

```sh
cd <project-with-the-skills-registered>
copilot -p "Use the readme skill to outline a README for this project." --log-level debug --log-dir <temp-dir>
```

Then look in the log directory and the session output for the skill being loaded. Docs say that when a skill is used its `SKILL.md` is injected into the context, and that `/readme` style invocation forces it. Whether the CLI log names the loaded skill was not observed. In an interactive session, `/skills info` shows a skill's location and source.

Also unverified:

- Whether the model picks a skill unprompted from its description.
- Whether the interactive CLI asks to trust a folder before loading its project skills. `copilot help environment` states that `COPILOT_ALLOW_ALL=true` trusts the working directory, "which loads that directory's skills, plugins, MCP servers, and hooks", which suggests project skills load only in a trusted directory.

## Private repositories

Not tested. Findings:

- Skills in a private repository that is checked out locally need no extra access: they are read from disk.
- Remote installs (`copilot plugin marketplace add <owner>/<repo>`, `gh skill install <owner>/<repo>`) rely on the signed-in GitHub account or git credentials. The GitHub plugin and `gh skill` documentation say nothing about private repositories. Treat private access as unconfirmed and test it before documenting it as supported.
- Cloud agent: skills committed to the repository are in the repository the agent already has access to. Docs are silent on the details.
- Do not pass a personal token to Copilot just to fetch skills; prefer a local checkout.

## Known gaps

- No real prompt was run, so "used" is not verified for any surface.
- Only the CLI was tested.
- Precedence is observed, not documented, and excludes project `.agents/skills/` and plugin skills.
- The manifest's per-group plugins are not honoured: any one plugin exposes all 24 skills.
- Whether VS Code, the cloud agent and `gh skill install` recurse into group directories is unknown.
- Private-repository installs are unconfirmed.

## Follow-ups

Proposals only; none are implemented here.

1. **Authenticated usage check.** On a machine with Copilot signed in, run the prompt above and record whether and how the CLI shows that a skill was loaded.
2. **VS Code check.** Open the repository in VS Code agent mode with the skills copied to `.github/skills/` in both flat and grouped form, and confirm discovery and use.
3. **Adapter, only if step 2 or the cloud agent fails on nesting.** A script that copies or symlinks `skills/<group>/<skill>` into a flat `.github/skills/<skill>` (or into the `~/.copilot/skills/` personal directory) so those surfaces see the usual layout. Not needed for the CLI.
4. **Per-group plugins for Copilot.** If per-group install matters, publish one `plugin.json` plus a `skills/` directory per group, since Copilot ignores the manifest's `skills` path.
