import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateMarketplace } from './validate-marketplace.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'validate-marketplace.mjs');
const repoRoot = join(dirname(script), '..');

let root;
let counter = 0;

const entry = (name, skills) => ({ name, source: '.', strict: false, skills });

function makeRepo({ dirs = ['skills/a', 'skills/b'], manifest, raw } = {}) {
  const dir = join(root, `case-${counter++}`);
  mkdirSync(dir, { recursive: true });
  for (const path of dirs) mkdirSync(join(dir, path), { recursive: true });
  if (manifest !== undefined || raw !== undefined) {
    mkdirSync(join(dir, '.claude-plugin'));
    writeFileSync(
      join(dir, '.claude-plugin', 'marketplace.json'),
      raw ?? JSON.stringify(manifest),
    );
  }
  return dir;
}

const valid = { plugins: [entry('a', ['./skills/a/']), entry('b', ['./skills/b'])] };

before(() => {
  root = mkdtempSync(join(tmpdir(), 'validate-marketplace-'));
});
after(() => rmSync(root, { recursive: true, force: true }));

describe('validateMarketplace', () => {
  it('accepts a manifest that maps each group to one plugin', () => {
    assert.deepEqual(validateMarketplace(makeRepo({ manifest: valid })), []);
  });

  it('reports a missing manifest', () => {
    const [error] = validateMarketplace(makeRepo());
    assert.match(error, /file not found/);
  });

  it('reports JSON that does not parse', () => {
    const [error] = validateMarketplace(makeRepo({ raw: '{' }));
    assert.match(error, /marketplace\.json/);
  });

  it('requires plugins to be an array', () => {
    const [error] = validateMarketplace(makeRepo({ manifest: { plugins: {} } }));
    assert.match(error, /"plugins" must be an array/);
  });

  it('reports duplicate plugin names', () => {
    const manifest = { plugins: [entry('a', ['./skills/a/']), entry('a', ['./skills/b/'])] };
    const errors = validateMarketplace(makeRepo({ manifest }));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /duplicate plugin name "a"/);
  });

  it('reports a skills path that does not exist', () => {
    const manifest = { plugins: [...valid.plugins, entry('c', ['./skills/missing/'])] };
    const errors = validateMarketplace(makeRepo({ manifest }));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /"\.\/skills\/missing\/" does not exist/);
  });

  it('reports a skills path that is a file', () => {
    const repo = makeRepo({ manifest: valid });
    writeFileSync(join(repo, 'skills', 'file.txt'), '');
    const manifest = { plugins: [...valid.plugins, entry('c', ['./skills/file.txt'])] };
    writeFileSync(join(repo, '.claude-plugin', 'marketplace.json'), JSON.stringify(manifest));
    assert.match(validateMarketplace(repo)[0], /not a directory/);
  });

  it('reports a skills path that does not start with ./', () => {
    const manifest = { plugins: [entry('a', ['skills/a/']), entry('b', ['./skills/b/'])] };
    assert.match(validateMarketplace(makeRepo({ manifest }))[0], /starting with "\.\/"/);
  });

  it('reports a skills path that escapes the repository', () => {
    const repo = makeRepo({ manifest: valid });
    const outside = join(root, `outside-${counter++}`);
    mkdirSync(outside);
    symlinkSync(outside, join(repo, 'skills', 'escape'));
    const manifest = { plugins: [...valid.plugins, entry('c', ['./skills/escape/'])] };
    writeFileSync(join(repo, '.claude-plugin', 'marketplace.json'), JSON.stringify(manifest));
    assert.match(validateMarketplace(repo)[0], /outside the repository/);
  });

  it('reports a ../ path that leaves the repository', () => {
    const manifest = { plugins: [...valid.plugins, entry('c', ['./../'])] };
    assert.match(validateMarketplace(makeRepo({ manifest }))[0], /outside the repository/);
  });

  it('reports a group directory that no plugin uses', () => {
    const manifest = { plugins: [entry('a', ['./skills/a/'])] };
    const errors = validateMarketplace(makeRepo({ manifest }));
    assert.deepEqual(errors, ['skills/b: group directory is not used by any plugin']);
  });

  it('reports a group directory used by more than one plugin', () => {
    const manifest = { plugins: [...valid.plugins, entry('c', ['./skills/a/'])] };
    const errors = validateMarketplace(makeRepo({ manifest }));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /skills\/a: group directory is used by 2 plugins \(a, c\)/);
  });

  it('requires every plugin to list skills', () => {
    const manifest = { plugins: [...valid.plugins, { name: 'c', source: '.' }] };
    assert.match(validateMarketplace(makeRepo({ manifest }))[0], /"skills" must be a non-empty array/);
  });
});

describe('validate-marketplace CLI', () => {
  it('exits 0 for a valid repository', () => {
    const result = spawnSync(process.execPath, [script, makeRepo({ manifest: valid })], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0);
  });

  it('exits 1 and prints the errors for an invalid repository', () => {
    const result = spawnSync(process.execPath, [script, makeRepo({ manifest: { plugins: [] } })], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not used by any plugin/);
  });

  it('accepts this repository', () => {
    assert.deepEqual(validateMarketplace(repoRoot), []);
  });
});
