# Goose

Whether Goose can use this repository's skills tree, and how.

## Summary

- Goose finds the grouped layout (`skills/<group>/<skill>/SKILL.md`) in every location tested: project
  `.agents/skills/`, `.claude/skills/` and `.goose/skills/`, and user `~/.agents/skills/` and
  `~/.claude/skills/`. Copied trees and symlinks both work.
- All 24 skills are listed, and block-scalar descriptions are read correctly.
- Project skills are looked up from the working directory only, not from a parent directory.

## Version tested

`goose` 1.59.1, the Linux arm64 release binary (`goose-aarch64-unknown-linux-gnu`), checked
2026-11-14. The project now lives at <https://github.com/aaif-goose/goose>; the old `block/goose`
location resolves to it.

## How this was checked

Everything marked "verified" was run with a throwaway `HOME`, `env -i`, and `XDG_*` variables pointing
into a temporary directory, against a copy of this repository's `skills/` tree. No provider was
configured, no login flow ran, and no model was called. `goose skills list` needs neither.

## Install

Verified: the release tarball unpacks to a single standalone binary.

```sh
curl -sSL -O \
  https://github.com/aaif-goose/goose/releases/download/v1.59.1/goose-aarch64-unknown-linux-gnu.tar.gz
tar xzf goose-aarch64-unknown-linux-gnu.tar.gz
./goose --version
```

Not run: the `download_cli.sh` script that the release also publishes, because it would be piped
into a shell. Other documented routes (desktop app packages, Homebrew) were not tried either; see
<https://goose-docs.ai/docs/getting-started/installation>.

## Discovery

Verified in 1.59.1 with `goose skills list` run from the project root.

| Location | Grouped tree found |
|---|---|
| `.agents/skills/` in the project | yes, all 24 skills |
| `.claude/skills/` in the project | yes |
| `.goose/skills/` in the project | yes |
| `~/.agents/skills/` | yes |
| `~/.claude/skills/` | yes |

Also verified:

- Discovery is recursive: skills nested four levels under `.agents/skills/` were listed.
- Symlinks to individual skill directories, and a symlink of `.agents/skills` to the grouped tree,
  both listed all 24 skills.
- Run from a subdirectory of the project (`skills/documentation`), a project-level `.agents/skills/`
  at the project root was not found. Start Goose from the directory that holds `.agents/skills/`.

Documented only (<https://goose-docs.ai/docs/guides/context-engineering/using-skills>): installed plugins
contribute skills from `~/.agents/plugins/<plugin-name>/`, with names namespaced as `<plugin>:<skill>`.
The page recommends `.agents/skills/` as the standard path and lists the others as backward
compatible.

## Precedence

The documentation does not describe precedence. Verified by giving the same skill name different
descriptions:

1. Project `.agents/skills/` beat project `.claude/skills/` and `.goose/skills/`.
2. Project skills beat user skills.
3. User `~/.agents/skills/` beat user `~/.claude/skills/`.

The order between project `.claude/skills/` and `.goose/skills/` was not tested. Only one entry per
name is listed.
## Using this repository's skills

Keep the groups, at user level:

```sh
mkdir -p ~/.agents
cp -r skills ~/.agents/skills
```

Or per project:

```sh
mkdir -p .agents
cp -r skills .agents/skills
```

A symlink (`ln -s "$PWD/skills" .agents/skills`) also works and stays in sync with the repository.

## Check that a skill is loaded

```sh
goose skills list
```

Prints a table of name, description, token counts and location for every skill, built-in ones
(`goose-doc-guide`, `web-search`) included. The location column shows which copy won.

Documented only: the CLI `/skills` command lists skills inside a session, and `/skills <name>` loads
one by name. Not verified: that the model sees the skills or loads one, because that needs a
configured provider.

## Known gaps

- Project skills are not found from a subdirectory of the project.
- Precedence between the project `.claude/skills/` and `.goose/skills/` was not tested.
- Skill loading in a live session, and the skills extension setting that
  <https://github.com/block/agent-skills> mentions, were not exercised.
- `block/agent-skills` is flat (`<skill>/SKILL.md` at the repository root) and, per its page, archived
  on 2026-09-25, so it does not exercise the grouped layout.

## References

- <https://goose-docs.ai/docs/guides/context-engineering/using-skills>
- <https://github.com/aaif-goose/goose>
- <https://github.com/block/agent-skills>
