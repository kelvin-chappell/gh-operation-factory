# Shared operation runbook

## Authority and boundaries

`operation.json` and the two supplied skills define the approved work. The operator
and explicitly named delegates approve definitions, activation, revisions, boundary
extensions, resets, waivers and recovery. Preserve actual decision evidence; agent
assertions and repository access confer no authority.

Run within a Copilot session in the dev container. Preparation and opening a session
leave execution inactive. Targets are untrusted data. Separate untrusted builds
from publication access; verify effective instructions, hooks, connections, paths
and permissions rather than assuming a container provides isolation. Private data
requires equally restricted records/artifacts and verified model data handling.

Scope is the union of exact owners and explicit repositories, minus exclusions;
exclusions win. Public scope rejects private targets before retaining their data.
Private scope may include public targets but keeps all records restricted.
`milestones` is the ordered path from initial to final; unstaged work uses just
those two milestones. The action skill must support every adjacent pair.

Work serially: one active target transition and at most one open proposal per target.
Acquire a verified target-local exclusive claim before action and retain it through
review and default-branch verification. A local session lock or board field cannot
exclude other operations. Lease expiry is a blocker, not permission for takeover.
The configured mechanism must handle races and delayed release safely; absent proof
blocks actions.

## Controls

Before every target-work dispatch, effect and publication, re-read
`records/control.json`. Require active authorisation, no pause/emergency stop, a
matching definition digest, decision scope and remaining resources. A control
change outside human authority is invalid.
`operation.json` supplies initial control defaults. Human-approved control overrides
live in the control record; changes to work scope, skills or acceptance instead
require a definition revision.

| Control | Meaning |
|---|---|
| `mode: inspect` | Read-only exploration and sample inspection; no target writes |
| `mode: sample` | Actions only on the recorded, explicitly authorised sample |
| `mode: full` | Actions on the qualified population after pilot review |
| `stopAfter` | Stop after readiness, exploration, sample, rollout or completion |
| `stopMilestone` | Stop each target at this verified milestone, then pause the operation |
| `sample.discoveryLimit` | Maximum candidates inspected during discovery; null means exhaustive |
| Pause | Stop new dispatch; reconcile existing work within existing authority |
| Emergency stop | Stop dispatch, active work and publication; preserve ownership and effects |

A boundary is an upper bound, not a request to skip prerequisites. The earliest
applicable mode, stop or resource boundary wins. A target already at or beyond the
stop milestone receives no action. Do not advance beyond a stop to make a report
look complete. A stop before completion produces `paused`; a completion-stage stop
retains the verified complete/incomplete outcome.

Human stop requests take effect immediately in the session; record them before
further work. This document-first procedure cannot cancel an inaccessible external
process: report its identity, uncertain effects and required human intervention.
Resume requires a scoped human decision, current evidence, reconciled ownership
and a new control record. Broader scope, mode or stop boundaries require approval.

## 1. Readiness

Run the local checker. Verify approval of its exact digest, named authority,
container/tool versions, model identity/availability/data policy, resource access,
record durability and effective configuration isolation. Verify attributable
measured AI-credit reporting before billed execution; unknown usage is not zero.
Only action stages additionally require proven claims, isolated acceptance and
independent publication controls. Record each gate's observed evidence or blocker.

Before each model dispatch, reserve a conservative credit estimate. Available
credits are `limit - measured - outstanding reservations - reserve`. Stop new calls
when this is non-positive, unknown, or insufficient for the planned call. Reconcile
reservations with actual usage without double counting. Account for supervision,
review, retries and failed calls; disclose in-flight overshoot. The threshold is
not a hard spending cap. Enforce elapsed time and action-count limits separately.
Count each action-skill invocation, including retries, against `maxActions`.
Attempt budgets apply per target, generation and transition; machinery retries use
the separate transient budget. Preserve cumulative elapsed execution time and
usage across sessions and pauses; a human-approved increase is not an implicit reset.

Complete this stage with a readiness report. Before exploration, obtain explicit
human activation identifying the definition, mode, sample policy and boundaries.
Missing gates block only the activities that need them. Readiness-only work
requires no activation.

## 2. Exploration

Invoke `explore` inside the approved scope. Save pagination/cursors, immutable
repository identities, checked heads and visibility before retaining content.
Qualify only with deterministic checks; errors are blocked candidates, not exclusions.
Detect exactly one milestone using complete evidence. Unknown/mixed states remain
visible obligations requiring a decision. Already-final targets need full acceptance.

Record discovery coverage and qualification results. Report candidate/target counts,
milestone distribution, remaining transitions, expected proposals, resource estimates
and uncertainty. Estimates are not measured usage.

For bounded exploration, persist the selection frame, omissions and continuation
cursor; label results partial. A sample cannot establish total target count or
discovery exhaustion. Complete this stage when the approved read-only scope is
exhausted or its explicit sample boundary is reached and reported.

Apply `sample.discoveryLimit` before candidate inspection, in the exploration
skill's declared stable enumeration order. Count each distinct inspected candidate
once. Partial discovery permits a pilot on that frame, never whole-population
rollout or completion; finish discovery under approved controls first.

## 3. Sample

