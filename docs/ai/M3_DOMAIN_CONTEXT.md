# M3 first-draft provenance

- Date: 2026-09-20.
- Tool: OpenAI Codex, separate agent task `m3_first_domain_draft`.
- Conversation history shared: none (`fork_turns: none`). No model override was requested; an independent model-version identifier was not returned.
- Exact request: [M3_DOMAIN_PROMPT.txt](M3_DOMAIN_PROMPT.txt).
- Input: [M2 requirements](../M2_REQUIREMENTS.md), unchanged from public commit `d836675660876fc5fea90688d79d65f282563501`.
- Input SHA-256: `4228590FF18BEAC73E86CD684A029B3909C16DFDDEFE64BEBB6811BFAE5800DE`, measured from the local file's UTF-8 bytes before the run.
- The agent was permitted to read only that file and was asked for a model, traceability, and assumptions. It was not given a competing model or instructions to make particular mistakes.
- The first returned answer is the audit subject. No second draft or alternative answer is substituted for it.
- Complete unchanged answer: [M3_DOMAIN_FIRST_DRAFT.md](M3_DOMAIN_FIRST_DRAFT.md), saved at 2026-09-20 13:53 America/Chicago before creating the revised model.
- First-answer SHA-256: `A918D983841026F9FA95D27270DA177C38AAB9844BF7364B30698C5FC1F16A5F` (UTF-8, LF line endings, one final newline).
- Prompt SHA-256: `D9F8F2D87E5ADC16C3A13047133ECEEF5CA2062D63D9994136DC104DF18F459E` with the same encoding convention.
- The first draft and this provenance are committed in a separate evidence commit before authoring the revised diagram or critique. Markdown's two-space hard line break in the response is deliberately preserved.

The separate session is the AI tool required by the assignment. The main Codex session subsequently assists with the revised model, diagram rendering, and critique. This assistance is disclosed; the revised model is not represented as unaided student work.
