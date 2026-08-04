# User Scenarios: An AI-Guided Mathematical Reading Workspace

## Purpose of this document

This document describes how the product should feel in realistic mathematical reading situations. The scenarios translate the product vision into concrete experiences without defining an MVP, interface specification, or technical implementation.

The examples often use *Algebraic Topology* by Allen Hatcher because it is a representative case: a long, difficult mathematical text with compressed explanations, important examples, proof dependencies, and exercises. The same experiences should extend to other textbooks, lecture notes, and research papers.

## The reader

The primary reader is mathematically experienced enough to engage with advanced material but does not necessarily remember every prerequisite or want the same kind of help in every session.

The reader may be:

- encountering a topic for the first time;
- returning to material studied years earlier;
- reading for intuition rather than complete mastery;
- reconstructing a particular proof;
- working through exercises;
- consulting a reference while studying something else;
- reading a research paper whose prerequisites are only partly familiar.

The reader wants substantial help from the agent while retaining control over goals, pace, sources, and how much of the mathematical work the agent performs.

## Scenario 1: Beginning a guided Hatcher session

The reader opens the Hatcher project and sees the PDF in the main reading area. Previous sessions, sources, summaries, and project progress are available without obscuring the document.

The reader selects a section or page range and says:

> I want to spend about an hour reviewing homotopy equivalence and deformation retracts. I have seen this material before, but I do not remember it well.

### Inspecting the proposed scope

Before beginning, the agent examines the selected material. It identifies the principal definitions, examples, proof components, exercises, and dependencies. It notices that the final selected page begins a new topic and recommends a more coherent stopping point.

The agent gives a concise orientation:

> This range develops three main ideas: homotopy between maps, homotopy equivalence between spaces, and deformation retracts as a practical way to establish homotopy equivalence. There is one proof worth understanding structurally and two examples worth examining closely. I suggest stopping before the next topic begins.

The proposed source range appears visually in the PDF so the reader can see exactly what the session will cover.

### Establishing the session purpose

The agent asks what kind of understanding the reader wants. The reader chooses a Refresh configuration:

```text
Goal: Recover intuition and definitions
Pace: Moderate
Guidance: Collaborative
Proof depth: Structural
Exercise help: On request
```

The agent explains how it will interpret this configuration:

- briefly restore prerequisites rather than reteaching them completely;
- emphasize why each definition is introduced;
- focus on the architecture of proofs rather than every technical detail;
- ask the reader to interpret important passages before explaining them;
- select one exercise that reactivates the central distinction;
- increase the pace if the reader's knowledge returns quickly.

The reader can change any of these choices before or during the session.

### Previewing the session

The agent proposes a reading map:

```text
1. Why homeomorphism is too restrictive
2. Homotopy between maps
3. Homotopy equivalence
4. Deformation retracts
5. One exercise and a recap
```

Each unit is linked to an exact PDF location. The agent also proposes a learning strategy:

- interpret the motivation in the reader's own words;
- identify the role of the interval parameter in the definition of homotopy;
- compare homeomorphism with homotopy equivalence;
- reconstruct the main idea of the transitivity proof;
- use an exercise to distinguish a retract from a deformation retract.

The reading map says what will be covered. The learning strategy says what the reader will do with it.

### Orienting the reader

The agent presents brief, collapsible context:

**Recall before reading**

- continuous maps and composition;
- identity maps;
- product spaces;
- the interval as a deformation parameter.

**Why this matters later**

- replacing spaces with simpler homotopy-equivalent models;
- computing fundamental groups and homology;
- understanding which properties are preserved by homotopy.

It also gives a small set of guiding questions:

- When should two spaces count as having the same shape?
- Why is homotopy equivalence weaker than homeomorphism?
- How does a deformation retract simplify a space?
- What must be checked when two homotopies are joined piecewise?

These questions remain available throughout the session without dominating the screen.

### Reading with visual guidance

The agent scrolls the PDF to the first passage and temporarily highlights the motivating paragraph:

> Read this paragraph and focus on why requiring a true inverse is too restrictive. Tell me what distinction Hatcher is trying to introduce.

The reader responds in their own words. The agent confirms what is correct, clarifies what is missing, and moves the focus to the displayed equations. It does not replace the source with a summary; it uses the source as the shared object of discussion.

As the session progresses, the active unit is visible in both the plan and the PDF. Temporary agent highlights move with the conversation, while the reader's own annotations remain persistent and visually distinct.

### Completing the session

The session ends by returning to the original guiding questions. The reader answers them briefly, and the agent uses those answers—along with the discussion and exercise—to draft a session summary.

The reader reviews the summary, corrects an overly confident assessment, and approves the revised version. The session closes with a clear next step and preserves the exact PDF position, conversation, annotations, branches, references, and unfinished drafts.

