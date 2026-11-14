# Docker Agent

Whether Docker Agent can use this repository's skills tree, and how.

## Summary

- Docker Agent finds skills in `~/.agents/skills/` recursively, so the grouped layout
  (`skills/<group>/<skill>/SKILL.md`) works there.
- Project directories (`.agents/skills/`, `.claude/skills/`) are scanned flat, so the grouped layout is
  not found there. Symlinked skill directories were not followed in the project scan either.
- Block-scalar descriptions (`description: >` and `description: |`) are read as the literal `>` or `|`.
  Twelve of the 24 skills are affected.

## Version tested

`docker-agent` v1.161.0 (commit `62d0e13`), the Linux arm64 release binary, checked 2026-11-14.

## How this was checked

Everything marked "verified" was run with a throwaway `HOME`, `env -i`, and `TELEMETRY_ENABLED=false`,
against a copy of this repository's `skills/` tree. No login flow ran and no real credentials were used.
No model was called. The `debug skills` command lists skills without calling the provider, but it refuses to start
without the provider's API variable set, so a placeholder value stood in for it.

## Install

Verified: the release binary runs standalone.

```sh
curl -sSL -o docker-agent \
  https://github.com/docker/docker-agent/releases/download/v1.161.0/docker-agent-linux-arm64
chmod +x docker-agent
./docker-agent version
```

Documented only (<https://docs.docker.com/ai/docker-agent/>):

- Docker Desktop 4.63 and later ship it as `docker agent`. Earlier releases called it `cagent`.
- `brew install docker-agent` and `winget install Docker.Agent`.
- Copy the binary to `~/.docker/cli-plugins/` to run it as `docker agent`.

## Enable skills

Set `skills: true` on the agent (documented at
<https://docker.github.io/docker-agent/features/skills/>). Verified: with `skills: false` no skills were
listed, with `skills: true` they were. The default when the key is omitted was not checked.

```yaml
agents:
  root:
    model: openai/gpt-4o
    instruction: Use the available skills.
    skills: true
```

The agent also needs a filesystem toolset to read skill files (documented only).

## Discovery

Verified in v1.161.0 by running `debug skills` against each placement.

| Location | Scan | Grouped tree found |
|---|---|---|
| `~/.agents/skills/` | recursive | yes, all 24 skills |
| `~/.claude/skills/` | flat | no |
| `.agents/skills/` in the project | flat | no |
| `.claude/skills/` in the project | flat | no |

Also verified:

- A flat skill (`.agents/skills/roles/SKILL.md`) is found from the project root and from a
  subdirectory of the project, so the project scan walks up from the working directory.
- A symlink to a skill directory inside `.agents/skills/`, and a symlink of `.agents/skills` itself to
  the grouped tree, both listed no skills. Copied directories work.

Documented only: `~/.codex/skills/` (recursive) and `.github/skills/` (flat) are also scanned.

## Precedence

Documented: global skills load first, then project skills from the git root toward the working
directory, and the closest wins. `.agents/skills/` overrides `.github/skills/` at the same level, and an
inline skill in the agent config overrides any discovered one.

Verified: a skill named `roles` in both `~/.agents/skills/` and the project's `.agents/skills/`
resolved to the project copy.

## Using this repository's skills

Install the tree at the user level, keeping the groups:

```sh
mkdir -p ~/.agents
cp -r skills ~/.agents/skills
```

For a project-level install, flatten the groups into real directories (not symlinks):

```sh
mkdir -p .agents/skills
for dir in skills/*/*/; do cp -r "$dir" ".agents/skills/$(basename "$dir")"; done
```

## Check that a skill is loaded

```sh
docker-agent debug skills agent.yaml
docker-agent debug skills agent.yaml --json
```

The first prints `N skill(s) for root:` followed by each name and description. The JSON form includes the
`path` of each `SKILL.md`, which shows which location won. A placement that is not scanned prints
`No skills for root`.

Not verified: that the skill list reaches the model, `/<skill-name>` in the TUI, and sandbox runs. All need a
model or a Docker sandbox. Documented only: the name and description go into the system prompt at startup
and the body loads when a request matches.

## Known gaps

- Project directories are flat, so this repository's groups are invisible there. Use the user-level
  install or flatten.
- Symlinked skill directories are not followed, so a symlink-based install does not work.
- Folded and literal block descriptions (`>` and `|`) are read as a single character, so the agent has
  no useful description to match on for those twelve skills. Single-line
  descriptions are read correctly. This is a content change, so it is not made here.
- The docs differ between releases on where `.agents/skills` is scanned from, so re-check after upgrading.

List the affected skills:

```sh
docker-agent debug skills agent.yaml | grep -E ' - [>|]$'
```

## References

- <https://docs.docker.com/ai/docker-agent/>
- <https://docker.github.io/docker-agent/features/skills/>
- <https://github.com/docker/skills>: its `skills/` directory is flat, one level, so it does not exercise
  the grouped layout. It does not list Docker Agent's skill paths.
