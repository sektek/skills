import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseFrontmatter, validateSkills } from './validate-skills.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'validate-skills.mjs');
const valid = (name, body = '') =>
  `---\nname: ${name}\ndescription: Does a thing.\n---\n\n# ${name}\n\n${body}\n`;

let root;
let counter = 0;

function makeSkills(files) {
  const dir = join(root, `case-${counter++}`);
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cli(dir, options = {}) {
  return spawnSync(process.execPath, dir ? [script, dir] : [script], {
    encoding: 'utf8',
    ...options,
  });
}

before(() => {
  root = mkdtempSync(join(tmpdir(), 'validate-skills-'));
});
after(() => rmSync(root, { recursive: true, force: true }));

describe('validate-skills', () => {
  it('accepts a valid skill, including in-skill links', () => {
    const dir = makeSkills({
      'grp/alpha/SKILL.md': valid(
        'alpha',
        '[ref](references/a.md#top) [web](https://x.dev) [anchor](#top) [mail](mailto:a@b.c)',
      ),
      'grp/alpha/references/a.md': '# A\n',
    });
    assert.deepEqual(validateSkills(dir), []);
    assert.equal(cli(dir).status, 0);
  });

  it('exits 0 when the default skills directory is absent or empty', () => {
    assert.equal(cli(undefined, { cwd: makeSkills({}) }).status, 0);
    assert.equal(cli(makeSkills({})).status, 0);
  });

  it('fails when an explicit skills directory does not exist', () => {
    const result = cli(join(root, 'nope'));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /nope: skills directory not found/);
  });

  it('reports missing frontmatter', () => {
    const dir = makeSkills({ 'grp/alpha/SKILL.md': '# alpha\n' });
    const result = cli(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /grp\/alpha\/SKILL\.md: missing YAML frontmatter/);
  });

  it('reports a missing SKILL.md', () => {
    const dir = makeSkills({ 'grp/alpha/notes.md': '# n\n' });
    assert.match(validateSkills(dir)[0], /grp\/alpha\/SKILL\.md: SKILL\.md is missing/);
  });

  it('reports a name that does not match the directory', () => {
    const dir = makeSkills({ 'grp/alpha/SKILL.md': valid('beta') });
    const result = cli(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /grp\/alpha\/SKILL\.md: name "beta" does not match/);
  });

  it('reports an invalid name and an empty description', () => {
    const dir = makeSkills({
      'grp/Alpha/SKILL.md': '---\nname: Alpha\ndescription: ""\n---\n',
    });
    const problems = validateSkills(dir);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /lowercase letters, digits and hyphens/);
    assert.match(problems[1], /non-empty "description"/);
  });

  it('reports a broken link', () => {
    const dir = makeSkills({ 'grp/alpha/SKILL.md': valid('alpha', '[x](missing.md)') });
    const result = cli(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /grp\/alpha\/SKILL\.md: broken link: missing\.md/);
  });

  it('reports links escaping the skill, including to other skills', () => {
    const dir = makeSkills({
      'grp/alpha/SKILL.md': valid('alpha', '[a](../../references/style.md) [b](../beta/SKILL.md)'),
      'grp/beta/SKILL.md': valid('beta'),
    });
    const problems = validateSkills(dir);
    assert.equal(problems.length, 2);
    for (const problem of problems) {
      assert.match(problem, /grp\/alpha\/SKILL\.md: link escapes the skill directory/);
    }
    assert.equal(cli(dir).status, 1);
  });

  it('checks links in nested markdown files', () => {
    const dir = makeSkills({
      'grp/alpha/SKILL.md': valid('alpha'),
      'grp/alpha/references/a.md': '[up](../../beta/SKILL.md)\n',
    });
    assert.match(validateSkills(dir)[0], /references\/a\.md: link escapes/);
  });

  it('resolves links in nested files against the file, not the skill root', () => {
    const dir = makeSkills({
      'grp/alpha/SKILL.md': valid('alpha'),
      'grp/alpha/references/a.md': '[sib](b.md) [up](../SKILL.md)\n',
      'grp/alpha/references/b.md': 'b\n',
    });
    assert.deepEqual(validateSkills(dir), []);
    const broken = makeSkills({
      'grp/alpha/SKILL.md': valid('alpha'),
      'grp/alpha/references/a.md': '[gone](c.md)\n',
      'grp/alpha/c.md': 'at the root only\n',
    });
    assert.match(validateSkills(broken)[0], /references\/a\.md: broken link: c\.md/);
  });

  it('does not treat footnote definitions as links', () => {
    const dir = makeSkills({ 'grp/alpha/SKILL.md': valid('alpha', 'text[^1]\n\n[^1]: See the docs') });
    assert.deepEqual(validateSkills(dir), []);
  });

  it('ignores links inside fenced code blocks and code spans', () => {
    const dir = makeSkills({
      'grp/alpha/SKILL.md': valid('alpha', '```md\n[x](missing.md)\n```\n\n`[y](gone.md)`'),
    });
    assert.deepEqual(validateSkills(dir), []);
  });
});

describe('validate-skills grouping', () => {
  it('accepts two groups of valid skills', () => {
    const dir = makeSkills({
      'one/alpha/SKILL.md': valid('alpha'),
      'two/beta/SKILL.md': valid('beta'),
      'two/gamma/SKILL.md': valid('gamma'),
    });
    assert.deepEqual(validateSkills(dir), []);
    assert.equal(cli(dir).status, 0);
  });

  it('reports a skill that is not inside a group', () => {
    const dir = makeSkills({ 'alpha/SKILL.md': valid('alpha') });
    const result = cli(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /alpha\/SKILL\.md: skill is not inside a group/);
  });

  it('reports a skill name used in more than one group', () => {
    const dir = makeSkills({
      'one/alpha/SKILL.md': valid('alpha'),
      'two/alpha/SKILL.md': valid('alpha'),
    });
    const problems = validateSkills(dir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /two\/alpha\/SKILL\.md: skill name "alpha" is also used in .*one\/alpha/);
    assert.equal(cli(dir).status, 1);
  });
});

describe('parseFrontmatter', () => {
  it('handles plain, quoted and block scalars', () => {
    assert.deepEqual(parseFrontmatter('---\nname: a\ndescription: "q: x"\n---\n'), {
      name: 'a',
      description: 'q: x',
    });
    assert.equal(
      parseFrontmatter('---\nname: a\ndescription: >\n  one\n  two\n---\n').description,
      'one two',
    );
    assert.equal(
      parseFrontmatter('---\nname: a\ndescription: |-\n  one\n  two\n---\n').description,
      'one\ntwo',
    );
    assert.equal(parseFrontmatter('# no frontmatter'), null);
  });
});
