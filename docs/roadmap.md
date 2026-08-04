# Roadmap

## Purpose

This roadmap describes how the project can evolve from product discovery to a dependable mathematical reading workspace. It is organized around questions and exit conditions rather than dates.

The roadmap preserves the ambitious product vision while allowing scope decisions to be made deliberately at each stage. It should be revised as prototypes and real reading sessions reveal better priorities.

## Current position

The project is in product discovery and design. Its current purpose is to clarify the ideal experience, product boundaries, conceptual objects, and major user scenarios before choosing an MVP or technical architecture.

Current planning artifacts include:

- [Product vision](product-vision.md)
- [Design principles](design-principles.md)
- [User scenarios](user-scenario.md)
- [Product model](product-model.md)
- [Session model](session-model.md)
- [References and citations](references-and-citations.md)
- [Sources and instructions](sources-and-instructions.md)
- [Feature ideas](feature-ideas.md)

## Phase 0: Vision and product boundaries

### Central question

What should the product make possible that a PDF reader plus an ordinary chat does not?

### Work

- Define the long-term reading experience.
- Establish product principles and non-goals.
- Clarify the roles of projects, sessions, branches, sources, references, summaries, and memory.
- Record unresolved questions without forcing implementation decisions.

### Exit condition

The product has a coherent identity, durable terminology, and clear boundaries that can guide scenario design.

## Phase 1: Experience and scenario design

### Central question

How should complete reading sessions feel from the reader's point of view?

### Work

- Trace the first guided session screen by screen.
- Explore survey, refresh, deep reading, proof, exercise, and reference workflows.
- Define branching, resumption, summary revision, source conflict, and cross-session citation scenarios.
- Identify which interactions must be visible and which can remain contextual.
- Establish failure and recovery scenarios.

### Exit condition

The project has a small set of complete, internally consistent scenarios covering the central experience and its most important edge cases.

## Phase 2: Visual interaction prototype

### Central question

Does agent-guided visual attention inside the PDF feel useful, understandable, and calm?

### Work

- Prototype the PDF-left, agent-right workspace.
- Explore temporary highlights, structural brackets, and reader annotations.
- Prototype session maps, mode controls, branches, citation previews, and summary editing.
- Test non-destructive navigation and preserved drafts.
- Use realistic mathematical passages rather than generic placeholder text.

### Exit condition

The core interaction can be demonstrated through complete scenarios, and the reader can distinguish agent focus, document structure, and personal annotations without confusion.

## Phase 3: Technical experiments

### Central question

Can the highest-risk foundations work reliably enough to support the envisioned interaction?

### Work

- Test PDF text extraction and visual coordinate mapping.
- Test stable anchors across pages, passages, and document versions.
- Test equation rendering and selection at useful levels of precision.
- Test structured agent messages and selection-based references.
- Test session-state preservation and cross-session retrieval.
- Test document segmentation into definitions, proofs, examples, and exercises.
- Characterize failure modes for scans, unusual layouts, and extraction disagreement.

### Exit condition

The project understands the main technical risks, has evidence for viable approaches, and knows which parts of the vision require staged precision.

## Phase 4: MVP definition

### Central question

What is the smallest complete workflow that genuinely tests the product's distinctive value?

### Work

- Choose one primary reader and source type.
- Choose one coherent session workflow.
- Decide the minimum visual PDF interaction required.
- Select the smallest useful form of planning, branching, references, state preservation, and summaries.
- Define explicit exclusions.
- Write acceptance scenarios and evaluation criteria.

### Exit condition

The MVP is a complete reading experience rather than a disconnected feature list, and its success can be judged through real mathematical use.

## Phase 5: End-to-end MVP

### Central question

Can one reader complete a useful source-grounded mathematical reading session from intake through summary?

### Work

- Build the selected document-intake path.
- Support source navigation and agent-directed focus.
- Generate and revise a session plan.
- Conduct the selected reading loop.
- Preserve conversation, annotations, drafts, and progress.
- Produce an editable, source-linked session summary.
- Add basic tests, backup behavior, and clear failure handling.

### Exit condition

A real mathematical session can be completed and resumed without manual reconstruction or loss of source grounding.

## Phase 6: Personal alpha

### Central question

Does the product remain useful during sustained reading rather than only in a demonstration?

### Work

