#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const NAME_PATTERN = /^[a-z0-9-]+$/;
const EXTERNAL_LINK = /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i;

export function parseFrontmatter(text) {
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!match) return null;

  const data = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const entry = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(lines[i]);
    if (!entry) continue;

    const [, key, rest] = entry;
    const continuation = [];
    while (i + 1 < lines.length && /^(?:[ \t]+\S|[ \t]*$)/.test(lines[i + 1])) {
      continuation.push(lines[++i].trim());
    }

    const block = /^([>|])[+-]?\d*[ \t]*$/.exec(rest);
    if (block) {
      data[key] = continuation.join(block[1] === '>' ? ' ' : '\n').trim();
    } else {
      const value = [rest.trim(), ...continuation].filter(Boolean).join(' ');
      data[key] = value.replace(/^(["'])([\s\S]*)\1$/, '$2');
    }
  }
  return data;
}

function stripCode(markdown) {
  const kept = [];
  let fence = null;
  for (const line of markdown.split(/\r?\n/)) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) {
        fence = null;
      }
      kept.push('');
    } else if (marker) {
      fence = marker[1];
      kept.push('');
    } else {
      kept.push(line.replace(/(`+)[^`]*?\1/g, ''));
    }
  }
  return kept.join('\n');
}

function extractLinkTargets(markdown) {
  const text = stripCode(markdown);
  const targets = [];
  const inline = /!?\[[^\]]*\]\(\s*(<[^>]*>|[^\s)]*)/g;
  const reference = /^ {0,3}\[(?!\^)[^\]]+\]:[ \t]*(<[^>]*>|\S+)/gm;
  for (const pattern of [inline, reference]) {
    for (const [, raw] of text.matchAll(pattern)) {
      targets.push(raw.replace(/^<|>$/g, ''));
    }
  }
  return targets;
}

function checkLinks(skillDir, file, markdown, report) {
  for (const raw of extractLinkTargets(markdown)) {
    if (!raw || EXTERNAL_LINK.test(raw)) continue;

    let path = raw.replace(/[#?].*$/, '');
    if (!path) continue;
    try {
      path = decodeURIComponent(path);
    } catch {
      // keep the undecoded path
    }

    const resolved = resolve(dirname(file), path);
    const rel = relative(skillDir, resolved);
    if (isAbsolute(path) || rel === '..' || rel.startsWith('..' + '/') || isAbsolute(rel)) {
      report(file, `link escapes the skill directory: ${raw}`);
    } else if (!existsSync(resolved)) {
      report(file, `broken link: ${raw}`);
    }
  }
}

function listMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdown(full);
    return entry.name.toLowerCase().endsWith('.md') ? [full] : [];
  });
}

export function validateSkills(skillsDir) {
  const problems = [];
  if (!existsSync(skillsDir)) return problems;

  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const name of dirs) {
    const skillDir = join(skillsDir, name);
    const report = (file, message) => problems.push(`${file}: ${message}`);
    const skillFile = join(skillDir, 'SKILL.md');

    if (!existsSync(skillFile) || !statSync(skillFile).isFile()) {
      report(skillFile, 'SKILL.md is missing');
      continue;
    }

    const frontmatter = parseFrontmatter(readFileSync(skillFile, 'utf8'));
    if (!frontmatter) {
      report(skillFile, 'missing YAML frontmatter');
    } else {
      if (!frontmatter.name) {
        report(skillFile, 'frontmatter is missing "name"');
      } else if (!NAME_PATTERN.test(frontmatter.name)) {
        report(skillFile, `name "${frontmatter.name}" must use only lowercase letters, digits and hyphens`);
      } else if (frontmatter.name !== basename(skillDir)) {
        report(skillFile, `name "${frontmatter.name}" does not match directory "${name}"`);
      }
      if (!frontmatter.description) {
        report(skillFile, 'frontmatter is missing a non-empty "description"');
      }
    }

    for (const file of listMarkdown(skillDir)) {
      checkLinks(skillDir, file, readFileSync(file, 'utf8'), report);
    }
  }
  return problems;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const explicit = process.argv[2];
  if (explicit && !existsSync(explicit)) {
    console.error(`${explicit}: skills directory not found`);
    process.exit(2);
  }
  const problems = validateSkills(resolve(explicit ?? 'skills'));
  for (const problem of problems) console.error(problem);
  process.exit(problems.length ? 1 : 0);
}
