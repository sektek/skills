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
      bumpStrict: true,
      infile: 'CHANGELOG.md',
    },
  },
};
