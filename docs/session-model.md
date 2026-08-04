# Session Model

## Purpose

This document defines the experience and conceptual lifecycle of a reading session. A session is more than a chat: it is a focused agent, a source-grounded plan, a collection of branches and artifacts, and a durable record that other sessions can later consult.

## Session identity

Each session has a clear local identity:

> I am the agent for this reading session, focused on this source range and this learning purpose.

The session agent knows in detail:

- the selected source scope;
- the session purpose and guiding questions;
- the reading map and learning strategy;
- active mode and temporary adjustments;
- selected working sources and instructions;
- the main conversation and its branches;
- exercises, notes, references, and annotations;
- local conclusions and unresolved questions;
- independent draft and navigation state.

The session is part of a project, but it does not pretend to be every other session. It receives relevant shared knowledge and retrieves precise prior material when needed.

## Creating a session

A session begins from a source target, such as:

- a section or page range;
- a selected passage;
- a theorem or proof;
- an exercise;
- a research-paper question;
- a prior reference that needs further study.

The reader may also provide an available duration, background, desired emphasis, or explicit instructions.

### Scope assessment

Before reading begins, the agent inspects the proposed scope and identifies:

- central definitions and results;
- examples and exercises;
- proof components;
- prerequisites and forward dependencies;
- conceptual or technical density;
- awkward starting or stopping points;
- a reasonable amount of material for the stated purpose.

The agent may recommend changing the scope, but the reader approves the session target.

### Purpose and guiding questions

The session records why the reader is engaging with the material. Typical purposes include surveying, refreshing, mastering definitions, reconstructing a proof, solving exercises, or finding a specific fact.

The agent translates that purpose into a small set of guiding questions. These provide conceptual continuity without becoming a rigid checklist.

### Prior-context proposal

For an established project, the agent identifies relevant prior items such as:

- session summaries;
- named references;
- unresolved questions;
- known prerequisite gaps;
- examples;
- earlier reader attempts.

It explains why each item may matter and proposes a small import set. The reader can add or remove items. Full earlier transcripts are not loaded by default.

### Working sources and instructions

The session selects a working bibliography from project sources and adds any local sources. It inherits project instructions and may refine them with session-specific instructions.

The active source roles, restrictions, and instruction overrides should be inspectable.

## Session plan

Every guided session may maintain two coordinated plans.

### Reading map

The reading map describes the source path. It may include:

- orientation;
- prerequisite recall;
- passages and definitions;
- examples;
- propositions and proof components;
- exercises;
- planned synthesis;
- optional or deferred material.

Each unit links to an exact source location. The map can change when the original range proves too ambitious or a different sequence becomes pedagogically preferable.

### Learning strategy

The learning strategy describes the reader's activity. Examples include:

- interpret a motivating paragraph;
- predict a definition;
- construct an example;
- compare two nearby notions;
- identify a proof's strategic step;
- reconstruct a missing argument;
- attempt an exercise without help;
- summarize how several results depend on one another.

The agent can revise the learning strategy while keeping the reading map stable.

## Mode configuration

A mode is a named starting configuration. Long-term presets include:

- Survey;
- Refresh;
- Deep Reading;
- Proof Workshop;
- Exercise;
- Reference.

The actual behavior is multidimensional:

| Dimension | Example values |
|---|---|
| Goal | survey, refresh, master, prove, apply |
| Pace | fast, moderate, slow, adaptive |
| Guidance | reader-led, collaborative, agent-led |
| Interruptions | minimal, checkpoints, frequent |
| Explanation timing | immediate, after attempt, on request |
| Proof depth | statement, strategy, structural, detailed |
| Exercise help | none, on request, Socratic, progressive |
| Prerequisite handling | brief recall, detour, systematic review |
| Emphasis | intuition, definitions, examples, proofs, exercises |

The reader can change any dimension using direct controls or natural language.

### Scoped adjustments

Behavioral changes have explicit scope:

- **activity-local:** applies only to the current proof or exercise;
- **branch-local:** applies inside one detour;
- **session-level:** applies for the remainder of the session;
- **project-level:** becomes a durable preference only through explicit promotion.

When an activity-local adjustment ends, the prior configuration is restored.

## The active reading loop

A conceptual unit may follow a loose loop:

1. **Purpose:** identify the question the passage addresses.
2. **Focus:** scroll to and highlight the exact source region.
3. **Read:** give the reader space to engage with the original text.
4. **Respond:** invite interpretation, a question, or a natural done signal.
5. **Discuss:** confirm, clarify, challenge, or explain.
6. **Connect:** relate the passage to earlier or later material.
7. **Act:** construct an example, reconstruct a step, or attempt an exercise.
8. **Check:** determine whether to continue, deepen, branch, or revise the plan.

