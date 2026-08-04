# Design Principles

## Purpose

These principles guide product decisions for the AI-guided mathematical reading workspace. They are intended to remain stable even as individual features, interfaces, and implementation choices evolve.

When two plausible designs compete, the preferred design should be the one that better supports attentive, active, source-grounded mathematical learning.

## 1. The source is the shared object of attention

The product is built around reading mathematical sources, not around chatting about detached excerpts. The PDF or other primary text should remain visible, navigable, and central to the interaction.

The agent should be able to direct attention to exact paragraphs, definitions, equations, proof components, examples, and exercises. Explanations and questions should remain anchored to those locations whenever possible.

The interface should distinguish among:

- temporary agent focus;
- structural markings identified by the agent;
- durable reader-authored annotations.

Agent activity should clarify the source rather than cover it in permanent visual noise.

## 2. Reading support should produce active understanding

The product should help the reader perform mathematical work: interpreting, predicting, reconstructing, comparing, calculating, explaining, and testing examples.

Immediate explanation is useful, but it should not be the automatic response to every difficult passage. Depending on the session, the agent may first ask the reader to:

- restate a definition;
- identify the purpose of a construction;
- predict the next proof step;
- produce an example or counterexample;
- explain why an assumption is needed;
- attempt an exercise before receiving help.

The product should distinguish recognition from understanding, and local proof-following from the ability to reconstruct or apply an argument.

## 3. A reading map is not a learning strategy

Every substantial session may contain two complementary plans:

- the **reading map** describes what source material will be visited and in what order;
- the **learning strategy** describes what the reader will do with that material.

A list of pages, definitions, and theorems is not by itself a learning plan. The agent should help identify which passages need close reading, which can be surveyed, where an example is needed, when a proof should be reconstructed, and which exercise best tests the central idea.

## 4. Control is shared, visible, and adjustable

The agent should have enough freedom to guide a coherent session, recommend scope, identify important material, and adapt its teaching behavior. The reader should be able to alter that behavior at any time.

Preset modes are starting configurations, not rigid workflows. Goal, pace, guidance, interruption frequency, proof depth, exercise help, prerequisite handling, and explanation timing should remain independently adjustable.

Changes can be global, session-level, or temporary. A local switch to a detailed Socratic proof discussion should not silently rewrite the remainder of a Refresh session.

Meaningful automatic adaptations should be stated. The reader should not have to guess why the agent suddenly changed pace or began giving more direct help.

## 5. Protect productive struggle

The agent should not casually remove the intellectual work that makes an exercise or proof valuable.

Exercise help should be governed by an explicit policy and may progress from clarification, to a small hint, to an intermediate goal, to collaboration, and finally to a complete solution. Sources containing solutions require a separate access policy and should never be consulted merely because they are present in the project.

Reader-authored attempts should be preserved as attempts. They should not be silently replaced with polished agent answers.

## 6. Branches deepen thought without losing the path

Prerequisite gaps, proof details, notation questions, examples, disagreements, and speculative ideas often deserve their own conversations.

A branch should inherit relevant context while retaining its own objective, mode, sources, history, references, and draft. It should also preserve an explicit return anchor to the main session.

Leaving a branch should restore the exact source position and line of thought from which the detour began. The reader should be able to explore deeply without losing the larger reading project.

## 7. Local focus and project-wide continuity should coexist

Each session should feel like a distinct, focused agent conversation. It has its own source range, purpose, plan, detailed history, branches, state, and conclusions.

The project supplies continuity through summaries, durable knowledge, references, sources, instructions, progress, and retrieval. It should not create continuity by merging every transcript into one enormous prompt.

New sessions should receive relevant prior context, not indiscriminate prior context.

## 8. References should be precise and semantic

Selections of source text, agent prose, reader writing, equations, notes, summary items, and branch conclusions should become durable references.

A citation should carry more than copied characters. It should preserve its exact location, containing block, nearby context, mathematical role, source session and branch, PDF anchors, and later corrections.

Equations should be treated as structured mathematical content. Permanent visible numbering is unnecessary when stable internal identity and optional human-chosen labels can provide reliable reference.

## 9. Provenance is part of meaning

Mathematical claims, memory items, summaries, and assessments of the reader should retain their origin and evidence.

When the agent says that an earlier session established something, it should be able to cite the relevant summary item, answer, construction, or source passage. When a claim changes, the system should preserve the earlier form and link the correction.

Conflicting sources and conflicting session conclusions should remain inspectable. The product should not manufacture certainty by silently blending them.

## 10. Memory should be layered and retrievable

Long-term continuity should use several layers:

1. detailed local session and branch history;
2. concise, editable session summaries;
3. deliberately promoted project knowledge;
4. exact retrievable evidence;
5. original source and revision history.

Summaries should act as retrieval maps rather than irreversible compression. A future agent should be able to move from a concise statement back to the evidence supporting it.

Not every conversation detail deserves permanent memory. The agent may recommend promoting an item, but speculative thoughts, abandoned attempts, minor clarifications, and corrected mistakes can remain local.

## 11. Reader authority should remain explicit

Session summaries, instructions, source roles, durable memory, and learning assessments must be visible and editable.

Reader-authored corrections take priority over agent-generated assessments. The agent can propose summary revisions or project-memory additions, but interpretive changes should not become durable merely because the agent generated them.

The distinction among sourced material, reader-authored work, and agent-generated explanation should remain clear.

## 12. Sources have roles, not merely filenames

A project source should declare how the agent may use it. Primary texts, supplementary explanations, prerequisite sources, comparison sources, user-authored notes, reference-only materials, and solutions require different behavior.

Scope, priority, authority, reliability, notation policy, citation policy, and access restrictions can refine a role. The presence of a source in a project does not mean it belongs in every session context.

When sources disagree, the agent should describe the difference, identify the convention governing the current session, and preserve unresolved questions.

## 13. Navigation should never destroy thought

Every session and branch should preserve its own unsent draft, cursor position, inserted references, conversation position, active branch, PDF location, and relevant temporary state.

Following a citation, entering a branch, or switching sessions should behave like moving among documents. It must not discard or relocate an unfinished mathematical thought.

Compact previews are preferred when they answer the immediate need. Full navigation remains available without forcing a permanently complex multi-pane interface.

## 14. The interface should protect attention

The workspace should normally present one active source and one active conversation. Temporary highlights, small previews, collapsible context, and focused session cards should reveal information when useful without making every structure permanently visible.

The product should avoid unnecessary labels, panels, persistent overlays, and automatic interruptions. Mathematical density in the source is already high; the interface should reduce competing demands on attention.

## 15. Uncertainty and revision should remain honest

The reader and agent will make mistakes, revise interpretations, and encounter genuine ambiguity. The product should treat this as normal intellectual history.

Tentative claims should be marked as tentative. Later corrections should not erase what was originally said. Summary revision history should record what changed, who changed it, why it changed, and what evidence prompted the change.

## Decision test

For a proposed feature or behavior, ask:

- Does it keep the mathematical source central?
- Does it help the reader do intellectual work?
- Does it preserve reader control and productive struggle?
- Does it maintain provenance and uncertainty?
- Does it protect drafts, navigation state, and the main reading path?
- Does it add durable value without indiscriminately expanding context or interface complexity?

If the answer to several of these questions is no, the feature likely needs to be redesigned or kept outside the core product.

## Related documents

- [Product vision](product-vision.md)
- [User scenarios](user-scenario.md)
- [Product model](product-model.md)
- [Session model](session-model.md)
- [References and citations](references-and-citations.md)
- [Sources and instructions](sources-and-instructions.md)

