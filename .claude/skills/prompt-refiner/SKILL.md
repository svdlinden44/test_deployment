---
name: prompt-refiner
description: >
  Pre-flight requirements gathering and research workflow. Runs BEFORE any real work begins
  on complex or multi-step tasks. Prevents the "built the wrong thing" failure by running
  through three checkpoints: (1) clarify ambiguities with the user, (2) rewrite the prompt
  into a specific validated spec, (3) research the codebase + external best practices and
  propose an approach — all before a single line of work is done.

  Use this skill for ANY substantial task where misinterpretation would waste effort:
  feature builds, refactors, integrations, migrations, architectural changes, or anything
  that would take more than ~15 minutes to complete. Always trigger this skill before
  starting the actual work, even if the prompt seems detailed — a brief clarification round
  is cheap; rebuilding the wrong thing is not. Do not use for simple factual questions,
  single-sentence edits, or quick lookups.
---

# Prompt Refiner

Your job is to make sure you and the user are completely aligned before any real work starts.
This workflow has three gates. Don't skip any of them, even for prompts that seem clear —
"clear" often means the user filled in gaps with assumptions that you don't share.

---

## Gate 1 — Clarify

Read the user's prompt carefully. Your goal here is to find the things that, if
misunderstood, would cause you to build something significantly different from what they
actually want.

Look for gaps in these areas:

- **Goal**: What does "done" look like? Is there an outcome beyond the immediate task?
- **Scope**: How much? Which parts? What's in, what's out?
- **Constraints**: What must stay the same? What integrates with what? Any performance/security requirements?
- **Output format**: What format? Where does it live? Who consumes it?
- **Priority**: If tradeoffs are needed, what matters most?

Ask **2–4 questions maximum** — the ones that would most change your approach if answered
differently. Don't ask about things you can reasonably infer, and don't ask questions whose
answers won't change what you do. Use `AskUserQuestion` with structured choices where the
answer space is knowable; use open text for genuinely open-ended questions.

After getting answers, move to Gate 2.

---

## Gate 2 — Refined Prompt + Validation

Synthesise the original prompt and the clarification answers into a single, complete,
unambiguous specification. Write it as if handing off to a new developer who has no prior
context.

The refined spec should cover:
- What is being built / changed
- Why (the underlying goal)
- Specific scope: what's included and what's explicitly excluded
- Constraints and integration points
- Expected output / deliverable

Present it like this:

```
Here's my refined understanding of the task:

---
[The refined spec — a few tight paragraphs or a short structured list]
---

Does this capture what you're going for? Any corrections before I start researching?
```

Wait for the user to confirm or adjust. Update the spec if needed. Only move to Gate 3
once they've signed off.

---

## Gate 3 — Research + Approach + Validation

This gate has two parts: research and propose.

### Research

Run both of these in parallel — don't wait for one before starting the other:

**A. Codebase scan** (if a project is available):

Look for the parts of the codebase most relevant to the task. Typical commands:
```bash
# Find related files
grep -rn "<relevant keyword>" <project_path> --include="*.py" --include="*.ts" -l

# Check existing patterns
ls <project_path>/backend/apps/<relevant_app>/
ls <project_path>/frontend/src/features/<relevant_feature>/

# Read key files that will be affected
```

You're looking for:
- Existing patterns to follow (models, views, components, hooks that this task should mirror)
- Files that will need to change
- Any existing implementations that the task might conflict with or build on

**B. External research** (where relevant):

Search for best practices, library docs, known pitfalls, and real-world approaches for the
specific technology or problem. Good search queries are specific: not "how to add payments"
but "Stripe webhook idempotency Django best practices 2024". Focus on:
- The recommended approach for this specific type of problem
- Common pitfalls and how to avoid them
- Any security or performance considerations worth flagging

### Propose

Synthesise your research into a clear implementation approach. Present it as:

```
Here's what I found and how I'd approach this:

**What already exists:**
[Relevant existing code, patterns, or infrastructure]

**What I'll need to create/change:**
[Files, components, APIs — with brief reasoning]

**Approach:**
[2–3 sentences describing the implementation strategy, referencing specific patterns
from the codebase and any external best practices worth noting]

**Potential risks / open questions:**
[Anything that could cause problems or that I'm making a call on]

Ready to start, or any adjustments first?
```

Wait for a green light. If the user has corrections, update your approach and confirm once
more before beginning.

---

## Gate cleared — Execute

Once the user has signed off on the approach, begin execution. Treat the refined spec as
your contract — if you encounter something mid-task that would require deviating from it,
pause and surface it rather than silently making a call.