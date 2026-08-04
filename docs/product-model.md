# Product Model

## Purpose

This document defines the durable conceptual objects in the mathematical reading workspace, their ownership, and their relationships. It describes the product's mental model rather than a database schema or implementation architecture.

## Product hierarchy

```text
Library
├── Personal examples library
└── Projects
    ├── Sources
    ├── Project instructions
    ├── Project knowledge and progress
    ├── Named references
    ├── Annotations and saved artifacts
    └── Sessions
        ├── Reading map and learning strategy
        ├── Session sources and instructions
        ├── Main conversation
        ├── Branches
        ├── Summary and revision history
        ├── Drafts and navigation state
        └── Exercises, notes, and references
```

The hierarchy expresses ownership, not context loading. A source may belong to a project without being loaded into a session. A session may cite another session without inheriting its full conversation.

## Library

The library is the reader's complete mathematical workspace. It contains projects and long-term objects that can outlive an individual book or paper.

Library-level concerns include:

- finding and opening projects;
- cross-project examples and named objects;
- long-term reading and learning history;
- personal preferences that apply more broadly than one project.

The library should not collapse all projects into one undifferentiated memory. Cross-project reuse remains deliberate and sourced.

## Project

A project is a sustained body of mathematical work organized around a book, paper, course, research topic, or related collection of sources.

A project owns:

- its source library and source policies;
- durable project instructions;
- named references;
- reading progress;
- curated project knowledge;
- session summaries;
- unresolved questions;
- sessions and their branches;
- project-specific annotations and artifacts.

The project is the primary boundary for shared continuity. Sessions inside it can discover one another, cite one another, and retrieve relevant summaries and evidence.

## Source

A source is a first-class object representing material the agent may consult. It can be a PDF, book chapter, paper, lecture note, diagram, reference sheet, solution set, reader-authored note, or imported discussion.

A source includes:

- identity and bibliographic description;
- content and navigable locations;
- role and usage policy;
- scope and priority;
- authority or reliability notes;
- notation and citation policies;
- access restrictions;
- annotations and structural analysis.

Source roles are defined in [Sources and instructions](sources-and-instructions.md).

## Instruction set

An instruction set is an explicit collection of behavioral policies for the agent.

Instruction sets may exist at several scopes:

- library or personal preferences;
- project instructions;
- session instructions;
- temporary branch or activity instructions.

Local instructions refine broader instructions for a limited purpose. Their active scope should be visible. An instruction set is not hidden memory and should be editable by the reader.

## Session

A session is a focused reading engagement with its own agent identity. It is comparable to a distinct chat, but it also owns a reading scope, a learning purpose, structured plans, sources, branches, summary, drafts, and navigation state.

A session owns:

- source target and scope;
- purpose and guiding questions;
- mode configuration;
- reading map;
- learning strategy;
- session working sources;
- session instructions;
- main conversation;
- branches;
- local references and annotations;
- exercise attempts and notes;
- summary and revision history;
- independent drafts and interface state.

The detailed behavior of a session is defined in [Session model](session-model.md).

## Branch

A branch is a subordinate but genuine conversation created from a precise point in a session or another branch.

A branch owns:

- a local objective;
- its origin and return anchor;
- relevant inherited context;
- local source focus and instructions;
- local mode adjustments;
- its conversation and references;
- an independent draft and navigation state;
- an optional conclusion or summary.

Branches do not replace their parent conversation. Their results may be cited, summarized, or promoted deliberately.

## Plan

A session plan contains two distinct objects.

### Reading map

The reading map organizes source units and their sequence. Units can include sections, passages, definitions, examples, proofs, exercises, and planned detours. Each unit is anchored to the source.

### Learning strategy

The learning strategy organizes reader activity. It may ask the reader to interpret, predict, compare, reconstruct, calculate, generate an example, attempt an exercise, or synthesize.

The two plans can evolve independently. The source sequence may stay fixed while the learning strategy becomes more or less guided.

## Conversation, message, and content block

A conversation belongs to a session or branch. It contains reader and agent messages.

Messages should be conceptually composed of stable content blocks rather than treated as undifferentiated strings. Blocks may be:

- paragraphs;
- displayed equations;
- equation lines or meaningful subexpressions;
- lists;
- proof steps;
- callouts;
- source citations;
- generated diagrams or other artifacts.

Stable block identity allows precise selection, citation, revision notices, and navigation.

## Reference

A reference is a project-level pointer to an exact source object or selection. It can target source text, a mathematical expression, a message block, a reader attempt, a note, a summary item, or a branch conclusion.

