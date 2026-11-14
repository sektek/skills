# Parent and sub-issue descriptions

Part of the `create-ticket` skill. Used only in standalone mode, when the work is a parent
with sub-issues. The single-issue template these build on is in `SKILL.md`, section 3.

## Parent description

Same as the single-issue description, except:

- Replace **Repo / base branch** with:
  ```markdown
  ## Repos

  The repos this change touches (`<org>/<repo>`). Branches are per sub-issue.
  ```
- **Blocked by** lists only issues outside this parent.
- **Scope** summarises the full change rather than listing every file.
- **Verification** covers the whole change.
- Don't list the sub-issues, because Linear already shows them.

## Sub-issue description

Shorter. Background lives in the parent, so don't repeat it.

```markdown
## Overview

At most 3 sentences: what this unit does and how.

## Repo / base branch

`<org>/<repo>`, off the default branch, or stacked on <sibling> when it builds on that
unmerged sibling.

## Scope

* Every file this unit modifies or creates, and the symbols in each, plus its tests.
* Shared files / Merge together with, as in the single-issue template.
* Out of scope: <what a neighbouring sub-issue handles instead>.

## Verification

* How to confirm this unit alone is done (the tests to pass, the behaviour to observe).
```
