# Operation factory

Build an inactive operation repository from **an exploration skill and an action
skill**, supplied when the operation is defined. Every operation uses the same
supervisor, lifecycle, controls, records and verification procedure.

This is a document-first factory for Copilot sessions in dev containers, not an
autonomous runtime. Local checks verify packaging and settings. Execution requires
observed evidence for the runbook's gates; instructions alone enforce nothing.

## Run the factory

1. Open this repository in its dev container and start a Copilot session.
   Select `creator`.
2. Supply the intent, the two skill directories and an approved output directory
   outside this checkout. Skills are operation inputs, not installed factory skills.
   If either is missing, preparation remains a draft.
   New repositories use `operation-<UTC timestamp>-<intent slug>`, without a
   random suffix.
   The Creator proposes the exact directory for approval, preserves the instance
   identity on resume and refuses collisions. Definitions record their factory
   provenance; published repositories also carry factory topics and a README notice.
3. Answer the Creator's focused questions about scope, goal, milestones, limits,
   privacy, sampling and where to stop. It recommends answers and resolves conflicts
   using the [skill contract](templates/operation/SKILLS.md).
4. Review the assembled repository and skill-assessment evidence. The Creator runs:
   ```sh
   mise exec -- node templates/operation/scripts/verify.mjs /absolute/output/path \
     --base templates/operation
   ```
   Resolve every failed check or essential decision before approving the exact
   definition and destination. External execution prerequisites may remain explicit
   readiness blockers.
5. Receive the complete local repository, inactive, with provenance and verification
   records. GitHub publication is optional and separately approved. Open the result
   in its dev container and follow its README to run the operation.

Example request:

```text
Prepare an operation to upgrade our Scala repositories.
Exploration skill: /approved/scala-exploration
Action skill: /approved/scala-upgrade
Output: /approved/operation-20261016T151019Z-scala-upgrade
Stop after exploration; do not run target discovery here.
```

## Where to look

| Question | Source of truth |
|---|---|
| Factory architecture and file ownership | [DESIGN.md](DESIGN.md) |
| Factory preparation steps | [prepare-operation](.github/skills/prepare-operation/SKILL.md) |
| Supplied skill completeness and suitability | [SKILLS.md](templates/operation/SKILLS.md) |
| Operation-specific values | [operation.json](templates/operation/operation.json) |
| Execution, stage stops, samples and exceptions | [RUNBOOK.md](templates/operation/RUNBOOK.md) |
| Evidence, progress and troubleshooting | [RECORDS.md](templates/operation/RECORDS.md) |
| Pre-publication independent review | [review-change](.github/skills/review-change/SKILL.md) |
| Vocabulary | [CONTEXT.md](CONTEXT.md) |

## Maintain the factory

Use mise and `.tool-versions`. Container setup supplies Copilot and `gh`; record
their actual versions with session evidence. To check the factory:

```sh
mise exec -- node templates/operation/scripts/verify.mjs templates/operation --template
mise exec -- node --test tests/factory.test.mjs
```

The tests use temporary synthetic skills and repositories, never live targets.
They establish local contracts, not live permission, isolation, claim or metering
guarantees. Change the shared base here; existing operations change only through
their own approved revision.
