# Factory design

## Boundary

```text
intent + exploration skill + action skill
                 |
        clarify -> assess -> assemble -> verify -> approve
                 |
          inactive operation repository
                 |
       readiness -> exploration -> sample -> rollout -> completion
```

The factory owns preparation. Each generated repository owns one operation and its
execution records, without a live dependency on this checkout. Preparation reads
supplied skill packages as data; it neither discovers nor changes live targets.
Execution happens in one coordinating Copilot session in the operation's dev
container, with explicit human decisions where required.

Only `operation.json` and the two supplied skill packages vary. Shared files are
copied unchanged, including the supervisor, read-only reviewer, runbook, records
contract, review procedure, local checker and container configuration. Extra domain
agents, lifecycle variants, boards, controllers and workflows are unnecessary.
An unsupported capability requires a factory change, not a per-operation override.

## Document ownership

The root README owns human factory startup. The preparation skill owns assembly and
handover. The skill contract owns input assessment. `CONTEXT.md` owns vocabulary.
This file owns architecture, not a second procedure or policy manual.

The generated README owns operation startup and the visible factory-origin notice.
`operation.json` owns values, including instance provenance, not procedure. The
checker owns dated repository-name derivation and provenance structural rules;
preparation owns identity creation, collision handling and publication topics.
`RUNBOOK.md` owns execution and authority rules. `RECORDS.md` owns record
formats and diagnostic navigation. Agent profiles and `AGENTS.md` are routing
pointers. The review skill owns pre-publication review; both workspaces contain the
same copy so each works independently.

The checker owns local structural rules. Tests exercise those rules with synthetic
inputs. Skill assessment and live execution evidence remain human-inspectable
records, not booleans that a model can set to grant itself authority.

## Verification boundary

There are four distinct results: a structurally valid package, suitable skills,
an approved definition, and an execution-ready operation. None implies the next.
The factory records each separately.

Local verification checks exact shared-file identity against the selected base,
allowed file inventory, settings, skill structure, placeholders and local links.
It returns a digest of the complete definition. It does not execute supplied skills
or prove their semantics. Preparation reviews their checks, bounds and failure
behaviour against the intent and uses synthetic cases.

Execution verifies real access, configuration isolation, exclusive claims,
authoritative attributable usage, independent acceptance and publication controls.
Unavailable mechanisms block the affected stage. There is no hidden application
or future service on which the runbook relies; an absent capability is an explicit
blocker, not an implemented guarantee.

Historical designs and declarative fixtures have been removed. Git history retains
the previous architecture; current documents describe only this factory.