- Use the product extensively with Hatcher and at least one contrasting source.
- Record where the agent interrupts too much or too little.
- Test scope recommendations, modes, exercises, branches, and resumption.
- Identify incorrect memory, weak citations, lost state, and source-alignment failures.
- Refine terminology and workflows based on actual use.

### Exit condition

The central workflow survives repeated personal use, and the highest-frequency failures are understood well enough to prioritize refinement.

## Phase 7: Core refinement

### Central question

Can the product become dependable, inspectable, and comfortable for long projects?

### Work

- Improve source parsing and visual alignment.
- Strengthen selection-based references and previews.
- Add robust session and branch state preservation.
- Refine editable summaries and revision history.
- Improve layered retrieval and provenance.
- Expand source roles and instruction scopes.
- Improve onboarding, migration, backup, privacy, and security.
- Establish maintainable internal documentation and evaluation suites.

### Exit condition

The core product behaves predictably across long sessions, interruptions, corrections, and multiple sources.

## Phase 8: Private beta

### Central question

Does the model generalize beyond the original reader and original textbook?

### Work

- Test with additional readers and mathematical backgrounds.
- Test textbooks, lecture notes, and research papers with different layouts.
- Evaluate whether preset modes communicate behavior clearly.
- Observe how readers edit summaries and control memory.
- Identify accessibility, privacy, and onboarding barriers.
- Narrow or expand supported source types based on evidence.

### Exit condition

The product supports a defined audience and source range reliably, with known limits stated clearly.

## Phase 9: Version 1

### Central question

Is the guided mathematical reader stable and complete enough to be a dependable product?

### Expected qualities

- a polished central reading workflow;
- understandable modes and agent control;
- reliable source-linked navigation;
- durable sessions, branches, drafts, and summaries;
- trustworthy provenance and correction behavior;
- acceptable PDF handling for the supported source range;
- privacy, backup, migration, and failure recovery;
- maintained documentation and evaluation;
- a deliberately controlled feature set.

### Exit condition

The product can be used confidently for sustained mathematical reading within its declared scope.

## Phase 10: Expansion

Expansion should occur through coherent capabilities, not accumulation of isolated features.

### Examples library

- Save examples, non-examples, counterexamples, computations, and proof techniques.
- Compare examples by mathematical properties.
- Retrieve familiar examples during later reading.
- Accumulate interpretations across projects.

### Mathematical knowledge system

- Connect definitions, results, examples, exercises, and proof dependencies.
- Support semantic search across the reader's library.
- Preserve source-linked questions and reusable notes.

### Long-term learning

- Resume after long gaps.
- Identify evidence-based weak concepts.
- Suggest targeted recall and exercises.
- Track whether proofs can be reconstructed or results applied.
- Build reading paths across books.

### Research-reading support

- Map claims and dependencies.
- Compare notation and results across papers.
- Track conjectures, calculations, and unresolved questions.
- Preserve speculative work without promoting it to fact.

## Parallel workstreams

Several workstreams continue across phases:

### Product

Clarify the problem, audience, scope, and measures of value.

### Interaction design

Protect attention and make source focus, modes, branches, citations, and memory understandable.

### Engineering

Develop reliable document handling, state, search, storage, and application architecture.

### Agent behavior

Design prompting, planning, adaptation, source use, exercise policy, and error handling.

### Evaluation

Measure source accuracy, retrieval relevance, resumption quality, proof understanding, and usability.

### Data and provenance

Preserve stable identity, revision history, citations, backups, and migrations.

### Privacy and security

Protect documents, conversations, notes, and long-term learning records.

### Documentation

Keep product decisions, terminology, architecture, and supported behavior understandable to future collaborators and agents.

## Roadmap rules

- Do not choose the MVP merely by selecting the easiest features.
- Do not begin broad expansion before the central reading loop works reliably.
- Use real mathematical material in prototypes and evaluations.
- Give every phase a question and an observable exit condition.
- Preserve unresolved product questions rather than hiding them in implementation.
- Revise this roadmap when evidence changes the product model.
- Keep speculative features in [Feature ideas](feature-ideas.md) until they become coherent roadmap commitments.

## Near-term planning priorities

While the project remains in discovery, the next useful planning work is:

1. refine the central and failure user scenarios;
2. define open product questions;
3. create low-fidelity visual flows for the guided-session experience;
4. identify the riskiest PDF, equation-selection, citation, and state-preservation assumptions;
5. decide what evidence would justify moving from vision work to MVP definition.
