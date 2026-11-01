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
3. **Batch documentation writes:** during text-only discussion, track approvals and open questions conversationally rather than committing after each choice. Update the relevant `decisions/Sxx.md` once at scenario closure, or earlier when changing the application/site. If implementation begins before closure, include all previously approved unrecorded decisions in the accompanying documentation update. Direct requests to update documentation are exceptions.
4. Make the smallest implementation change that satisfies the agreed decision.
5. Run available checks and inspect the rendered interface for UI changes.
6. Deploy a preview; record its exact URL and commit ID.
7. Exercise the end-to-end user interaction in the deployed preview where possible.
8. Record evidence, pass/fail results, regressions and limitations.
9. Update implementation status; never treat a commit or successful deployment as browser verification.

## Requirement classification and implementation traceability

Every scenario decision must identify its requirement type:
- **Interface (UI):** visible controls, layout, navigation, and presentation.
- **Agent behavior:** interpretation of reader language, mathematical dialogue policy, proactive suggestions, memory and context use, and agent-initiated actions.
- **Both:** coordinated UI and agent behavior. Document the UI contract and agent-behavior contract separately.

For each approved decision, include concrete, testable **agent obligations** and/or **interface obligations** as appropriate. Identify what triggers the behavior, what the system must do, what needs reader approval, and what must not happen. Natural-language operation requests and equivalent icon/button actions should have explicit parity requirements when approved.

At implementation time, translate every approved obligation into an implementation checklist and verification case. Track UI and agent behavior **separately** in implementation notes and verification evidence, including whether agent behavior is actually integrated or merely scripted/simulated. A visually working interface does not establish that the agent follows its approved behavioral contract. Mark unimplemented or untested obligations explicitly.

This classification applies to future scenario documents and to S23–S25 decisions when those scenario records are consolidated at closure. Do not mistake a requirement documented in a design record for implemented functionality.

## Verification vocabulary
- **Designed**: decision recorded and approved.
- **Implemented**: code written.
- **Committed**: code pushed to the intended repository/ref.
- **Deployed**: expected commit is present on the preview host.
- **Tested**: real or automated execution occurred.
- **Verified**: observed behavior met agreed requirements and no known blocking regression remains.

Unobserved or unavailable steps must be labelled **Not verified**. No assumed successes.

## Readable decision headings
Each approved scenario decision must display the selected option together with its descriptive keyword, e.g. **Decision: Option B — Workspace-first analysis**. Do not use bare labels such as **Decision: Option B**; readers should be able to scan the choice without re-reading the paragraph. Apply the same pattern consistently to subsequent decisions.

## Commit-linked revision histories
Every revision-history entry should provide the date, a concise description of **what actually changed and why**, and a Markdown link to the precise GitHub commit that introduced the change (short SHA as link text). Link decisions to specific code or documentation commits, not just the branch or file. For a change whose current commit SHA is not yet known at write time, add the commit link in a follow-up documentation commit, and retain a link to the file history meanwhile. Distinguish documentation-only changes from feature implementation. Do not invent or guess SHAs. For multi-commit implementations, link each material commit or a reviewable pull request and describe its scope.

## Decision revisions
Do not overwrite a past decision without trace. Mark old decision **Superseded**, append a dated revision with reason and replacement ID, and retain its historical text. New decisions receive new IDs.

## S02 compatibility invariants
Preserve dashboard-first navigation; New Session popup; dark mode; agent on the left, PDF on the right; nearly full-screen reading workspace; collapsible reading plan. Any intentional departure requires an explicit, separately recorded design decision.

## Current repository limitation
As inspected on 2026-11-01, `main` contains product documentation but no prototype implementation. S02 prototype completion is user-reported; implementation location and browser verification evidence remain to be established. Do not assume this GitHub documentation repository is the deployed application repository.
