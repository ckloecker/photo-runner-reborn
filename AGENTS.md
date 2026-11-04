# Instructions for AI contributors

- Treat approved artifacts in `requirements/` as the source of truth. Do not
  invent or silently broaden product behavior.
- In all documents, one sentence per line for easier revision management.
- If requirements are missing, ambiguous, or contradictory, stop and request
  clarification instead of making assumptions.
- Before implementation, identify the requirement IDs, affected design
  artifacts, and corresponding tests. Add or update the tests first and verify
  they fail for the expected reason.
- Implement only what is needed to satisfy the approved requirements and
  design. Keep changes small and preserve existing behavior not covered by the
  change.
- Run the relevant tests and record links between requirement IDs, design,
  implementation, and verification in `traceability/`.
- Update affected requirements, design, tests, and traceability together when
  approved behavior changes.
- Before implementing issue work, inspect the project's open GitHub issues and
  implement every issue with at least one 👍 reaction.
- Re-check reaction counts before acting, and honor any explicit user exclusion
  even if the current issue has a 👍 reaction.
- Treat comments beginning with `[AI]` as specific implementation instructions
  for their issue.
- When eligible issues conflict, implement only the issue with the higher 👍
  count and close the conflicting issue with fewer 👍 reactions as a duplicate.
- Create exactly one implementation commit per issue; never combine separate
  issue fixes in one commit.
- Include a GitHub-recognized closing reference such as `Fixes #123` in each
  issue commit message, and verify the exact message with
  `git show -s --format=%B HEAD`.
- A closing reference closes an issue only after its commit reaches the
  repository's default branch; do not report closure before the push or merge.
- Cross-cutting requirements, design, tests, and traceability may use a separate
  non-closing commit that references every affected issue.
- Close each resolved issue through its corresponding commit message using a
  GitHub-resolving keyword such as `Fixes #123`.
- Keep cross-cutting issue-workflow documentation in a separate commit with
  non-closing references to the applicable issue numbers.
