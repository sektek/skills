import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadConfig, scanText } from './scan-skills.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'scan-skills.mjs');
const config = {
  denyList: ['smartcar', 'e2', 'everyday electric', { term: 'design', backticked: true }],
  allow: [],
};
const rulesFor = text => scanText(text, 'skills/x/SKILL.md', config).map(f => f.rule);

const fixtures = {
  email: 'contact ' + 'someone' + '@' + 'example.com',
  'absolute-path': [
    'see /home' + '/dev/file',
    'see /Users' + '/dev/file',
    'cd /work' + 'space/other',
  ],
  credential: [
    'ghp' + '_' + 'a'.repeat(30),
    'github_pat' + '_' + 'a'.repeat(30),
    'sk' + '-' + 'a'.repeat(30),
    'AKIA' + 'A'.repeat(16),
    '-----BEGIN RSA ' + 'PRIVATE KEY-----',
    'Authorization: Bearer ' + 'a'.repeat(24),
    'API' + '_TOKEN=' + 'abcd1234',
    'SECRET' + '_KEY="abcd1234"',
  ],
  'ticket-key': ['fixes ' + 'SEK' + '-12', 'see ' + 'ENG' + '-4567'],
  'internal-url': [
    'https://linear' + '.app/team/issue/1',
    'https://git.corp' + '.internal/repo',
  ],
  'deny-term': ['the Smart' + 'car profile', 'EVERYDAY' + ' electric', 'use the `design` skill', 'an e' + '2 host'],
};

describe('rules', () => {
  for (const [rule, samples] of Object.entries(fixtures)) {
    for (const sample of [samples].flat()) {
      it(`${rule} fires on ${sample.slice(0, 24)}`, () => {
        assert.ok(rulesFor(sample).includes(rule), sample);
      });
    }
  }

  it('is silent on clean text', () => {
    const clean = [
      'Write a clear commit message.',
      'Run `npm test` and the e2e suite.',
      'Set API_TOKEN=$API_TOKEN or API_KEY=<value> in your shell.',
      'A good design makes this easy; see https://example.com/docs.',
      'Use the /tmp directory.',
    ].join('\n');
    assert.deepEqual(scanText(clean, 'skills/x/SKILL.md', config), []);
  });

  it('reports file, line, rule and match', () => {
    const [finding] = scanText('ok\n' + fixtures.email, 'skills/a/SKILL.md', config);
    assert.deepEqual(finding, {
      file: 'skills/a/SKILL.md',
      line: 2,
      rule: 'email',
      match: 'someone' + '@' + 'example.com',
    });
  });
});

describe('allow list', () => {
  const text = fixtures.email;
  const allow = [{ file: 'skills/x/SKILL.md', rule: 'email', reason: 'example' }];

  it('suppresses a matching file and rule', () => {
    assert.deepEqual(scanText(text, 'skills/x/SKILL.md', { ...config, allow }), []);
  });

  it('does not suppress another file or rule', () => {
    assert.equal(scanText(text, 'skills/y/SKILL.md', { ...config, allow }).length, 1);
    const other = [{ ...allow[0], rule: 'ticket-key' }];
    assert.equal(scanText(text, 'skills/x/SKILL.md', { ...config, allow: other }).length, 1);
  });

  it('rejects an exception without a reason', () => {
    const root = mkdtempSync(join(tmpdir(), 'scan-cfg-'));
    after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(
      join(root, 'scan.config.json'),
      JSON.stringify({ allow: [{ file: 'a', rule: 'email' }] }),
    );
    assert.throws(() => loadConfig(root), /reason/);
  });

  it('fails when scan.config.json is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'scan-cfg-'));
    after(() => rmSync(root, { recursive: true, force: true }));
    assert.throws(() => loadConfig(root), /not found/);
  });

  it('does not treat package versions as emails', () => {
    assert.deepEqual(rulesFor('npm install react@18.3.1 typescript@5.4.2'), []);
  });
});

describe('cli', () => {
  const root = mkdtempSync(join(tmpdir(), 'scan-repo-'));
  after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const run = (...args) =>
    spawnSync('node', [script, '--root', root, ...args], { encoding: 'utf8' });
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };

  git('init', '-q');
  write('scan.config.json', JSON.stringify(config));
  write('skills/clean/SKILL.md', 'Nothing to see.\n');
  git('add', '.');

  it('passes on a clean tree', () => {
    assert.equal(run().status, 0);
    assert.equal(run('--staged').status, 0);
  });

  it('scans the whole tree by default and never scans outside skills/', () => {
    write('README.md', fixtures.email);
    write('skills/bad/SKILL.md', `line one\n${fixtures.email}\n`);
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^skills\/bad\/SKILL\.md:2: email: /m);
    assert.doesNotMatch(result.stdout, /README/);
  });

  it('--staged reads the index, not the working tree', () => {
    assert.equal(run('--staged').status, 0);
    git('add', 'skills/bad/SKILL.md');
    assert.equal(run('--staged').status, 1);
    write('skills/bad/SKILL.md', 'now clean\n');
    assert.equal(run('--staged').status, 1);
    git('add', 'skills/bad/SKILL.md');
    assert.equal(run('--staged').status, 0);
  });
});

describe('entry point', () => {
  it('runs when invoked through a symlinked path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'scan-link-'));
    after(() => rmSync(dir, { recursive: true, force: true }));
    const link = join(dir, 'scripts-link');
    symlinkSync(dirname(script), link);
    const result = spawnSync('node', [join(link, 'scan-skills.mjs'), '--root', dir], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /not found/);
  });
});