## Scenario 2: Adapting control during a session

The reader begins in Refresh mode. The agent is moving at a moderate pace and explaining proofs structurally.

When the session reaches the proof that homotopy is transitive, the reader says:

> Slow down for this proof. Ask me questions and let me reconstruct it rather than explaining it immediately.

The active behavior changes locally:

```text
Pace: Moderate → Slow
Guidance: Collaborative → Socratic
Proof depth: Structural → Detailed
Explanation timing: After the reader's attempt
```

The agent visually divides the proof into setup, construction, continuity check, and conclusion. It asks the reader to predict how two homotopies might be combined, then focuses the PDF on the piecewise formula.

After the proof, the local change ends. The session returns to its original Refresh configuration. The reader does not have to reconstruct the earlier settings manually.

Later, the reader reaches an exercise and says:

> Let me attempt this alone. Do not interrupt unless I ask for help.

The agent becomes quiet and makes the help policy visible. The session remains agent-supported, but control has shifted to the reader for this activity.

The important outcome is that modes function as adjustable starting points rather than rigid experiences. The agent has freedom to make pedagogical suggestions, while the reader can change the balance of control at any moment.

## Scenario 3: Getting stuck inside a proof

During the transitivity proof, the reader understands the intended piecewise construction but asks:

> Why is this map continuous at the joining time?

The question concerns a small but essential part of the current proof. The agent creates a branch titled **Continuity at the joining time**. The branch retains:

- the exact line selected in the proof;
- the complete displayed equation;
- the surrounding explanation;
- the purpose of the main proof;
- the PDF location from which the branch began.

Inside the branch, the agent changes to a slower proof-focused style. It asks what the two formulas do at the joining value and helps the reader identify the missing use of the pasting lemma.

The reader cites the second case of the equation by selecting it directly. The citation in the prompt is compact, but the agent receives the selected expression, the full equation, and its role in the proof.

Once the reader understands the continuity argument, the branch records a short conclusion:

> The two pieces agree at the joining time, and the pasting lemma supplies continuity of the combined homotopy.

Returning to the main session restores:

- the same proof location in the PDF;
- the active proof component;
- the conversation scroll position;
- the unsent draft in the main session;
- the question the reader was answering before the branch began.

The branch remains available for future citation. The detour deepens understanding without erasing the main reading path.

## Scenario 4: Discovering a prerequisite gap

While reading a research paper, the reader encounters a construction using filtered complexes and realizes that the filtration conventions are unfamiliar.

The agent recognizes that this is not merely a local notation question. It proposes a prerequisite branch and identifies two project sources:

- a prerequisite chapter from a textbook;
- supplementary lecture notes using slightly different notation.

The agent explains the roles of the sources before using them. The textbook is treated as the prerequisite reference; the lecture notes are used as a supplementary explanation. The paper remains the primary source governing the current notation.

The prerequisite branch has a deliberately limited objective:

> Learn enough about the filtration convention to understand the construction on the current page.

The agent does not automatically begin a complete course on filtered complexes. It highlights the minimum relevant passages, translates the supplementary notation into the paper's notation, and checks that the reader can interpret the original construction.

When the branch ends, the reader returns to the precise sentence that triggered the detour. The branch summary remains searchable, but its full transcript is not automatically injected into every later session.

## Scenario 5: Working on an exercise without being spoiled

The reader enters Exercise mode and selects an exercise from the current section. The project includes a solutions source whose role is:

```text
Role: Solutions
Access: Only when explicitly requested
```

The agent explains why the exercise is useful but does not reveal the approach:

> This exercise tests whether you can distinguish a retract from a deformation retract. It uses the central definitions without requiring a long computation.

The reader begins a proof attempt in the session workspace. The attempt is preserved as user-authored material and is not silently rewritten into an agent solution.

When the reader asks for help, the agent follows a progressive ladder:

1. clarify the statement;
2. ask about the reader's current approach;
3. offer a small directional hint;
4. point to a relevant definition or theorem;
5. suggest an intermediate goal;
6. work collaboratively;
7. provide a full solution only when explicitly requested or clearly authorized.

Each escalation in help is visible. The agent may highlight a relevant definition in the PDF without explaining how to apply it.

After completing the exercise, the reader chooses which artifacts to preserve:

- the original attempt;
- the final solution;
- a reusable proof technique;
- a counterexample or construction discovered along the way;
- an update to the session summary.

If the exercise produces a valuable example, the reader can add it to the long-term examples library with its source and learning history intact.

## Scenario 6: Referencing an earlier part of the current session

Several messages after the agent writes an important equation, the reader wants to question one term in it.

The reader highlights the relevant expression. A small contextual control offers actions such as:

```text
Ask here · Cite · Branch · Save · Add label
```