A reference preserves:

- exact target and selection;
- containing structure and nearby context;
- source path through project, session, branch, and message;
- relevant PDF anchors;
- its role in the original discussion;
- correction and revision relationships.

References can be inserted into any session or branch without transferring ownership of the target. See [References and citations](references-and-citations.md).

## Named reference

A named reference is a reference with a durable human-chosen label and optional aliases. It supports repeated use, search through `@`, and inclusion in summaries or project knowledge.

Ordinary references do not require names. Stable internal identity should not force visible labels into mathematical prose.

## Reference tray

The reference tray is a temporary project-wide collection used to gather selections before deciding where to cite them. It behaves like a mathematical clipboard while preserving the identity and context of each item.

Items can be inserted into a session, promoted to named references, saved elsewhere, or removed from the tray without deleting their source content.

## Annotation

An annotation is a durable reader-authored mark attached to source or conversation content. It may be a highlight, note, question, correction, or personal interpretation.

Reader annotations remain visually and semantically distinct from temporary agent focus and agent-generated structural markings.

## Draft and navigation state

Each session and branch owns an independent unsent draft and the state required to resume work accurately.

This includes:

- prompt content;
- inserted references;
- cursor and selection position;
- conversation scroll position;
- active PDF location;
- active branch and reading unit;
- pinned or temporary preview state when useful.

This state belongs to the destination conversation. Navigating elsewhere must not relocate or destroy it.

## Session summary

A session summary is a first-class, independently viewable and editable object. It is both:

- a concise record of what occurred in the session;
- an interface through which future agents discover relevant prior work.

Summary content may include scope, purpose, main ideas, reader demonstrations, needs for reinforcement, open questions, exercises, references, later relevance, and source links.

## Summary revision

A summary revision records a change without deleting earlier versions. It includes:

- previous and new content;
- author of the change;
- time of the change;
- reason for the change;
- evidence or later session that prompted it;
- approval status when relevant.

Reader-approved corrections override agent assessments as the current view while preserving history.

## Project knowledge item

A project knowledge item is information deliberately promoted beyond a single session. Examples include:

- a stable preference;
- a completed section;
- an important definition or conclusion;
- a recurring prerequisite gap;
- an unresolved question;
- exercise status;
- a named reference;
- a durable reader note.

Every knowledge item retains provenance. Project knowledge is curated continuity, not a dump of conversation summaries.

## Example

An example is a reusable library object that can represent an example, non-example, counterexample, edge case, computation, or proof technique.

It records both mathematical and learning information:

- concepts and properties;
- construction or statement;
- what it illustrates or disproves;
- source and citations;
- related results and examples;
- reader explanation;
- origin and verification status;
- familiarity and points needing review.

Examples can accumulate interpretations across projects without losing their original source.

## Exercise artifact

Exercise work may create several related artifacts:

- the exercise statement and source anchor;
- the reader's original attempt;
- requested hints and their level;
- intermediate claims;
- final solution;
- reusable examples or proof techniques;
- an understanding assessment.

These artifacts should remain distinguishable. A final solution should not overwrite the reader's attempt.

## Ownership and sharing rules

The product model follows several core ownership rules:

1. Sources and references belong to projects; selected source use belongs to sessions.
2. Conversations, drafts, and detailed state belong to sessions or branches.
3. Session summaries belong to their sessions but are discoverable project-wide.
4. Project knowledge is created through deliberate promotion with provenance.
5. Examples may outlive projects while retaining links back to them.
6. A citation imports selected context, not ownership or a complete transcript.
7. Corrections add relationships and current status; they do not erase history.

## Object promotion

Content can move from local to durable status through explicit actions:

```text
Conversation selection
→ ordinary reference
→ named reference or saved note
→ project knowledge or examples-library entry
```

Promotion should not destroy the local original. Each promoted object retains a path back to its evidence.

## Conceptual invariants

The following should remain true regardless of implementation:

- every durable claim can identify its source or author;
- every session and branch preserves its own draft;
- every branch can return to its origin;
- every summary revision preserves prior versions;
- every cross-session citation resolves to a precise object;
- project context can be retrieved without merging all transcripts;
- source roles affect agent behavior;
- reader-authored work remains distinguishable from agent-generated material.

## Related documents

- [Product vision](product-vision.md)
- [Design principles](design-principles.md)
- [Session model](session-model.md)
- [References and citations](references-and-citations.md)
- [Sources and instructions](sources-and-instructions.md)

