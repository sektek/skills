# CI fails but the local run passes

Part of the `pr-review-feedback` skill.

If CI fails on something a local run doesn't reproduce, the environments differ in some specific way —
find out which, don't just re-run locally and shrug. In one past case, `git commit` failed in CI with
"Author identity unknown" while passing locally, because the local sandbox had a git identity
pre-configured and GitHub Actions runners don't. The fix was verified by actually reproducing the CI
condition locally (`HOME=<empty dir> GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null npm test`)
rather than re-running normally and hoping.
