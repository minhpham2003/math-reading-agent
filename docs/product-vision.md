# Product Vision: An AI-Guided Mathematical Reading Workspace

## Status of this document

This document describes the long-term product vision. It is intended to preserve the character and ambitions of the product while more detailed design documents, prototypes, and implementation plans evolve around it. It is not an MVP specification, technical architecture, or delivery roadmap.

## Vision

Build a visually interactive mathematical reading environment in which a reader and an AI agent work through difficult books and papers together.

The PDF is not merely an attachment to a chat. It is the shared object of attention. The agent can direct the reader to an exact paragraph, equation, definition, proof step, example, or exercise; explain how that passage functions in the larger argument; help plan and conduct a purposeful reading session; and preserve what was learned so that future sessions can continue from it.

Over time, the workspace should become a durable record of the reader's mathematical development: what they have read, how ideas connect, which examples matter to them, what they can reconstruct independently, where uncertainty remains, and how their understanding has changed.

## The problem

Advanced mathematical reading is not a sequence of isolated questions and answers. It requires the reader to coordinate several kinds of work:

- deciding what deserves close attention and what can be skimmed;
- recovering prerequisites without losing the main reading path;
- moving between local details and global proof structure;
- testing whether recognition has become usable understanding;
- preserving examples, proof techniques, questions, and partial insights;
- returning after days or months without reconstructing the entire context;
- comparing explanations and claims without losing their sources.

A conventional PDF reader preserves pages but does little to organize learning. A conventional chat can explain passages but usually sits beside the document, lacks precise visual control over it, and tends to flatten long-term work into conversation history. The product should unite the strengths of both while treating mathematical learning as an active, cumulative process.

## The core experience

The primary interface is a synchronized reading workspace:

- the mathematical source remains visibly open;
- the agent conversation and current session plan remain available alongside it;
- the agent can scroll to and temporarily highlight exact source regions;
- the reader can select source material, agent responses, their own writing, and equations as objects of further discussion;
- notes, questions, exercises, branches, and summaries retain links to the passages that gave rise to them.

The defining product principle is:

> The agent guides attention inside the mathematical text, not merely discussion about the text beside it.

An interaction might begin with the agent highlighting a motivating paragraph and asking what restriction the author is trying to relax. After the reader responds, the focus moves to the relevant displayed equations. During a proof, the agent may bracket the setup, strategic step, technical construction, and conclusion separately. During an exercise, it may point back to a definition without revealing how it should be used.

Visual markings should remain legible and attributable. At minimum, the workspace distinguishes:

- **Agent focus:** temporary indications of what to read now;
- **Agent structure:** identified definitions, results, examples, proof components, and exercises;
- **Reader annotations:** durable highlights, notes, questions, and other user-authored material.

The agent's activity should clarify the document rather than cover it in permanent decoration.

## Reading sessions with a purpose

A session begins with a selected section, page range, passage, theorem, proof, or exercise. The agent inspects the proposed scope, identifies its conceptual shape, notices awkward boundaries, and helps the reader choose an amount of material appropriate to the time and purpose available.

Before or during the session, the reader and agent establish:

- the goal of the session;
- the reader's relevant background;
- the desired pace and degree of guidance;
- the desired depth for definitions and proofs;
- how exercises and prerequisites should be handled;
- the most important questions the reading should answer.

The resulting session has two related but distinct plans:

### Reading map

The reading map describes what material will be visited and in what order: passages, definitions, examples, propositions, proofs, exercises, and deliberate detours. Each unit remains anchored to an exact location in the source.

### Learning strategy

The learning strategy describes what the reader will do with that material: predict a definition, interpret an example, reconstruct a proof step, compare claims, produce a counterexample, attempt an exercise, or summarize a dependency chain.

This distinction prevents a list of page ranges from masquerading as a learning plan. The agent is responsible not only for sequencing content, but also for proposing worthwhile intellectual activity.

Sessions should have a clear rhythm without becoming rigid. A conceptual unit may involve a purpose, a focused passage, discussion, a connection, an activity, and a brief check, but the agent should adapt that pattern to the material and the reader.

## Adaptable control and preset modes