Choosing **Cite** inserts a compact reference into the current prompt. It does not paste the full equation or require the reader to describe where it appeared.

The agent receives:

- the selected expression;
- the complete equation;
- nearby explanatory blocks;
- the current proof or conceptual unit;
- the message and branch in which it appeared;
- any PDF passage to which it was anchored.

The reader asks the question naturally, and the agent understands exactly which mathematical object is under discussion.

Because the construction will recur, the reader selects **Add label** and names it `concatenated-homotopy`. The label is now searchable through `@`, but the equation itself does not acquire a distracting visible number in the original conversation.

## Scenario 7: Moving a citation into another session

In an earlier session on homotopy equivalence, the reader and agent discussed a piecewise construction for concatenating homotopies. During a later session on path multiplication, the reader realizes that the same pattern may be relevant.

The reader returns to the earlier session, highlights the construction, and chooses **Cite in...**. A destination picker shows recent sessions and their current drafts. The reader selects the path-multiplication session.

The workspace opens that destination and inserts the reference at the saved cursor position in its prompt:

> How does [piecewise concatenation construction] apply to the associativity of path multiplication?

Nothing is sent automatically. The reader can edit and finish the question first.

Hovering over the citation displays a compact preview containing:

- the exact selected equation;
- one small piece of surrounding context;
- the source session and branch;
- its original role in the transitivity proof;
- its linked PDF location;
- whether it has since been corrected.

If the preview is insufficient, **Open source** navigates to the original session and highlights the construction. Returning restores the complete draft in the destination session, including its cursor position and inserted citations.

The path-multiplication agent receives its own local context plus the imported reference package. It does not receive the full earlier conversation unless more context is actually needed.

## Scenario 8: An agent cites another session

During a later session on the fundamental group, the agent notices that the reader is facing the same joining-time issue encountered in the earlier homotopy session.

Instead of saying:

> You struggled with this before.

the agent says:

> In the earlier homotopy-equivalence session, the unresolved point was continuity at the joining time. [Earlier unresolved question]

The citation lets the reader inspect the evidence. The agent can also cite the later branch conclusion showing that the issue was resolved.

If the earlier conclusion was subsequently corrected, the citation preview preserves what was originally said and displays a notice pointing to the correction. The old session is not silently rewritten.

This makes cross-session memory accountable. Claims about the reader's prior understanding are supported by evidence, and mathematical constructions retain their provenance as they are reused.

## Scenario 9: Starting a new session within an established project

The reader begins a new session on the fundamental group. The project already contains several previous Hatcher sessions, named references, open questions, completed exercises, and edited summaries.

The new session agent does not load every transcript. It begins with the project overview and identifies a small set of relevant prior items:

- an unresolved question about concatenating homotopies;
- a named reference for a radial deformation;
- a prior summary stating that the geometric idea of deformation retracts is understood but the formal construction needs reinforcement.

The agent explains why each item may matter and recommends importing only the first and third. The reader removes the third because they do not want to review deformation retracts today.

The new session therefore has its own identity, goal, source range, mode, detailed history, branches, and draft. It knows that other sessions exist and can retrieve from them, but it does not behave as if the entire project were one enormous chat.

## Scenario 10: Returning after a long break

Several weeks later, the reader reopens the project. The workspace restores the most recent session states but does not simply drop the reader into an old chat.

The project overview shows:

- where reading stopped;
- which sections were completed;
- the current session summaries;
- important open questions;
- concepts marked for reinforcement;
- exercises attempted or completed;
- suggested next steps from the last session.

The reader opens the homotopy-equivalence summary. Its current assessment says:

> The geometric meaning of deformation retracts is clear, but the formal homotopy construction still needs reinforcement.

The reader can follow the supporting citation to the exact session exchange on which that assessment was based.

The agent proposes a short resumption plan rather than replaying the old session:

1. recall the three central definitions;
2. revisit one saved example;
3. reconstruct the piecewise homotopy at a structural level;
4. continue to the next section if the recall succeeds.

The reader can accept, shorten, or replace this plan. Long-term memory supports resumption without taking control away from the reader.

## Scenario 11: Editing a session summary and preserving its history

At the end of a session, the agent drafts this assessment:

> Reader demonstrated: understands deformation retracts well.

The reader considers this too strong and edits it:

> Understands the geometric idea, but not yet the formal homotopy construction.

The edited summary becomes the current user-approved version. The revision history records:

- the original agent wording;
- the reader's correction;
- when the change was made;
- the reason supplied by the reader;
- the evidence linked to each assessment.

During a later session on CW complexes, the reader successfully constructs a related homotopy. The later agent proposes revising the earlier summary. The reader approves a new assessment stating that the earlier gap has been reinforced.

The original summary, the reader's correction, and the later revision all remain inspectable. Citations to the old version still resolve to what was actually written, accompanied by the current status.