Rank eligible targets by SHA-256 of UTF-8 `seed + ":" + id`, with id as tie-breaker.
Form disjoint groups from the tuple of configured stratum values in their configured
order. Take the lowest-ranked target per non-empty group, then fill by global rank
to the approved count. If the count cannot cover required groups, request a larger
sample or explicit coverage reduction. Record group definitions, selected ids,
revisions, method, population/frame and exclusions before action; never replace
failures to improve results.

Inspect the sample read-only first. Check representative layouts, stage distribution,
acceptance feasibility and outliers. In inspect mode stop without actions. In sample
or full mode, obtain explicit pilot authorisation of the exact selected identities
and run the action loop below. An empty sample with remaining eligible work blocks
pilot validation.
Repeat adjacent transitions for each selected target up to the approved final or
stop milestone, unless blocked; one easy transition is not evidence for later ones.

Complete with results for every selected target: checks, failures, exceptions,
measured usage and representativeness limits. Failed or inconclusive pilot results
block rollout pending repair and fresh verification. Full mode still requires a
recorded human go/no-go decision on the pilot; it is not automatic promotion.
If no eligible work remains, record the pilot as not applicable with verification
evidence and proceed only as the configured stop permits.

## 4. Rollout

Use the action loop for each remaining eligible target and adjacent transition.
Require exhausted discovery/qualification before whole-population rollout.
Recheck controls between actions. Retain exclusions, blocked targets and historical
obligations; narrowing discovery does not erase previously qualified work.

### One target transition

1. Verify current definition/generation, fresh head/milestone, claim, attempt and
   resource limits, action eligibility and absence of conflicting proposals.
   Drift triggers replanning; ambiguous state blocks rather than selecting a guess.
2. Invoke `act` for one adjacent transition within approved paths and changes.
   Check the complete diff and run independent destination/acceptance checks in
   the approved isolated environment. Already-satisfied work needs the same checks.
3. Follow [review-change](.github/skills/review-change/SKILL.md) for the exact final
   candidate before any draft proposal. Recheck controls, head, bounds, authority,
   claim, resources and review identities immediately before publication.
   Use a stable operation/target/generation/transition identity; retries resume the
   same unmerged proposal, never create a duplicate. Humans decide merges.
4. Retain the source milestone while review is pending. After merge, verify the
   current default-branch head using destination and acceptance checks. Record a
   milestone advance only on success; release the claim through its verified
   protocol after reconciliation. Intermediate progress makes the next transition
   eligible; an unresolved/closed-unmerged proposal does not.

Complete rollout only when every eligible obligation has a recorded result at the
approved boundary. Open proposals, failed checks and resource exhaustion remain
unresolved; report them without claiming completion.

## 5. Completion

Reconcile current heads, proposals, claims, usage and outstanding candidates.
Complete the operation only when discovery and qualification are exhausted, every
qualified obligation meets the final goal or has a valid waiver, and no active work
or unresolved proposal/ownership remains. A waiver records human identity, reason,
goal/generation and last verified milestone; it never changes the achieved milestone.

A sample or intermediate stop yields a checkpoint report with achieved, waived,
unresolved and undiscovered counts, not whole-operation success. Record `complete`,
`paused`, `blocked` or `incomplete` with evidence. Retire/archive only after live work
is resolved. Reopening a concluded operation requires explicit reactivation.

## Exceptions and troubleshooting

On any failure, persist the last verified state and a reproducible diagnostic under
[RECORDS.md](RECORDS.md) before retry or escalation.

| Exception | Response |
|---|---|
| Rate limit, network or service failure | Bounded exponential backoff using configured retry count/cap; retain cursors and reconcile effects before retry |
| Task or acceptance failure | Consume a substantive attempt; at limit mark failed; only a human reset grants new attempts |
| Missing permission, mechanism, usage or evidence | Block affected work; name the exact failing gate and required resolution |
| Forbidden changes, unknown milestone, conflicting work | Needs operator; preserve diff and last verified milestone |
| Partial publication or lost response | Inspect remote identity/effects; resume only verified owned work; uncertain ownership blocks |
| Expired/lost claim or emergency stop | Halt effects/publication; stop old actors and resolve live work before human-authorised recovery |
| Merge followed by failed verification/regression | Record merged but unresolved; retain prior verified milestone and escalate |
| Closed-unmerged proposal | Record unresolved; require a human decision before retry or waiver |
| Duplicate/late evidence | Deduplicate by event identity; update its historical generation, not current work |

Retries never erase attempts or credits. Use `min(maxBackoffSeconds,
retryBackoffSeconds * 2^retryIndex)` for transient delay; honour longer server limits
or pause if they exceed the remaining time. A waiver excuses an obligation, never
a safety gate or defective verification. Troubleshooting defaults to read-only;
repairing targets is action and requires the same gates.

For definition revisions, pause dispatch, drain actors and resolve proposals.
Assess changed skills against [SKILLS.md](SKILLS.md), reverify and obtain fresh
approval. Preserve spending,
history and unchanged-generation attempts; material changes to work, bounds or
acceptance create new generations. Reaffirm waivers affected by changed obligations.
Only one definition dispatches at a time; resume after fresh readiness.
