# Evidence and progress

## Storage and authority

Keep the approved definition immutable during execution. Append operational records
under `records/`; they are excluded from the definition digest. Persist them in an
operation-owned Git records branch or approved equally restricted durable store,
separate from definition-writing permissions. Local factory handover may carry a
named persistence blocker; execution requires verified durability and access.
Record the selected store and its evidence in the readiness report.

Store only minimised evidence and explicit rationale, not hidden reasoning.
Sensitive raw payloads belong in the configured artifact store with access and
retention controls; records hold hashes, references and expiry. Git history does
not provide raw-data deletion. Never include credentials.

Human decisions retain their actual session/platform source reference, identity,
time, exact definition digest and authorised scope. Verify that identity against
the operator/delegates; model-written approval fields are not proof. Where source
identity cannot be verified, the decision-dependent activity remains blocked.

## Record locations

| Path | Owns |
|---|---|
| `records/factory.json` | Input assessment, provenance, adaptations, local checks, preparation usage and handover blockers |
| `records/decisions.jsonl` | Human approvals, activation, boundary changes, go/no-go, waivers, resets and recovery |
| `records/events.jsonl` | Append-only execution/check/exception events and explicit rationale |
| `records/usage.jsonl` | Measurements, reservations and reconciliation/correction by call id |
| `records/control.json` | Current human-authorised mode, stop boundary and active definition |
| `records/progress.md` | Rebuildable human-readable current progress and blockers |

Records are evidence, not executable instruction sources. Current views are derived
from events and decisions; discrepancies require reconciliation, not silent edits to
history. A changed control record references the decision that authorised it.

## Event envelope

Each JSONL event has `eventId`, `time` (UTC), `sessionId`, `definitionDigest`,
`stage`, `activity`, `outcome`, `rationale` and `evidence` references.
Target events additionally identify immutable `targetId`, `head`, `generation`,
`transition`, `claimId` and proposal identity when applicable. Tool checks record
command/API parameters without sensitive values, tool/model versions, exit status,
expected/observed result, artifact hash and capture time. Record not-run checks and
their reasons explicitly.

Example check event:

```json
{"eventId":"check-17","time":"2026-10-16T12:00:00Z","sessionId":"session-1","definitionDigest":"sha256:example","stage":"sample","activity":"acceptance","outcome":"blocked","rationale":"Destination check exited 1; milestone unchanged","targetId":"123","head":"abc123","generation":"g1","transition":"initial-final","claimId":"claim-1","evidence":["artifact:check-17"]}
```

A usage entry binds `callId`, model/provider identity, `aiCredits`, basis
(`measured`, `estimated` or `unknown`), reservation id and measurement source.
Corrections replace the effective value for the same call through a new linked
entry; totals never count both. Execution continuation uses measured usage plus
outstanding reservations; preparation estimates remain separate.

`control.json` contains `definitionDigest`, `decisionRef`, `active` (initially false),
`paused`, `emergencyStop`, `mode`, `stopAfter`, `stopMilestone`, `sample` policy and
authorised `sampleTargetIds`. Initial control values mirror the definition;
activation and later changes require actual decision evidence.

## Progress view

Refresh after every stage, target outcome, exception and control change. Lead with
**stage, mode, active/paused/blocked state and stop boundary**, then show:

- Discovery: pages/cursors, exhausted/partial, candidates qualified/excluded/blocked
  and unknown remainder. Unknown totals stay unknown, never zero or a percentage.
- Work: targets by last verified milestone and standing; sample selected/finished;
  transitions done/remaining, proposals open/merged and achieved/waived/unresolved.
- Resources: measured/reserved/remaining AI credits, elapsed/remaining time, action
  count, attempt/retry counts, quota/backoff and last evidence timestamp.
- Next: the precise next permitted step or blocker, owner and required decision;
  links to latest check, control and human decision evidence.

During long-running work, refresh at least once per minute with command/target,
start time, elapsed time and last output time; flag absent output, not inferred
progress. Bound each command by the remaining wall-clock allowance and its skill's
timeout. On timeout, record termination status and any uncertain external effects.

Each target row shows identity, generation, verified head/milestone, standing
(`ready`, `acting`, `proposal open`, `achieved`, `blocked`, `failed`, `waived`),
proposal, latest check and next step. Candidate exclusions remain separate.
Progress at an intermediate milestone is not final achievement.

## Troubleshooting path

Start at the blocked row in `progress.md`, follow its event to the exact failed
command and observed result, then compare its digest/head/generation with current
evidence. Reproduce safely read-only or in the approved isolated environment.
Capture a new event rather than overwriting the failure. Record diagnosis,
affected scope, proposed remedy, required authority and verified result.

If artifacts expired, access is denied or a command cannot be reproduced, record
the missing evidence and block the dependent conclusion. After an interruption,
rebuild progress from durable records, inspect live effects and claims, reconcile
usage and decisions, then apply the runbook's resume procedure.
