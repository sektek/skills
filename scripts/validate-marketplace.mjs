#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST = join('.claude-plugin', 'marketplace.json');
const SKILLS_DIR = 'skills';

function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function isInside(root, path) {
  const rel = relative(root, path);
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

export function validateMarketplace(root) {
  const errors = [];
  const manifestPath = join(root, MANIFEST);

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return [`${MANIFEST}: ${error.code === 'ENOENT' ? 'file not found' : error.message}`];
  }

  if (!Array.isArray(manifest?.plugins)) {
    return [`${MANIFEST}: "plugins" must be an array`];
  }

  const realRoot = realpathSync(root);
  const names = new Set();
  const usage = new Map();

  for (const [index, plugin] of manifest.plugins.entries()) {
    const label = `plugins[${index}]${plugin?.name ? ` (${plugin.name})` : ''}`;
    if (typeof plugin?.name !== 'string' || plugin.name === '') {
      errors.push(`${label}: "name" must be a non-empty string`);
    } else if (names.has(plugin.name)) {
      errors.push(`${label}: duplicate plugin name "${plugin.name}"`);
    } else {
      names.add(plugin.name);
    }

    const paths = plugin?.skills;
    if (!Array.isArray(paths) || paths.length === 0) {
      errors.push(`${label}: "skills" must be a non-empty array of paths`);
      continue;
    }

    for (const path of paths) {
      if (typeof path !== 'string' || !path.startsWith('./')) {
        errors.push(`${label}: skills path ${JSON.stringify(path)} must be a string starting with "./"`);
        continue;
      }
      const full = resolve(realRoot, path);
      if (!isDirectory(full)) {
        errors.push(`${label}: skills path "${path}" does not exist or is not a directory`);
        continue;
      }
      const real = realpathSync(full);
      if (!isInside(realRoot, real)) {
        errors.push(`${label}: skills path "${path}" is outside the repository`);
        continue;
      }
      usage.set(real, [...(usage.get(real) ?? []), plugin.name]);
    }
  }

  const skillsRoot = join(realRoot, SKILLS_DIR);
  if (isDirectory(skillsRoot)) {
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const users = usage.get(realpathSync(join(skillsRoot, entry.name))) ?? [];
      if (users.length === 0) {
        errors.push(`${SKILLS_DIR}/${entry.name}: group directory is not used by any plugin`);
      } else if (users.length > 1) {
        errors.push(
          `${SKILLS_DIR}/${entry.name}: group directory is used by ${users.length} plugins (${users.join(', ')})`,
        );
      }
    }
  }

  return errors;
}

function main() {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
  const errors = validateMarketplace(root);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log('Marketplace manifest is valid.');
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
