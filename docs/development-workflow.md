# Development documentation workflow

Updated: 2026-11-01

## Purpose
Maintain an auditable connection between scenario design, implementation, deployment and observed behavior. The product vision and existing design principles remain authoritative; this workflow adds traceability rather than replacing them.

## Records
- `decisions/Sxx.md`: one durable record per scenario. Record each decision as `Sxx-Dnn`, alternatives, rationale, state (Proposed, Approved, Superseded), date, and links to related records.
- `docs/implementation-status.md`: scenario-by-scenario implementation status and evidence links.
- `docs/verification-log.md`: test cases, environments, actual results, failures and unverified behavior.
- Git history: source of truth for changes to documentation and code. Link commits and preview URLs in the records.

## Standard workflow
1. Inspect current documentation and the affected implementation before editing.
2. Discuss one design decision at a time. Record only decisions the reader explicitly approves; mark pending questions separately.
3. Update the relevant scenario decision record with rationale and preserved constraints.
4. Make the smallest implementation change that satisfies the agreed decision.
5. Run available checks and inspect the rendered interface for UI changes.
6. Deploy a preview; record its exact URL and commit ID.
7. Exercise the end-to-end user interaction in the deployed preview where possible.
8. Record evidence, pass/fail results, regressions and limitations.
9. Update implementation status; never treat a commit or successful deployment as browser verification.

## Verification vocabulary
- **Designed**: decision recorded and approved.
- **Implemented**: code written.
- **Committed**: code pushed to the intended repository/ref.
- **Deployed**: expected commit is present on the preview host.
- **Tested**: real or automated execution occurred.
- **Verified**: observed behavior met agreed requirements and no known blocking regression remains.

Unobserved or unavailable steps must be labelled **Not verified**. No assumed successes.

## Decision revisions
Do not overwrite a past decision without trace. Mark old decision **Superseded**, append a dated revision with reason and replacement ID, and retain its historical text. New decisions receive new IDs.

## S02 compatibility invariants
Preserve dashboard-first navigation; New Session popup; dark mode; agent on the left, PDF on the right; nearly full-screen reading workspace; collapsible reading plan. Any intentional departure requires an explicit, separately recorded design decision.

## Current repository limitation
As inspected on 2026-11-01, `main` contains product documentation but no prototype implementation. S02 prototype completion is user-reported; implementation location and browser verification evidence remain to be established. Do not assume this GitHub documentation repository is the deployed application repository.
