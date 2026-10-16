# Supplied skill contract

Supply the exploration and action skills **at operation definition time**. The
factory contains neither domain implementation. Each is a directory with
`SKILL.md` and any local references or helpers it needs. The factory installs the
reviewed snapshots as `explore` and `act`; it records original hashes and adaptations.

## Package structure

Each `SKILL.md` has YAML frontmatter containing only single-line `name` and
`description` fields, followed by these non-empty sections. The local checker
recognises structure, not semantic quality.

| Heading | Exploration skill | Action skill |
|---|---|---|
| `## Purpose` | Discovery and qualification goal | Supported transformation and exclusions |
| `## Inputs` | Scope, exclusions, cursor, revision | Target id/head, generation, source/destination milestone, bounds |
| `## Procedure` | Paginated read-only discovery; deterministic qualification and detection | One adjacent transition, idempotent handling of existing work |
| `## Outputs` | Candidate evidence, target identities/heads, stages, cursor/exhaustion | Diff/proposal candidate, check evidence and outcome |
| `## Verification` | Commands/API queries, expected results, negative and error cases | Destination and full acceptance checks, including default-branch verification |
| `## Exceptions` | Access, ambiguous/missing content, unsupported stages, partial search | Conflicts, forbidden edits, partial effects, transient/substantive failure |
| `## Safety` | Read-only permissions, data minimisation | Allowed paths, isolated execution, effect and rollback bounds |
| `## Compatibility` | Supported layouts/tools; mapping into action inputs | Supported source/destination pairs, prerequisites and tool versions |

Dependencies are package-local files or tools pinned in the skill package's
`.tool-versions` and declared in `environment.tools`. Run those tools through mise
in that package's directory; keep the shared root pins unchanged.
Shared lifecycle and safety policy belong to the base, not a supplied package.
Packages cannot add auto-loaded agents,
hooks, workflows, external connections or alternate approval/publication procedures.

Use inline Markdown links for local dependencies, including invoked helpers.
The checker validates link paths; assessment must also verify command paths,
section anchors and any free-text references.

## Definition-time assessment

Record **pass, fail or blocked with evidence for every row** above, then assess:

1. **Fit:** the skills implement the actual intent and every configured milestone;
   their permissions and changes stay inside the approved scope.
2. **Handoff:** exploration output supplies all action inputs, including stable
   identities, exact revisions and the configured sampling strata. Define each
   stratum's grouping rule and require one value per eligible target per dimension.
   Checks distinguish exclusion from error and exactly one supported milestone
   from unknown or mixed state.
3. **Checks:** checks have commands, timeouts and expected results, are deterministic
   and cover the complete target, not just a version string. Independent acceptance
   can rerun without trusting an actor's success claim. Missing checks are defects,
   not operator waivers.
4. **Recovery:** partial results, duplicate work, drift, retries, existing proposals
   and rollback/manual repair are explicit. No failure becomes success by default.
5. **Evidence:** isolated synthetic cases cover eligible, ineligible, already-done,
   ambiguous, failure and interrupted/resumed work. For staged work, exercise each
   adjacent transition and incompatible input/output.

Inspect referenced helpers and dependencies as well as prose. Never execute imported
code merely to assess its trustworthiness. Resolve defects before approval; record
unprovable live capabilities as execution blockers. Replacing either skill changes
the definition and requires fresh assessment, verification and human approval.
