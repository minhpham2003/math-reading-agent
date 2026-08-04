# Feature Ideas

## Purpose

This document collects product ideas that extend the core vision. It is an idea inventory, not a commitment, priority list, or implementation plan. Features should be evaluated against the [design principles](design-principles.md) before entering a roadmap.

## Core reading workspace

### Agent-directed PDF focus

- Scroll to exact passages as the conversation advances.
- Temporarily highlight paragraphs, definitions, equations, examples, and exercises.
- Bracket proof components such as setup, strategy, construction, and conclusion.
- Deemphasize surrounding material without hiding it.
- Compare source locations sequentially.
- Keep reader annotations visually distinct from agent focus.

### Document structure map

- Detect sections, definitions, results, proofs, examples, exercises, and notation.
- Link every structural item to source pages and visual coordinates.
- Display a navigable conceptual outline.
- Mark uncertain extraction or structure instead of pretending confidence.

### Reading diagnosis

- Identify the document's objective and central results.
- Estimate prerequisites and conceptual jumps.
- Distinguish central sections from technical or postponable material.
- Suggest linear, theorem-first, examples-first, proof-first, or multiple-pass reading.
- Detect awkward session boundaries.

## Session planning and modes

### Session builder

- Select a page range, section, theorem, proof, exercise, or arbitrary passage.
- Add time available and learning purpose.
- Preview reading scope and guiding questions.
- Separate the reading map from the learning strategy.
- Import a small set of relevant prior items.

### Preset modes

- Survey
- Refresh
- Deep Reading
- Proof Workshop
- Exercise
- Reference

### Adjustable mode dimensions

- Goal and pace
- Reader-led, collaborative, or agent-led guidance
- Interruption frequency
- Explanation timing
- Proof depth
- Exercise-help policy
- Prerequisite handling
- Emphasis on intuition, definitions, examples, proofs, or applications

### Natural-language control

- Go faster or slower.
- Stop checking understanding so frequently.
- Ask questions before explaining.
- Take over a technical passage.
- Let the reader work independently for one activity.
- Apply a change locally and restore the previous mode afterward.

## Branching and navigation

### Contextual branches

- Create prerequisite, proof-detail, example, notation, comparison, or speculation branches.
- Preserve the exact origin and return anchor.
- Give each branch independent sources, instructions, mode, conversation, and draft.
- Save a concise branch conclusion.

### Non-destructive navigation

- Preserve draft text and references per session and branch.
- Restore cursor, conversation scroll, PDF position, active unit, and preview state.
- Show which destinations already contain drafts.
- Provide undo after inserting a citation into another destination.

## References and citations

### Selection actions

- Ask here
- Cite
- Cite in...
- Branch
- Save
- Add label

### Structured mathematical selection

- Select whole displayed equations.
- Select one equation line or case.
- Select meaningful subexpressions.
- Preserve LaTeX or MathML and expression structure.
- Include the containing equation and explanatory context automatically.

### Reference tray

- Collect references from multiple sessions and sources.
- Insert several references into one comparison question.
- Promote temporary items to named references.

### `@` search

- Search named and recent references.
- Search sessions, branches, definitions, exercises, PDF passages, messages, and examples.
- Insert a live citation at the current cursor.

### Citation previews

- Hover or tap for exact content and compact context.
- Pin a preview temporarily.
- Show source session, branch, page, original role, and correction status.
- Open the full source without losing the current draft.

### Citation history

- Preserve citation chains.
- Link later corrections.
- Compare original and current versions.
- Warn when source revisions weaken an anchor.

## Summaries and memory

### Editable session summaries

- Independent summary page or panel.
- Customizable sections and ordering.
- Agent draft and user-approved states.
- Locked reader-authored sections.
- Citations attached to learning assessments.
- Promotion of selected items to project memory.

### Revision history

- Show what changed, who changed it, when, and why.
- Link the session or evidence prompting the revision.
- Compare two versions.
- Mark one conclusion current without deleting older ones.

### Layered retrieval

