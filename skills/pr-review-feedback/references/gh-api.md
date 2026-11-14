# GitHub API commands for review feedback

Part of the `pr-review-feedback` skill. `<bot-login>` is the reviewer bot's login from the
`dev-environment` skill.

## Watching for a bot review

If no review from the bot exists yet, watch for one rather than polling manually — use the REST API
(`gh api repos/.../pulls/<N>/reviews`), **not** `gh pr view --json reviews`: the latter reliably
returns `user: null` for bot-authored reviews (a `gh` CLI/GraphQL quirk), so a filter on
`.user.login == "<bot-login>"` against `gh pr view`'s output silently never
matches even once the review exists — confirmed the hard way, the monitor below timed out on a review
that had been sitting there the whole time.

```
Monitor({
  command: 'until gh api repos/<owner>/<repo>/pulls/<N>/reviews --jq \'.[] | select(.user.login == "<bot-login>")\' | grep -q .; do sleep 15; done; gh api repos/<owner>/<repo>/pulls/<N>/reviews --jq \'.[] | select(.user.login == "<bot-login>")\'',
  description: 'Bot review on <owner>/<repo>#<N>',
  timeout_ms: 600000,
})
```

Marking a draft PR ready for review does **not** automatically trigger a bot review in every repo
config — if nothing shows up after a while, check whether the PR needs to be explicitly re-requested
(the `dev-environment` skill gives the re-request command, if there is one) rather than waiting forever.

## Resolving review threads

Resolve via GraphQL — REST has no resolve endpoint. First map comments to thread IDs:

```sh
gh api graphql -f query='
query {
  repository(owner: "<owner>", name: "<repo>") {
    pullRequest(number: <N>) {
      reviewThreads(first: 20) {
        nodes { id isResolved comments(first: 1) { nodes { databaseId } } }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | {id, isResolved, firstCommentId: .comments.nodes[0].databaseId}'
```

Then resolve each:

```sh
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<threadId>"}) { thread { isResolved } } }'
```