This is a pattern, not a required ceremony. Some units need only a focused passage and a brief question; others may occupy most of the session.

The reader can advance through natural conversation or an explicit interface action. A button should be a reliable shortcut, not a mandatory ritual.

## Visual focus

The session agent can manipulate temporary source focus by:

- scrolling to a passage;
- highlighting or bracketing a region;
- focusing a definition or displayed equation;
- distinguishing proof components;
- comparing two source locations sequentially;
- indicating where an exercise or example begins and ends.

Temporary agent focus is separate from persistent reader annotation and durable agent structure.

## Branches

A branch is created when a question deserves focused treatment without derailing the main reading path.

Common branch purposes include:

- prerequisite remediation;
- proof-detail investigation;
- notation clarification;
- example construction;
- comparison of sources;
- suspected gaps or disagreements;
- speculative extensions.

### Branch context

A branch receives only the context relevant to its origin:

- exact selected source or message;
- containing block and nearby explanation;
- parent session purpose;
- active reading unit;
- linked references and sources;
- return anchor.

It may then add local sources, instructions, or mode adjustments.

### Returning from a branch

Leaving a branch restores:

- parent conversation draft;
- cursor position;
- conversation scroll position;
- PDF location;
- active reading unit;
- the question or activity that was interrupted.

The branch remains available and can expose a concise conclusion for later retrieval.

## Exercise behavior

Exercise work is governed by a visible help policy. A progressive sequence may include:

1. statement clarification;
2. discussion of the reader's current approach;
3. a small directional hint;
4. a relevant definition or theorem;
5. an intermediate goal;
6. collaborative work;
7. a full solution.

The agent should not advance automatically through these levels. Reader attempts, hints, and final solutions remain separate artifacts.

## Session context and memory

The active session agent receives several layers of context:

### Always local

- current source focus;
- session purpose and plan;
- active conversation and branch;
- mode and instructions;
- current draft references;
- recent local artifacts.

### Shared when relevant

- project overview and progress;
- selected project instructions;
- relevant prior summaries;
- named references;
- imported examples;
- durable gaps or unresolved questions.

### Retrieved on demand

- exact earlier messages;
- full branch conclusions;
- supporting source passages;
- revision evidence;
- citation chains.

The session should be able to explain where inherited information came from.

## Draft and navigation preservation

Every session and branch owns an independent draft. Switching destinations should never move content into a global composer or replace another draft.

The preserved state includes:

- draft text and inserted citations;
- cursor and selection;
- active branch;
- conversation position;
- PDF position and focused source block;
- current plan unit;
- temporary citation previews when useful.

References inserted through **Cite in...** appear at the destination's saved cursor position and are never sent automatically.

## Ending a session

A session can end because its purpose is complete, the available time has elapsed, or the reader chooses to stop.

The agent returns to the guiding questions and proposes a concise synthesis. It drafts a session summary containing relevant items such as:

- scope and purpose;
- main ideas;
- what the reader demonstrated;
- what needs reinforcement;
- open questions;
- exercises and activities;
- important references;
- likely later relevance;
- suggested next step.

The reader can edit and approve the summary. Unfinished work remains preserved rather than being forced into a completed status.

## Summary revision

Later sessions may reveal that an earlier assessment was too strong, incomplete, or incorrect. The earlier summary can receive a proposed revision linked to the new evidence.

The current version and its history remain independently viewable. The history records author, time, reason, evidence, and approval state. Old citations continue to resolve to the version they originally referenced while showing the current correction.

## Resuming a session

When the reader returns, the product restores local state and offers orientation based on the session summary and project progress.

A resumption may include:

- the last source position and active unit;
- unresolved questions;
- unfinished drafts and exercises;
- changes or corrections made elsewhere;
- a short recall plan appropriate to the time away.

The agent should help the reader resume without replaying the entire transcript or assuming that all earlier understanding remains fresh.

## Relationships between sessions

Sessions communicate through:

- editable summaries;
- project knowledge;
- precise references;
- named objects;
- retrieved evidence;
- examples;
- explicit correction relationships.

They do not communicate by silently merging transcripts. A current agent may cite another session, propose importing an item, or retrieve more context when necessary.

## Session invariants

- A session has one clear local purpose even when it contains branches.
- Every reading unit remains anchored to a source location.
- Mode changes have visible scope.
- Branches preserve a return anchor.
- Every session and branch owns an independent draft.
- Future sessions initially see summaries, not full transcripts.
- Claims about earlier learning retain evidence.
- Session completion never requires deleting unfinished work.

## Related documents

- [Product model](product-model.md)
- [Design principles](design-principles.md)
- [User scenarios](user-scenario.md)
- [References and citations](references-and-citations.md)
- [Sources and instructions](sources-and-instructions.md)
