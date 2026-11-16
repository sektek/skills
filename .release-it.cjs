const RELEASE_LEVEL = { breaking: 0, feat: 1, fix: 2 };

function whatBump(commits) {
  let level = null;
  for (const commit of commits) {
    let commitLevel = null;
    if (commit.notes.length > 0) {
      commitLevel = RELEASE_LEVEL.breaking;
    } else if (commit.type === 'feat') {
      commitLevel = RELEASE_LEVEL.feat;
    } else if (commit.type === 'fix' || commit.type === 'perf') {
      commitLevel = RELEASE_LEVEL.fix;
    }
    if (commitLevel !== null && (level === null || commitLevel < level)) {
      level = commitLevel;
    }
  }
  return level === null ? null : { level };
}

module.exports = {
  git: {
    commitMessage: 'chore: release v${version} [skip ci]',
    tagName: 'v${version}',
    push: true,
    pushArgs: ['--follow-tags'],
  },
  github: {
    release: true,
    releaseName: 'v${version}',
  },
  npm: {
    publish: false,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: { name: 'conventionalcommits' },
      whatBump,
      infile: 'CHANGELOG.md',
    },
  },
};
