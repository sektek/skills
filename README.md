# Skills

Agent Skills

## Content scan

Only `default` profile skills live under `skills/`, and git history is permanent, so nothing
environment-specific or sensitive may be committed there.

`scripts/scan-skills.mjs` flags emails, absolute home/workspace paths, credential-shaped
strings, ticket keys, Linear and internal-looking URLs, and the private terms in
`scan.config.json`. It scans only files under `skills/`, prints `file:line: rule: match`, and
exits non-zero on any finding. It does not replace manual review.

```sh
node scripts/scan-skills.mjs            # everything under skills/
node scripts/scan-skills.mjs --staged   # staged files only, read from the index
node --test                             # run the tests
```

Exceptions go in `allow` in `scan.config.json`, each with `file`, `rule` and `reason`, so they
show up in review. A deny-list entry may be `{ "term": "...", "backticked": true }` to match
only the term in backticks (for common words).

### Pre-commit hook

Activate it once per clone:

```sh
git config core.hooksPath .githooks
```

A hook cannot be enforced from the remote; it only protects clones that enable it.