The division of control between reader and agent is adjustable. The agent may lead a survey, collaborate on a difficult definition, become Socratic during a proof, remain quiet during an exercise, or answer a narrow reference question without turning it into a lesson.

Preset modes provide useful starting configurations rather than fixed workflows. A coherent long-term set includes:

- **Survey:** understand the landscape quickly;
- **Refresh:** recover intuition, definitions, and structural relationships;
- **Deep Reading:** develop precise and durable understanding;
- **Proof Workshop:** reconstruct the strategy and details of one proof;
- **Exercise:** apply the material with controlled help;
- **Reference:** resolve a specific question efficiently.

Underneath each preset are independent dimensions such as goal, pace, guidance, interruption frequency, explanation timing, proof depth, prerequisite handling, exercise-help policy, and emphasis on intuition, definitions, examples, proofs, or applications.

Any dimension can change through visible controls or natural language. Changes may apply to the remainder of a session or only to the current activity. For example, a Refresh session can temporarily become a detailed Socratic proof workshop and then return to its previous configuration.

The agent may recommend a change when the reader's responses warrant it, but meaningful changes should be visible. Adaptation should feel like collaboration, not hidden behavioral drift.

## Branching without losing the reading path

Questions in advanced mathematics often open necessary but temporary lines of inquiry. A session can therefore contain branches for prerequisites, proof details, examples, notation, disagreements, or speculative ideas.

A branch is a genuine local conversation. It inherits relevant session context but has its own objective, source focus, mode, conversation history, references, and draft. It may explore deeply without flooding the main session.

The main reading location remains an explicit return point. Resolving or leaving a branch should restore the reader to the exact passage, active unit, and question from which the detour began. Branches remain available as part of the intellectual record and can later be cited by the main session or by another session.

## References as first-class objects

Every meaningful piece of the workspace should be referencable: PDF passages, agent-generated prose and equations, reader messages, proof attempts, branch conclusions, notes, and summary items.

The primary interaction is selection-based. When the reader highlights text or mathematics, a contextual action can create a citation. The prompt shows a compact, readable link rather than a pasted block, while the reference retains:

- the exact selection;
- its containing paragraph, equation, or structural block;
- nearby explanatory context;
- its source document, session, branch, and message;
- linked PDF locations;
- its role in the original argument;
- later corrections or revisions.

Equations should be referencable as mathematical objects, not merely screenshots or strings. Over time, selection may range from a whole displayed equation to a line or meaningful subexpression. Visible equation numbers are not required: all content can have stable internal identity, while the reader adds a human-chosen label only when repeated use would be helpful.

This yields two complementary forms of reference:

- **Ordinary citations** are quick, contextual, and need no permanent name.
- **Named references** are durable, searchable labels for recurring definitions, constructions, examples, formulas, or arguments.

A project-wide reference tray can hold material collected from several places before it is used. Typing `@` can search named references, recent selections, sessions, branches, PDF passages, definitions, exercises, and prior messages.

## Cross-session citation and navigation

References belong to the project; prompt drafts belong to sessions and branches. A selection made in one session can therefore be inserted into another without merging their conversations.

A preferred direct flow is:

1. select material in the source session;
2. choose a destination through **Cite in...**;
3. open that destination session or branch;
4. insert the citation at its saved cursor position;
5. let the reader finish the prompt before anything is sent.

Hovering over a citation should show a compact preview of the exact source and its immediate context. Clicking can open that preview; an explicit **Open source** action navigates to the original location and highlights it. A complex permanent split view is not required.

The agent can also create precise cross-session citations. When it reuses an earlier formula, describes a prior difficulty, revises a conclusion, or imports a proof technique, it should cite the evidence rather than make a vague claim about the reader's history. Citation chains preserve deeper provenance when one later explanation depends on an earlier interpretation that in turn depends on the original PDF.

Old references do not silently change when their targets are corrected. The original remains visible, accompanied by a clear link to the later correction and the current status of the claim.

## Preserved drafts and navigation state

Moving through a long mathematical project should feel like switching among documents, not replacing one global conversation.

Every session and branch preserves its own unsent draft, inserted references, cursor position, active branch, conversation scroll position, PDF location, and relevant temporary interface state. Following a citation, entering a branch, or visiting another session must never discard the thought the reader was composing.

