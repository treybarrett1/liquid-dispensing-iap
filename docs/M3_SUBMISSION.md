# IAP M3 - Domain Model and AI Critique

Repository: **https://github.com/treybarrett1/liquid-dispensing-iap**

Prepared September 20, 2026. The supplied assignment lists a September 21, 2026, 11:59 PM deadline; its timezone is not stated in the screenshot.

## Submission evidence

| Required item | File |
| --- | --- |
| Diagram image | [PNG](diagrams/M3_DOMAIN_MODEL.png), with a scalable [SVG](diagrams/M3_DOMAIN_MODEL.svg) alternative |
| Diagram source | [Mermaid source](diagrams/M3_DOMAIN_MODEL.mmd) and [render configuration](diagrams/mermaid-config.json) |
| Revised model explanation and M2 traceability | [M3_DOMAIN_MODEL.md](M3_DOMAIN_MODEL.md) |
| Saved AI first draft | [M3_DOMAIN_FIRST_DRAFT.md](ai/M3_DOMAIN_FIRST_DRAFT.md), unchanged since evidence commit `63ed81f` |
| AI input and provenance | [Exact prompt](ai/M3_DOMAIN_PROMPT.txt), [M2 requirements](M2_REQUIREMENTS.md), and [run context/hash](ai/M3_DOMAIN_CONTEXT.md) |
| Written critique | [M3_AI_MODEL_CRITIQUE.md](M3_AI_MODEL_CRITIQUE.md) |
| Prompt-and-diff log | [AI_LOG.md](../AI_LOG.md), September 20 M3 entry |

## Rubric map

| Criterion | Points | Evidence |
| --- | --- | --- |
| Well-formed, readable, correctly notated diagram | 4 | Rendered UML class diagram with attributes, associations, multiplicities, composition, dependency, and a bounded-retention note; legend in the model explanation. |
| Model traces to M2 | 3 | One traceability row per class, covering US-01 through US-08; the model also explains how all three NFRs constrain the design. |
| Source alongside image | 1 | `.mmd`, `.png`, and `.svg` files share the same base filename in `docs/diagrams/`. |
| Specific structural critique | 4 | O-01 through O-04 and U-01 through U-05 name actual classes, fields, ownership, and multiplicities in the preserved draft; a separate section evaluates unsupported relationships. |
| Reasons for differing choices | 2 | Each critique finding explains the replacement and its M2/lifecycle justification; the conclusion acknowledges the simplification's limits. |
| Prompt-and-diff log | 1 | Exact model-generation input, saved output, revision decisions, changed files, and verification recorded in the M3 log entry. |

## Reproduce the diagram

The export uses Mermaid CLI **11.17.0**, with the committed configuration. From the repository root:

```sh
npx --yes --package @mermaid-js/mermaid-cli@11.17.0 mmdc -i docs/diagrams/M3_DOMAIN_MODEL.mmd -o docs/diagrams/M3_DOMAIN_MODEL.svg -c docs/diagrams/mermaid-config.json -w 2400 -H 1800 -b white
npx --yes --package @mermaid-js/mermaid-cli@11.17.0 mmdc -i docs/diagrams/M3_DOMAIN_MODEL.mmd -o docs/diagrams/M3_DOMAIN_MODEL.png -c docs/diagrams/mermaid-config.json -w 2400 -H 1800 -s 2 -b white
```

The renderer needs a compatible Chromium executable. This run used an existing local Chromium via Mermaid CLI's `-p` Puppeteer configuration option; the machine-specific executable path is not committed. A standard CLI installation can use its managed browser. Rendering tools were installed outside the repository, leaving application dependencies unchanged. SVG identifiers/PNG bytes can vary with renderer/browser versions; the Mermaid source is authoritative.

## Status and boundaries

The first AI draft was committed before the revised diagram and critique existed. The revision is AI-assisted and explicitly identified as such. It is a conceptual domain model, not implemented firmware, a database migration, or proof of physical dispensing performance.

The full application remains separate from this public coursework repository. M3 changes documentation and diagram assets only; the M2 requirements, calculator code, package lockfile, tests, and compile-only ESP32 check are preserved. Diagram rendering, image readability, file links, source/draft integrity, and the documentation-only diff are checked before publication.

Submit the repository URL and the required files/links through the course website. Preparing and pushing this evidence does not submit the assignment there.
