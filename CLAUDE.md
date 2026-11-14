# CLAUDE.md

Agent Skills, published as a Claude Code plugin marketplace named `sektek-skills`. See
[README.md](README.md) for what is in it.

## Layout

- `skills/<group>/<skill>/SKILL.md`: groups `documentation`, `dev-workflow`, `environment`.
- `.claude-plugin/marketplace.json`: one plugin per group (`source` ".", `strict` false, `skills`
  path to the group). No `version` field in plugin entries.
- `scripts/`: the skill and marketplace validators, with their tests.
- `docs/harnesses/`: how each other harness handles this tree.

## Commands

```sh
node --test
node scripts/validate-skills.mjs
node scripts/validate-marketplace.mjs
```

Run all three before committing; CI runs the same. `node --test scripts/` fails on Node 24, so
run `node --test` without a path.

## Rules

- Skills are self-contained: no link may leave a skill's own directory. Refer to other skills by
  name, with a line telling the agent to stop and ask when a needed skill is missing.
- Skill names are unique across all groups.
- To add a skill, put it under the right group and make the marketplace check pass.
- `branch-naming`, `linear-workspace` and `dev-environment` in `environment` are neutral templates
  that a private implementation replaces; exactly one implementation of each must be installed.
  `roles` is shared vocabulary, not a template; keep it neutral. `gh-stack` is deliberately absent; it is installed
  from its upstream repository.
- No scanner exists. Before committing an imported or new skill, review it line by line for names
  of people, projects, organizations, or customers; internal URLs; ticket keys; emails; absolute
  paths; tokens; and anything specific to one environment.

## Commits and releases

Conventional Commits. Releases are planned (release-it from `main`, not set up yet). The intended
rule: `feat` and `fix` on skill content release; `docs`, `chore`, and `ci` do not. Pick the type
with that in mind.