This is both a usability principle and an intellectual one: incomplete mathematical thoughts are part of the work and should not be destroyed by navigation.

## Separate session agents within a shared project

Each reading session behaves like its own focused agent, similar to a distinct conversation. It knows its selected source range, purpose, plan, guidance settings, branches, detailed local history, exercises, conclusions, and unresolved questions.

Sessions are distinct but not isolated. They belong to a shared project—typically a book, paper, course of study, or sustained mathematical topic—that contains sources, instructions, progress, named references, summaries, examples, and durable knowledge.

A session agent should not automatically absorb the full transcripts of every other session. Instead, it receives relevant shared context and can retrieve exact material when needed. It can propose importing an earlier unresolved question, example, definition, or proof construction, and the reader can accept, reject, or refine that context.

This preserves the focused identity of each session while allowing mathematical understanding to accumulate across the project.

## Session summaries as editable objects

Every session has a summary that can be opened independently of the chat. It is both a concise account of the work completed and the primary interface through which later sessions understand earlier ones.

A summary may record:

- purpose, scope, source range, mode, and status;
- main ideas and results;
- what the reader demonstrated;
- what needs reinforcement;
- open questions and tentative claims;
- exercises and activities completed;
- important references;
- connections to later material;
- source links and provenance.

The reader can edit, reorder, extend, lock, or remove summary sections; correct the agent's assessment; attach citations to claims; and promote selected items to project-level knowledge. Reader-authored corrections take priority over agent-generated interpretations.

The agent can draft a summary and propose later revisions. Routine factual changes may be permitted automatically, while interpretive claims about the reader's understanding may require approval. The distinction between an agent draft and a user-approved summary should remain visible when useful.

### Revision history

Summaries evolve as later work changes earlier conclusions. Their revision history preserves:

- the prior wording;
- what changed;
- when and by whom it changed;
- why it changed;
- the later session, answer, exercise, or citation that supplied the evidence.

Earlier versions are never silently deleted. Conflicting conclusions remain inspectable, with one marked as current when appropriate. A summary therefore records not only what is now believed, but how that understanding developed.

## Project and session sources

Sources are first-class project objects, not undifferentiated uploads. A project can include the primary PDF, supplementary books, lecture notes, papers, diagrams, reference sheets, exercise solutions, reader-authored notes, and earlier discussions.

Each source has a declared role that affects how the agent uses it:

- **Primary text:** governs the current reading's structure, notation, and terminology;
- **Supplementary explanation:** offers another viewpoint without being confused with the primary text;
- **Prerequisite:** is consulted when a background gap becomes relevant;
- **Comparison:** is used deliberately to contrast presentations or proofs;
- **Reference-only:** supports precise lookup without guiding the session by default;
- **User-authored:** contains the reader's notes, attempts, conjectures, and interpretations and is not treated as automatically authoritative;
- **Solutions:** is available under an explicit access policy so that productive struggle is not accidentally spoiled.

Roles can be supplemented by priority, authority, scope, reliability, notation policy, citation policy, and access restrictions. When sources disagree, the agent identifies the disagreement, distinguishes mathematical conflict from notational variation, states which source governs the current session, and preserves unresolved uncertainty. It should never silently blend incompatible accounts.

A session has a smaller working bibliography drawn from inherited project sources, selected passages, session-specific additions, imported references, and relevant prior summaries. The existence of a source in the project does not imply that its entire contents are loaded into every session.

## Project and session instructions

Projects and sessions each have explicit, editable instructions.

Project instructions express durable preferences and policies—for example, preserving productive struggle, using a particular notation, emphasizing structural proof ideas, citing claims precisely, or distinguishing sourced statements from agent-generated explanations.

Session instructions refine those policies for a local purpose—for example, focusing on intuition today, avoiding solutions to a particular exercise, assuming a prerequisite, or comparing two selected sources. Branches may make temporary local adjustments without rewriting the broader project configuration.

The active instruction context should be visible and understandable. Local instructions refine general ones, and temporary behavioral changes should have an explicit scope.

## Layered memory and retrieval

Long-term continuity should not depend on sending the entire project history to every agent. Memory is layered:

