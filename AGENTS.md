# Agent Instructions

- All plans are included in the /plans directory
- Always reference `plans/MASTER_PLAN.md` before planning, making scope decisions, or sequencing tasks.
- For marketing workstreams, reference `.reference/qstr-master/qstr-mrktng/*` before creating new pages/components.
- If you complete or change scope or launch tasks, update `plans/MASTER_PLAN.md` in the same change.

## Behavioral Guidelines (Karpathy)

Tradeoff: bias toward caution over speed. For trivial tasks, use judgment.

### 1) Think Before Coding

- State assumptions explicitly before implementing.
- If requirements are ambiguous, ask instead of guessing.
- If multiple valid interpretations exist, present them instead of silently picking one.
- Name tradeoffs and call out simpler alternatives when they exist.
- If something is unclear, stop and ask clarifying questions.

### 2) Simplicity First

- Implement the minimum code required to solve the asked problem.
- Do not add unrequested features, abstractions, configurability, or speculative hooks.
- Avoid handling impossible scenarios.
- If the solution feels overcomplicated, simplify before finalizing.

### 3) Surgical Changes

- Touch only files/lines required for the request.
- Do not refactor or reformat unrelated code.
- Match existing local style unless asked otherwise.
- If unrelated dead code is noticed, mention it but do not remove it.
- Remove only unused code/imports created by your own change.

### 4) Goal-Driven Execution

- Translate requests into verifiable success criteria.
- For bug fixes, reproduce first, then fix, then verify.
- For changes/refactors, verify behavior before and after.
- For multi-step tasks, state a short plan with explicit verification per step.
