#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILLS_DIR = 'skills';

const RULES = [
  { rule: 'email', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g },
  {
    rule: 'absolute-path',
    pattern: /(?<![\w.])\/(?:home|Users)\/[^\s'"`)]+|(?<![\w.])\/workspace\w*(?:\/[^\s'"`)]*)?/g,
  },
  { rule: 'credential', pattern: /\bghp_[A-Za-z0-9]{20,}/g },
  { rule: 'credential', pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/g },
  { rule: 'credential', pattern: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { rule: 'credential', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { rule: 'credential', pattern: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/g },
  { rule: 'credential', pattern: /\bBearer [A-Za-z0-9._~+/=-]{16,}/g },
  {
    rule: 'credential',
    pattern: /\b[A-Z][A-Z0-9_]*(?:TOKEN|KEY)\s*=\s*["']?[^\s"'$<{(]{4,}/g,
  },
  { rule: 'ticket-key', pattern: /\b[A-Z]{2,5}-\d+\b/g },
  {
    rule: 'internal-url',
    pattern:
      /https?:\/\/(?:[^\s/'"`)]*\.)?linear\.app[^\s'"`)]*|https?:\/\/[^\s/'"`)]*\.(?:internal|corp|lan|intranet|local)(?::\d+)?(?:\/[^\s'"`)]*)?/g,
  },
];

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function denyRules(denyList) {
  return denyList.map(entry => {
    const { term, backticked = false } =
      typeof entry === 'string' ? { term: entry } : entry;
    const body = escapeRegExp(term);
    const source = backticked
      ? `\`${body}\``
      : `(?<![A-Za-z0-9_])${body}(?![A-Za-z0-9_])`;
    return { rule: 'deny-term', pattern: new RegExp(source, 'gi') };
  });
}

export function loadConfig(root) {
  const path = join(root, 'scan.config.json');
  const config = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const { denyList = [], allow = [] } = config;
  for (const entry of allow) {
    if (!entry.file || !entry.rule || !entry.reason) {
      throw new Error(
        `scan.config.json: every allow entry needs file, rule and reason: ${JSON.stringify(entry)}`,
      );
    }
  }
  return { denyList, allow };
}

export function scanText(text, file, config) {
  const rules = [...RULES, ...denyRules(config.denyList)];
  const findings = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const { rule, pattern } of rules) {
      for (const match of line.matchAll(pattern)) {
        findings.push({ file, line: index + 1, rule, match: match[0] });
      }
    }
  });
  return findings.filter(
    f => !config.allow.some(a => a.file === f.file && a.rule === f.rule),
  );
}

function listAll(root) {
  const walk = dir =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap(entry => {
      const path = `${dir}/${entry.name}`;
      return entry.isDirectory() ? walk(path) : [path];
    });
  return existsSync(join(root, SKILLS_DIR)) ? walk(SKILLS_DIR) : [];
}

function git(root, args, options = {}) {
  return execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024, ...options });
}

function listStaged(root) {
  const out = git(root, [
    'diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z', '--', `${SKILLS_DIR}/`,
  ]).toString('utf8');
  return out.split('\0').filter(Boolean);
}

export function scan({ root, staged = false }) {
  const config = loadConfig(root);
  const files = staged ? listStaged(root) : listAll(root);
  return files.flatMap(file => {
    const buffer = staged
      ? git(root, ['show', `:${file}`])
      : readFileSync(join(root, file));
    if (buffer.includes(0)) return [];
    return scanText(buffer.toString('utf8'), file, config);
  });
}

function main(argv) {
  const staged = argv.includes('--staged');
  const rootIndex = argv.indexOf('--root');
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const root = rootIndex === -1 ? defaultRoot : resolve(argv[rootIndex + 1]);
  const findings = scan({ root, staged });
  for (const { file, line, rule, match } of findings) {
    console.log(`${file.split(sep).join('/')}:${line}: ${rule}: ${match}`);
  }
  if (findings.length > 0) {
    console.error(`scan-skills: ${findings.length} finding(s)`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`scan-skills: ${error.message}`);
    process.exitCode = 2;
  }
}