1. **Local conversational context** preserves the detailed reasoning of the active session and branch.
2. **Session summaries** provide concise, editable accounts of completed work.
3. **Project knowledge** holds intentionally durable preferences, progress, named references, important conclusions, recurring gaps, and unresolved questions.
4. **Retrievable evidence** preserves exact passages, messages, equations, exercises, and citation chains behind summarized claims.
5. **Original sources and histories** remain the final provenance layer when a claim needs to be checked or reinterpreted.

New sessions initially receive the project overview and relevant summaries, automatically expand only the most pertinent earlier work, and retrieve exact supporting material on demand. The agent should be able to explain why a memory was considered relevant and where it came from.

Not everything discussed deserves permanent promotion. Speculation, abandoned attempts, casual clarification, and corrected agent mistakes can remain local. The agent may suggest actions such as **Keep in session**, **Add to project memory**, **Save as note**, or **Create named reference**, while the reader retains meaningful control over durable knowledge.

This architecture treats a summary as both a memory record and a retrieval map.

## A long-term examples library

The product should eventually build a reusable library of examples, non-examples, counterexamples, edge cases, computations, and proof techniques encountered across books, papers, exercises, and conversations.

An example is more than a saved excerpt. It is both:

1. a mathematical object, with properties, concepts, relationships, sources, and consequences; and
2. a learning memory, recording why it mattered to this reader, how it was constructed, and how well it is understood.

Examples can originate in a source, an exercise, the reader's own work, or an agent suggestion. Their origin and verification status remain visible. They stay linked to exact source locations and relevant discussions while accumulating new interpretations across projects.

The library should support comparison by mathematical properties, retrieval during later reading, and discovery of gaps—for example, a definition for which the reader has canonical examples but no instructive non-example. The agent should preferentially reuse examples the reader already understands when they illuminate new material.

The library ultimately belongs to the reader, not to any single PDF. It forms a growing mathematical world around everything they have studied.

## Product principles

### The source remains central

Explanations, plans, notes, references, and memory should remain traceable to the mathematical text or to clearly identified user and agent contributions.

### Learning is active

The product helps the reader interpret, predict, reconstruct, compare, calculate, and explain. Immediate explanation is one tool, not the default response to every difficulty.

### Control is shared and adjustable

The agent may exercise substantial pedagogical judgment, but the reader can alter goals, pace, guidance, source use, and help level at any time.

### Local focus and global continuity coexist

Sessions remain coherent, separate conversations. Projects accumulate shared knowledge through summaries, references, retrieval, and deliberate promotion rather than through indiscriminate context merging.

### Provenance is part of meaning

Claims about mathematics and claims about the reader's understanding retain evidence, origin, revision history, and later corrections.

### Navigation is non-destructive

Branches, citations, sources, and sessions can be explored without losing drafts, reading position, or the main line of thought.

### Adaptation is inspectable

The agent can change its approach, but important changes to mode, assumptions, memory, or assessment should be visible and correctable.

### The interface protects attention

Temporary focus, lightweight previews, collapsible context, and a single active conversation are preferred to persistent clutter and unnecessary multi-pane complexity.

### Uncertainty is preserved honestly

Conflicting sources, tentative interpretations, suspected gaps, and changing assessments remain explicit instead of being collapsed into false certainty.

## Non-goals

The product is not primarily:

- a generic “chat with any PDF” interface;
- an automatic summarizer that replaces reading;
- a theorem prover or formal proof assistant;
- a system that solves exercises before the reader has a chance to think;
- a citation manager for conventional academic bibliography;
- a replacement for every note-taking, course-management, or flashcard tool;
- a single omniscient chat containing every transcript;
- an autonomous authority on the reader's knowledge;
- a mechanism for silently turning agent output into trusted project memory.

Some adjacent capabilities may eventually integrate with the workspace, but they should not displace the central experience of sustained, source-grounded mathematical reading.

## Future evolution

The same foundations can support progressively richer work: cross-document concept relationships, prerequisite and proof-dependency maps, review after long absences, research-paper comparison, personal conjectures and calculations, targeted exercise recommendations, and reading paths spanning multiple books.

The long-term measure of success is not how much text the agent can explain. It is whether the workspace helps a reader develop durable mathematical understanding while preserving the path by which that understanding was built.
