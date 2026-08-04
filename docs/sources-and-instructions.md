# Sources and Instructions

## Purpose

This document defines how source material and agent instructions are organized at project, session, branch, and activity scope. Sources are not interchangeable uploads, and instructions are not hidden preferences: both are explicit objects that govern agent behavior.

## Source libraries

### Project sources

A project's source library contains material that may be useful anywhere in the project:

- the main book, paper, or chapter;
- supplementary books and lecture notes;
- prerequisite texts;
- comparison sources;
- papers and reference sheets;
- diagrams and external notes;
- reader-authored notes and proof attempts;
- exercise solutions;
- imported earlier discussions.

Project membership means that a source is discoverable. It does not mean that the source is loaded into every session or treated as equally authoritative.

### Session sources

A session has a smaller working bibliography containing:

- inherited project sources selected for this session;
- exact passages or page ranges;
- session-specific additions;
- imported references from other sessions;
- relevant prior summaries;
- reader-authored work created in the session.

Session sources can be temporary, limited in scope, or removed from the working context without deleting them from the project.

## Source roles

A source role affects how the agent consults, explains, cites, and reconciles the material.

### Primary text

The material currently being studied. Its organization, notation, terminology, and local conventions normally govern the reading session.

The primary text is not assumed infallible. Suspected errors remain open questions with precise citations.

### Supplementary explanation

Provides another explanation, example, or viewpoint when the primary text is compressed or unclear.

The agent distinguishes supplementary material from what the primary text actually states and translates notation when needed.

### Prerequisite

Provides background used when a genuine gap blocks the current reading. It should usually be retrieved during a focused detour rather than blended into every session.

### Comparison

Is consulted deliberately to compare definitions, conventions, proof strategies, or exposition. Differences should be presented explicitly.

### Reference-only

Supports precise definitions, conventions, or factual lookup but does not normally guide the session.

### User-authored

Contains the reader's notes, conjectures, calculations, interpretations, and proof attempts. It is treated as the reader's work, not as automatically authoritative source material.

The agent should preserve unfinished or mistaken attempts rather than silently rewriting them.

### Solutions

Contains exercise solutions or material that could spoil productive work. It requires an explicit access policy, such as:

```text
Access: Only when explicitly requested
```

Being present in the project never authorizes automatic consultation.

### Do not cite

Provides background context but should not be presented as an authoritative cited source. This policy should be used carefully and remain visible to the reader.

## Source properties

Roles can be refined by additional properties:

| Property | Purpose |
|---|---|
| Priority | Indicates which sources should be consulted first |
| Authority | Records whether a source is standard, informal, tentative, or personal |
| Scope | Limits use to chapters, topics, sessions, or page ranges |
| Reliability | Records known uncertainty or possible errors |
| Usage | Defines always available, on request, or only when needed |
| Citation policy | Requires citation, permits paraphrase, or prohibits citation |
| Notation policy | Governs whether notation is preserved or translated |
| Access policy | Restricts solutions or sensitive material |
| Version | Preserves which edition or file state was used |

Example:

```text
Source: Personal lecture notes
Role: Supplementary explanation
Priority: Medium
Scope: Fundamental groups
Notation policy: Translate into Hatcher's notation
Reliability: May contain mistakes
Citation policy: Cite explicitly when used
```

## Conflicting sources

When sources appear to disagree, the agent should identify:

- what each source states;
- the exact passages involved;
- whether the difference is substantive or notational;
- which source and convention govern the current session;
- whether one claim corrects another;
- what remains unresolved.

The agent should not create a blended account that hides the conflict. The primary text governs local interpretation by default, but not mathematical truth by decree.

## Project instructions

Project instructions are durable policies that apply across sessions. Examples include:

```text
- Assume I have encountered the material before unless I say otherwise.
- Preserve productive struggle during exercises.
- Use the primary text's notation.
- Emphasize motivation, definitions, and structural proof ideas.
- Distinguish sourced claims from agent-generated explanations.
- Cite prior learning assessments with evidence.
- Do not use solutions unless I explicitly request them.
```

Project instructions should be editable, versioned when important, and visible to the reader.

## Session instructions

Session instructions refine project behavior for one local purpose:

```text
- Focus on geometric intuition today.
- Treat the selected lecture notes as supplementary.
- Explain this proof in full detail, but survey the surrounding examples.
- Do not test recall during this session.
- Treat my attached proof as unfinished work.
```

Session instructions do not modify the project defaults for future sessions.

## Branch and activity instructions

A branch may apply temporary changes such as:

- switch to prerequisite mode;
- use a comparison source;
- adopt slower, Socratic proof guidance;
- restrict attention to one selected equation.

An individual activity can make an even narrower change:

> For this exercise, remain silent until I ask for help.

When the branch or activity ends, the prior session behavior is restored.

## Instruction precedence and conflict

Instructions become more specific with local scope:

```text
Personal preferences
→ Project instructions
→ Session instructions
→ Branch instructions
→ Activity-local adjustment
```

Local instructions refine broader instructions but should not silently violate explicit safety, access, or provenance policies.

When instructions genuinely conflict, the agent should make the conflict visible and ask for resolution when the intended behavior cannot be inferred safely.

## Active context visibility

The reader should be able to inspect:

- which sources are active;
- what role each source has;
- which instruction scopes are currently applied;
- what temporary adjustments are in effect;
- whether the agent consulted a restricted or supplementary source.

The interface need not display the full configuration continuously, but the current behavior should never be mysterious.

## Agent responsibilities

The agent should:

- respect source roles and access policies;
- identify which source supports a claim;
- translate notation explicitly;
- avoid treating reader notes as authoritative without checking;
- distinguish source statements from its own synthesis;
- disclose meaningful conflicts;
- retrieve only sources relevant to the current session;
- preserve source versions and precise anchors in citations.

## Invariants

- A source's presence does not imply permission to use it in every context.
- Solutions require explicit access authorization.
- User-authored work remains distinguishable from source authority.
- Session instructions do not silently rewrite project instructions.
- Temporary adjustments expire with their declared scope.
- Conflicting sources are never silently blended.
- Claims derived from sources retain citations and version information.

## Related documents

- [Product model](product-model.md)
- [Session model](session-model.md)
- [References and citations](references-and-citations.md)
- [Design principles](design-principles.md)

