# References and Citations

## Purpose

This document defines how mathematical content is selected, cited, named, previewed, navigated, and reused across the workspace. References are not merely hyperlinks: they preserve the identity, context, and provenance of the mathematical object being discussed.

## Core principle

> References live at the project level, while prompts and drafts live at the session or branch level.

A reference can be captured in one location and inserted into another without merging conversations or changing ownership of either session.

## Referencable content

The following should be referencable:

- PDF text and page regions;
- definitions, theorem statements, proof steps, examples, and exercises;
- complete displayed equations;
- equation lines and, eventually, meaningful subexpressions;
- agent-generated paragraphs and structured blocks;
- reader messages, proof attempts, notes, and conjectures;
- branch conclusions;
- session-summary items and their revisions;
- saved examples and other project artifacts.

Every referencable object has stable internal identity even when it has no visible number or label.

## Selection-based interaction

The primary interaction begins with a selection. Highlighting text or mathematics can offer actions such as:

```text
Ask here · Cite · Cite in... · Branch · Save · Add label
```

### Ask here

Inserts the reference into the active session or branch draft and keeps the reader in the current conversation.

### Cite

Adds the reference to a temporary project-wide reference tray. It does not assume which conversation will use it.

### Cite in...

Opens a destination picker for sessions and branches, navigates to the selected destination, and inserts the reference at its saved cursor position. It does not send the draft.

### Branch

Creates a branch anchored to the selection and gives the branch the context needed to investigate it.

### Save

Preserves the selection as a note or other durable project artifact while retaining its source path.

### Add label

Creates a human-chosen name for repeated search and citation.

## Ordinary and named references

### Ordinary reference

An ordinary reference is quick and contextual:

- no naming is required;
- it appears as a compact citation or preview label;
- it retains full hidden context;
- it can be used once or repeatedly;
- it does not add visible numbering to the original content.

### Named reference

A named reference adds a durable label and optional aliases. It is useful for recurring definitions, constructions, formulas, counterexamples, proof techniques, and conclusions.

For example:

```text
@concatenated-homotopy
@punctured-plane-retraction
@key-continuity-gap
```

Renaming or adding an alias does not duplicate or alter the underlying target.

The agent may suggest naming an object that is likely to recur, but the reader chooses whether to create the label.

## Reference content

A reference contains more than selected characters. Conceptually, it preserves:

- a stable reference identity;
- exact selected content;
- selection type;
- containing paragraph, equation, or structural block;
- nearby blocks needed for interpretation;
- project, session, branch, message, and block path;
- relevant source-document and PDF anchors;
- the original mathematical objective;
- the role of the selection in its argument;
- creation time and author;
- links to later corrections or revisions.

The selected content remains the target. Surrounding context helps interpret it but does not silently expand the citation into a whole conversation.

## Structured response content

Reliable selection requires agent responses to have stable internal structure. A response can be understood as:

```text
Message
├── Paragraph
├── Displayed equation
│   ├── Line
│   └── Mathematical subexpression
├── Explanation
└── Conclusion
```

A prose selection can be represented by block identities and character offsets. A mathematical selection should preserve source notation such as LaTeX or MathML and, where possible, the selected expression's structural path.

## Equation references

Equations should not require automatically displayed labels such as `(3)` merely to become referencable.

The system should support a progression of precision:

1. whole displayed equation;
2. one line or case of a structured equation;
3. a meaningful subexpression;
4. a semantic node in the mathematical expression.

A reference to a subexpression should also retain the complete containing equation and nearby explanation. This prevents a term such as `2t-1` from losing its role as a reparameterization in a piecewise construction.

## Citation appearance

The visible citation should be compact and readable. It may display:

- a short quotation;
- an equation preview;
- a named label;
- source and object type;
- session or branch title when needed for disambiguation.

The prompt should not be filled with pasted context. Internally, the agent receives the reference package alongside the reader's question.

## Reference tray and `@` search

The reference tray is a project-wide mathematical clipboard. It can collect several selections from different sources and sessions before the reader decides how to use them.

Within any prompt, typing `@` can search:

- named references;
- recent ordinary references;
- items in the tray;
- sessions and branches;
- PDF passages;
- definitions and exercises;
- prior messages and summary items;
- saved examples.

Selecting a result inserts a live citation into the active draft.

## Cross-session citation flow

The preferred direct workflow is:

1. select content in Session A;
2. choose **Cite in...**;
3. select Session B or one of its branches;
4. open the destination;
5. insert the citation at the destination's saved cursor;
6. focus the draft without sending it.

The destination agent receives:

### Destination context

- current session purpose;
- source focus and active unit;
- recent local discussion;
- mode, sources, and instructions.

### Imported reference context

- exact selection;
- complete containing block;
- small surrounding context;
- source session and branch;
- original objective and mathematical role;
- linked PDF locations;
- correction status.

The full source conversation is not imported automatically. More context can be retrieved when necessary.

## Preview and navigation

### Hover or initial interaction

A lightweight preview should normally show:

- exact selected content;
- one small surrounding excerpt;
- source title, session, and branch;
- original role;
- correction or revision status;
- an **Open source** action.

The preview should not become a miniature copy of the source session.

### Open source

Opening the source navigates to the original location and highlights the exact selection. Returning restores the destination's draft, cursor, conversation position, PDF location, active branch, and relevant preview state.

One active conversation with temporary previews is preferred to a permanently complex split view.

## Agent-created citations

Agents should cite earlier work when they:

- reuse a definition, formula, example, or proof technique;
- describe what the reader previously understood or struggled with;
- refer to an earlier conclusion or open question;
- revise a claim from another session;
- import a named reference;
- compare material across sources or sessions.

The agent should cite the smallest useful unit rather than vaguely citing an entire session.

Instead of:

> You had difficulty with this before.

the agent should say, in effect:

> The earlier unresolved point was continuity at the joining time. [Previous unresolved question]

Claims about prior learning should be inspectable and evidence-based.

## Citation chains

A cited explanation may itself depend on an earlier reference. The system preserves that provenance chain:

```text
Current explanation
└── cites an earlier session interpretation
    └── based on a prior construction
        └── anchored to the primary PDF
```

The normal preview shows the immediate target. Deeper provenance can be expanded when needed.

## Corrections and revision

References are historical links. If the target is later corrected, the old target does not silently change.

The reference should show:

- the original content;
- notice that a later correction exists;
- a link to the correction;
- which statement is currently accepted, when known.

Summary revisions follow the same rule. A citation to an earlier summary version continues to resolve to that version while displaying its revised status.

## Source changes and damaged anchors

If a source file changes or extracted text no longer aligns with visual coordinates, the system should preserve as much as possible:

- the original selected text or equation;
- source identity and version;
- page and coordinate anchors;
- structural path;
- a warning that the live location may have shifted.

The product should never redirect a precise citation to a merely similar passage without making the uncertainty visible.

## Reference invariants

- A reference never consists only of copied text when a stable source target exists.
- Inserting a citation never sends a prompt automatically.
- Cross-session citation never merges complete session histories by default.
- Following a citation never destroys a destination draft.
- Renaming a reference never changes its target.
- Corrections never erase the originally cited content.
- Agent claims about prior understanding cite evidence when practical.
- The smallest useful target is preferred over a vague whole-session citation.

## Related documents

- [Product model](product-model.md)
- [Session model](session-model.md)
- [Sources and instructions](sources-and-instructions.md)
- [Design principles](design-principles.md)

