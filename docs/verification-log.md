# Verification log — React foundation branch

## V-009 — App scaffold (2026-11-08)

- **Branch:** [implementation/react-foundation](https://github.com/minhpham2003/math-reading-agent/tree/implementation/react-foundation).
- **Source check performed:** GitHub readback confirms files `app/src/App.tsx`, `app/src/storage.ts`, `app/package.json`; component contains expected session creation, reading-plan container and delete confirmation markers.
- **Result:** Source presence passed.
- **Not performed:** dependency install, typecheck, production build, local browser run, responsive screenshots, actual form and navigation actions, deployed preview.
- **Status:** Committed but not tested or verified. The source check does not establish behavior.

### Browser acceptance checklist (pending)
1. Open dashboard and New Session dialog; cancel and reopen.
2. Enter invalid page range and verify it is rejected.
3. Create valid session; verify workspace opens with agent left and source right.
4. Adjust position and reload; verify persisted position.
5. Return to dashboard and reopen session.
6. Collapse and expand plan.
7. Cancel deletion; session remains. Confirm deletion; session disappears after reload.
8. Check narrow viewport layout and browser console.

## V-010 — GitHub Pages React preview (2026-11-08)

- **Workflow:** [react-app-preview.yml](https://github.com/minhpham2003/math-reading-agent/blob/implementation/react-foundation/.github/workflows/react-app-preview.yml).
- **Workflow commit:** [2fb0f22](https://github.com/minhpham2003/math-reading-agent/commit/2fb0f220e511f4386b63e360a51b2ac67046b567).
- **Run:** [42526207428](https://github.com/minhpham2003/math-reading-agent/actions/runs/42526207428) triggered for this commit.
- **Destination (conditional on success):** https://minhpham2003.github.io/math-reading-agent/previews/react-foundation/
- **Last observed:** GitHub Actions run in progress. Build result, deployment, published files, browser behavior and visual layout not yet verified.
- **Isolation:** Workflow targets a separate gh-pages subfolder and uses keep_files, preserving the earlier S02 preview.

## V-011 — PDF.js browser PDF integration (2026-11-08)

- **Implementation:** [f06a797](https://github.com/minhpham2003/math-reading-agent/commit/f06a797b0e1277e8fa644b4f744e00a5991ae6a5).
- **First build:** [run 42526692837](https://github.com/minhpham2003/math-reading-agent/actions/runs/42526692837) failed TypeScript because the PDF worker ?url import lacked Vite client type declarations.
- **Fix:** Added `vite-env.d.ts` declaring Vite client types.
- **Subsequent build and deployment:** [run 42526745787](https://github.com/minhpham2003/math-reading-agent/actions/runs/42526745787) **passed**. GitHub Pages published index HTML and linked bundle verified via repo readback.
- **Not yet tested:** Render a real uploaded PDF in browser; next/previous page clicks; zoom; reload/resume PDF position; PDF file persistence across reload; replacement import; storage quota failures; deletion cleanup; mobile layout and console; regression of S02 buttons.
- **Status:** Build/deployment verified; browser user-flow verification pending.

## V-012 — Distraction-free reading workspace (2026-11-08)

- **Implementation:** [fcf85a9](https://github.com/minhpham2003/math-reading-agent/commit/fcf85a997c0e62940cd65bfdb4fe4c0a48104954), following the toolbar/CSS commits.
- **UI changes:** Global app header hidden only during sessions; large session heading and redundant source heading removed; compact unified reader toolbar with Back, truncated session name, optional metadata, PDF import/navigation/zoom/fit-width, and agent visibility toggle. The PDF viewer occupies the remaining viewport; left agent panel can be toggled without unmounting PDF.
- **Build:** Earlier run [42527457991](https://github.com/minhpham2003/math-reading-agent/actions/runs/42527457991) failed due to shadowing `document`; fixed by using `window.document`.
- **Result:** [Run 42527511119](https://github.com/minhpham2003/math-reading-agent/actions/runs/42527511119) completed successfully; gh-pages index readback showed generated assets.
- **Still pending:** Actual browser verification of toolbar placement, fit-width behavior, preserved PDF rendering and session actions, responsive layout.

## V-013 — Continuous PDF scrolling (2026-11-08)

- **Implementation:** [9b21164](https://github.com/minhpham2003/math-reading-agent/commit/9b211641300cebe0753eed93df952082e45c9d2b) and [d26dba1](https://github.com/minhpham2003/math-reading-agent/commit/d26dba1acaa7bc4f5607ac0a499b038b4d0065a1).
- **Changed:** All PDF pages in a vertical scroll container, with IntersectionObserver-based lazy canvas rendering; current physical PDF page tracks scroll, editable page-number form jumps on Enter, arrow buttons remain; page position persists using existing session state.
- **Build:** [GitHub Actions run 42528701219](https://github.com/minhpham2003/math-reading-agent/actions/runs/42528701219) succeeded. Deployed index exists on gh-pages.
- **Outstanding:** Browser verification of scrolling, rendering, page tracking, page jump and restoration; performance on large documents, mixed page dimensions, and very fast scrolling not yet verified.

## V-014 — Selectable PDF text and saved local source citations (2026-11-08)

- **Implementation:** [061b40a](https://github.com/minhpham2003/math-reading-agent/commit/061b40acdbca498947a2271256b02223fa93db86), [2ecbc6b](https://github.com/minhpham2003/math-reading-agent/commit/2ecbc6bd957842d56295ea1fa3c3b42ce0ed9dd1), [a5c97af](https://github.com/minhpham2003/math-reading-agent/commit/a5c97af315a0a011067b4e6bc9cf3945d02d065d).
- **Features in source:** PDF.js per-page selectable text overlays; selecting text within one page exposes save citation; references contain filename, physical PDF page, text quotation and normalized selection rectangles; saved in browser localStorage by session; citations drawer supports navigation, copy and removal; persistent highlights drawn on the PDF; session deletion also clears local citation records.
- **Build:** First attempt failed from a JSX closing brace, fixed. Latest [run 42530169298](https://github.com/minhpham2003/math-reading-agent/actions/runs/42530169298) succeeded. Published bundle available on gh-pages.
- **Limitations:** Source anchors are page/selection-box based, not stable text-offset or equation identifiers. Only same-page text selections. PDF extraction may not correctly reconstruct mathematical symbols. References are local browser data, not synced. No agent integration yet. Changing a PDF with the same filename may invalidate stored highlights.
- **Outstanding browser checks:** Selection alignment and drag interaction, quote accuracy, highlights at different zoom levels, citation navigation, reload persistence, session deletion, and earlier PDF features. Build/deployment verification is not behavioral verification.

## V-015 — Citation highlight / passage navigation / zoom anchor corrections (2026-11-08)

- **User-reported bugs:** Fragmented harsh highlighting, citation return to page top instead of selected passage, page switching during zoom.
- **Changes:** [e9bf19e](https://github.com/minhpham2003/math-reading-agent/commit/e9bf19eb26ff1b7bec5b5b264171f210b8d706b4) combines adjacent selection fragments into line bands; [d318d24](https://github.com/minhpham2003/math-reading-agent/commit/d318d2460a1f9de5fe5a8836afc4610038182cf3) scrolls to selected normalized y-position and tracks passage-relative zoom location; [6ecb4ba](https://github.com/minhpham2003/math-reading-agent/commit/6ecb4ba77f8df710005e88db818294b6b90d60f3) softens highlight visuals.
- **Build/deploy:** [run 42530685687](https://github.com/minhpham2003/math-reading-agent/actions/runs/42530685687) succeeded; published Pages index confirmed.
- **User browser verification pending:** citation highlight line grouping, exact scroll offset under zoom, stability when fit width changes or resizing panels, PDF page number tracking.

## V-016 — Visual-order text drag selection (2026-11-08)

- **Reported:** Browser/native PDF selection could not reliably include the final punctuation or start from paragraph ends, especially around equations.
- **Implementation:** [9c82b7b](https://github.com/minhpham2003/math-reading-agent/commit/9c82b7b58853a2c36b9ec00b283e52e825a85e30) adds mouse-drag selection using character-level PDF.js DOM geometry, choosing drag endpoints by proximity and arranging glyphs by visual position. Existing keyboard/native selection path retained separately.
- **Build and deployment:** [GitHub Actions run 42532950587](https://github.com/minhpham2003/math-reading-agent/actions/runs/42532950587) succeeded.
- **Outstanding validation:** Actual browser interaction with backward drag from sentence-final punctuation, equation superscripts/subscripts, long lines, multi-line selections, native selection interference, performance on dense PDF pages. Visual-order sorting is a first iteration; mathematical extraction and punctuation order may still need improvement.

## V-017 — Manual S07 assessment and reading-plan workflow (2026-11-08)

- **Implementation:** [ReadingFlow.tsx](https://github.com/minhpham2003/math-reading-agent/blob/implementation/react-foundation/app/src/ReadingFlow.tsx) with App/PdfReader integration.
- **In source:** Six-field editable range assessment (scope, conceptual structure, difficulty, dependencies, estimated time, recommendation), explicit assessment agreement, manual plan-unit creation, title/description/PDF-page editing, reorder/remove, explicit plan acceptance, clickable source page navigation without automatic explanations, read-status checkboxes, local persistence per session, and cleanup on session deletion.
- **Honesty:** No language-model calls or automatic assessments/plans exist. The user prepares the assessment and units manually. Source location is physical PDF page number only; no automatic excerpt highlighting or semantic section detection yet.
- **Build/deployment:** [GitHub Actions run 42533995621](https://github.com/minhpham2003/math-reading-agent/actions/runs/42533995621) succeeded, gh-pages bundle present.
- **Still unverified:** Browser interaction of approvals, edits, plan navigation, cross-reload persistence, regression of PDF toolbars/selection/citations and responsive rendering.
