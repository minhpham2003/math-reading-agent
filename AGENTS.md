# AGENTS.md — Mathematical Reading Agent

These are mandatory instructions for coding agents and collaborators working in this repository.

## Read before acting
Before planning or editing, read:
- `docs/product-vision.md`
- `docs/design-principles.md`
- `docs/development-workflow.md`
- `docs/implementation-status.md`
- `docs/verification-log.md`
- The relevant `decisions/Sxx.md`, `docs/session-model.md`, and applicable source files.

Inspect the **actual implementation** before changing it. Do not assume an application is housed in this repository when it has not been located.

## Design governance
- Work through **one scenario design decision at a time** with the reader.
- Record only explicitly approved decisions as Approved; distinguish proposals from approvals.
- Before implementing, preserve previously approved decisions; document any deliberate revision with a reason and a superseding ID.
- Keep the reader in control of learning and protect productive mathematical struggle.

## Scenario boundaries and completion summaries
- Before beginning any design decision, re-read the **original scenario statement** in the scenario inventory and the relevant `decisions/Sxx.md`. State the scenario's specific goal and keep design questions within that boundary.
- Do **not** keep adding D-numbers to a scenario merely because the conversation flows naturally there. If a question concerns a later scenario (for example, in-reading checkpoints versus S07's range selection), record it as a deferred question under the correct scenario instead of discussing or implementing it immediately.
- When the scenario's intended reader interaction and necessary edge cases have been designed and approved, **explicitly close the scenario**, even if adjacent product decisions remain. Ask to move to the next scenario; do not invent extra decisions to fill time.
- At each scenario's end, give the reader a **short retrospective summary**: scenario goal; approved decisions and user-facing flow; prototype/documentation status and remaining limitations; deferred topics and which scenario they belong to. Record this same concise closure in `decisions/Sxx.md` (with a commit-linked revision-history entry).
- If the user points out scope drift, stop, acknowledge it, and reclassify the question before continuing.

## S02 invariants
Unless the reader explicitly approves a replacement:
1. Dashboard-first navigation.
2. A New Session popup.
3. Dark mode.
4. Agent left, PDF right.
5. Nearly full-screen reading workspace.
6. Collapsible reading plan.

## Always document work
- Record scenario decisions in `decisions/Sxx.md` with IDs like `S07-D01`.
- Format approved choices as **Decision: Option B — Workspace-first analysis**: always include the option letter **and a short descriptive keyword**. Use separate readable paragraphs for decision, alternatives, rationale, approval evidence, and implementation/verification.
- Update `docs/implementation-status.md` when code or deployment state changes.
- Update `docs/verification-log.md` with exact tests, actual observations and remaining uncertainty.
- Include a **clickable link to the exact GitHub commit**, date, and meaningful description in every significant revision-history entry. If the SHA is unknown while creating the change, backfill the link in a subsequent commit; never fabricate a SHA.
- Link relevant preview URLs, issues, pull requests, commits and evidence as available.

## Development, testing, verification
Follow `docs/development-workflow.md` and the Development, Testing, and Verification Protocol:
1. Inspect relevant code and identify the behavior being changed.
2. Implement the smallest reasonable solution while protecting existing functionality.
3. Run available local checks and browser tests; visually inspect UI changes.
4. Deploy a preview when applicable and confirm which commit was deployed.
5. Test the **actual end-to-end user interaction** and check for regressions.
6. Report separately: Implemented, Committed, Deployed, Tested, Verified.

**Never claim success based on source inspection, a commit, or a deployment alone.** If browser access or another verification step is missing, explicitly say what is unverified.

## Repository state
As inspected on 2026-11-01, this repository's `main` branch contains design documentation, but no located S02 prototype application code. S02's completion is user-reported; establish the implementation repository and deployment before application-code work.

## Scope of these instructions
For documentation-only changes, GitHub write/readback verification is appropriate; do not pretend application-browser testing took place. Keep this file concise and place operational detail in `docs/development-workflow.md`.