The summary is therefore a living object rather than a frozen automatic recap. It records the evolution of understanding while remaining concise enough for future agents to use.

## Scenario 12: Adding project and session sources

The Hatcher project contains:

```text
Hatcher — Algebraic Topology
Role: Primary text
Priority: High
Notation policy: Governs project notation

Course lecture notes
Role: Supplementary explanation
Scope: Chapters 0–2
Notation policy: Translate into Hatcher's notation

Munkres — Topology
Role: Prerequisite
Relevant topics: Quotient spaces and compactness

Personal notes
Role: User-authored
Reliability: May contain unfinished or mistaken claims

Exercise solutions
Role: Solutions
Access: Only when explicitly requested
```

The reader begins a session and adds only selected Hatcher pages, one lecture-note passage, and a personal proof attempt to the session's working sources. Other project sources remain discoverable but are not automatically placed in the agent's immediate context.

When the lecture notes use different notation, the agent explicitly translates it. When the personal notes conflict with Hatcher, the agent does not silently combine the claims or treat the notes as authoritative. It identifies the difference and asks whether the reader wants to investigate it.

The reader can also add session instructions:

```text
- Focus on geometric motivation.
- Use Hatcher's notation.
- Do not consult the solutions source.
- Treat my proof attempt as unfinished work.
- Give detailed explanations only after I have tried the passage myself.
```

These refine the durable project instructions without modifying them for every future session.

## Scenario 13: Saving and reusing an example

While studying deformation retracts, the reader works through the radial deformation from the punctured plane to the circle. The agent suggests saving it because it is a canonical example likely to recur.

The reader creates an examples-library entry containing:

- the construction and relevant formula;
- the concepts it illustrates;
- why the example is useful;
- properties it satisfies;
- the Hatcher page and session in which it was studied;
- the reader's own explanation;
- a note that the geometric idea is familiar but the formal continuity argument needs review.

Months later, while reading another book, a new session agent retrieves the example because it illuminates a related construction. It says why the example is relevant and cites the original source and learning record.

The new session may add another interpretation without overwriting the earlier one. The example gradually accumulates connections across books, exercises, and discussions while retaining its original provenance.

The examples library becomes personal not merely because it contains saved mathematics, but because it records why each example mattered to this reader and how their understanding of it changed.

## Scenario 14: Comparing conflicting sources

The reader is studying a definition for which the primary text and a supplementary source appear to use different conventions.

The agent identifies:

- what each source states;
- whether the difference is mathematical or notational;
- which convention governs the current session;
- how claims from one source should be translated into the other;
- whether any genuine disagreement remains unresolved.

The agent does not average the two accounts into a synthetic definition. It keeps each statement linked to its source and explains which convention it is using in subsequent answers.

If the reader later discovers that an earlier session used the wrong convention, the affected summary and references receive a linked correction. The original conversation remains visible as part of the history.

## Scenario 15: Reading a research paper for its global argument

The reader uploads a research paper in an area they partly understand and chooses Survey mode.

The agent first assesses the document as a whole:

- the problem the paper addresses;
- the principal theorem;
- the background it assumes;
- the sections central to the main argument;
- technical sections that can initially be postponed;
- major notation and dependency chains;
- conceptual jumps likely to require slower work later.

The agent proposes a theorem-first, multiple-pass reading strategy:

1. understand the paper's objective and main result;
2. inspect one motivating example;
3. map the architecture of the proof;
4. identify indispensable definitions and lemmas;
5. postpone a technical section until its role becomes clear;
6. create later Deep Reading or Proof Workshop sessions for selected parts.

The reader works through this survey with fast pacing and minimal proof detail. At the end, the project contains a source-grounded map of the paper, not a substitute summary claiming that the paper has been understood.

The reader can now create separate focused sessions for the main theorem, a prerequisite, or a technical construction. Those sessions share the project but retain independent goals, agents, drafts, and histories.

## Experience principles revealed by the scenarios

Across these situations, the desired experience remains consistent:

- the source is always the shared ground of discussion;
- the agent directs attention visually and precisely;
- reading plans and learning strategies remain distinct;
- the reader can shift the balance of control at any time;
- branches deepen local questions without losing the main path;
- sessions are separate agents joined by deliberate, cited memory;
- references preserve exact selections, context, and provenance;
- navigation never destroys drafts or reading state;
- summaries are editable, revisable objects rather than hidden memory;
- source roles and instructions govern how context is used;
- durable knowledge is promoted intentionally;
- examples accumulate into a personal mathematical library;
- corrections remain linked to the claims they revise;
- the product helps the reader perform mathematical work rather than merely consume explanations.

The successful product should make a long mathematical project feel coherent across pages, questions, sessions, and months while preserving the reader's agency and the history of how understanding was built.