- Provide every new session with a concise project overview.
- Rank relevant prior summaries.
- Expand only the most relevant earlier work automatically.
- Retrieve exact messages and source blocks on demand.
- Explain why a memory item was selected.

### Memory controls

- Keep in session
- Add to project memory
- Save as note
- Create named reference
- Mark tentative or superseded
- Remove from future automatic retrieval without deleting history

## Sources and instructions

### Source management

- Assign roles, priority, authority, scope, reliability, and access policies.
- Limit sources to page ranges or topics.
- Translate supplementary notation into primary notation.
- Preserve source version and page conventions.
- Display which sources contributed to an answer.

### Conflict handling

- Compare source claims precisely.
- Distinguish mathematical disagreement from notation differences.
- Identify which convention governs the session.
- Track unresolved source conflicts.

### Instruction management

- Project, session, branch, and activity scopes.
- Visible temporary overrides.
- Reusable instruction presets.
- Policy protection for solutions and reader-authored drafts.

## Examples library

### Example objects

- Examples, non-examples, counterexamples, edge cases, computations, and proof techniques.
- Mathematical properties and concepts illustrated.
- Reader-authored explanation and learning status.
- Exact source and session provenance.
- Agent-generated and verification status.

### Capture routes

- Save from a PDF passage.
- Promote an exercise result.
- Save a construction developed in conversation.
- Accept and verify an agent-suggested example.

### Comparison and retrieval

- Compare related examples by properties.
- Identify which assumption distinguishes examples.
- Search semantically rather than only by text.
- Retrieve familiar examples during later explanations.
- Show definitions with missing examples or non-examples.

### Cross-project growth

- Allow an example to gather interpretations from multiple books and papers.
- Preserve the original source while adding later connections.
- Use the library for targeted review and exercise suggestions.

## Proof and exercise workspaces

### Proof workshop

- Identify assumptions, strategy, intermediate claims, technical constructions, and conclusion.
- Hide or reveal steps selectively.
- Ask the reader to predict the next move.
- Compare proof strategies across sources.
- Save reusable proof techniques.

### Exercise workspace

- Preserve scratch work and multiple attempts.
- Provide progressive help with a visible level.
- Link hints to source definitions without revealing application prematurely.
- Separate the reader's attempt, collaborative work, and final solution.
- Promote results to examples or project knowledge.

## Long-term learning

- Resume intelligently after weeks or months.
- Track different levels of understanding rather than one confidence score.
- Suggest recall activities based on prior evidence.
- Identify definitions without examples or proofs not yet reconstructable.
- Recommend exercises appropriate to a specific gap.
- Build reading paths spanning several books.
- Support optional review scheduling without becoming primarily a flashcard app.

## Research-reading support

- Claim and dependency maps for papers.
- Notation indexes.
- Comparison among papers and versions.
- Unresolved-question tracking.
- Personal conjectures and calculations.
- Possible-error tracking with source citations.
- Research branches that preserve speculative status.

## Multi-format and accessibility ideas

- Support papers, textbook chapters, lecture notes, and scanned PDFs.
- Improve navigation when text extraction and visual coordinates disagree.
- Accessible mathematical rendering and keyboard navigation.
- Touch interactions for selection and citation previews.
- Export summaries, notes, references, and examples in durable formats.

## Evaluation ideas

- Test whether readers can resume accurately after time away.
- Compare explanation-first and attempt-first interactions.
- Measure whether citations let readers verify agent claims efficiently.
- Evaluate how often automatic context retrieval is relevant.
- Test proof reconstruction and independent application, not only satisfaction.
- Identify when visual focus helps and when it becomes distracting.

## Ideas deliberately outside the center

These capabilities may integrate later but should not redefine the product:

- general-purpose PDF question answering;
- automatic full-book summarization;
- formal theorem proving;
- broad citation management;
- course administration;
- generic note-taking;
- autonomous solution generation;
- social or collaborative features unrelated to reading.

## Related documents

- [Product vision](product-vision.md)
- [Design principles](design-principles.md)
- [Roadmap](roadmap.md)
- [Product model](product-model.md)

