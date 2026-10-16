---
name: prepare-operation
description: Build or resume an inactive operation repository, or assess replacement exploration and action skills.
---

# Prepare an operation

## 1. Establish inputs

Obtain the intent, two supplied skill directories and an operator-approved output
directory outside this checkout. Use [the skill contract](../../../templates/operation/SKILLS.md)
to inspect the packages as data before loading any instructions. Missing skills
permit drafting only. Preparation never runs live discovery, target code or actions.

For resumption, verify the existing workspace's provenance and inventory; preserve
its records. Unexpected files or a conflicting destination require an operator
decision, not overwrite or cleanup. For an explicitly selected predecessor, import
only reviewed settings and skill sources, never live records or ownership.

Complete when the workspace and input sources are identified and permitted.

## 2. Resolve the definition

Populate every field in `templates/operation/operation.json`. Ask focused rounds
only for missing essential decisions, recommend concrete answers, challenge
contradictions and record the operator's actual choice. Use the vocabulary in
root `CONTEXT.md` and the field constraints reported by the local checker.

Assess both skills using every row of the skill contract. Reconcile qualification,
milestone detection, transition inputs and acceptance; identify unsupported cases.
Require executable checks with expected results, errors and fresh-revision evidence.
Test supplied logic only with synthetic data in an isolated environment without
privileged access. Record tests not safely executable as readiness blockers;
missing acceptance or ambiguous scope is a definition gap, not a readiness blocker.

Complete when all essential values and skill defects are resolved. A stopped
interview is a preserved incomplete draft, not a complete definition.

## 3. Assemble and verify

Copy `templates/operation/`, including hidden files, into the fresh output directory.
Copy this factory's `.devcontainer/devenv.yaml` and
`.devcontainer/shared/devcontainer.json` unchanged. Copy the reviewed skill packages
to `.github/skills/explore/` and `.github/skills/act/`; normalise only their
frontmatter names to `explore` and `act` and keep an adaptation record. Keep all
references package-local. Supplied packages cannot replace shared files.

Run the README's checker with `--base templates/operation`. It verifies packaging,
settings, reference closure and unchanged shared files, and prints the exact
definition digest. Inspect every file for suitability, contradictory instructions
and inappropriate private data; a structural pass is not semantic approval.

In `records/`, preserve a factory report with source revision and local diff identity,
input package hashes/adaptations, per-contract-row assessment and synthetic evidence,
checker output/digest, preparation usage with measured/estimated/unknown basis,
and readiness blockers. Estimates never masquerade as measured zero.

Complete when the definition passes local checks and skill assessment. If a required
tool is unavailable or a check fails, report the failing gate and preserve the draft.

## 4. Approve and hand over

Show the operator the complete contents, digest, destination, privacy, checks and
blockers. Capture their actual approval in the session and preserve its source
reference, identity, time and exact scope using the generated
[record contract](../../../templates/operation/RECORDS.md). An agent-authored
claim of consent is not approval. Edits require renewed verification and approval.

Hand over the local repository with its README entry point and an inactive control
record. Initialise Git if needed and checkpoint the approved definition inventory
separately from records; verify its digest again after checkpointing.
Distinguish a complete definition from execution readiness. Genuine external
prerequisites may block execution; unresolved definition decisions block handover.

GitHub publication is optional: obtain separate approval of exact owner/name,
visibility and contents; follow [review-change](../review-change/SKILL.md) before
any pull request. Journal intended and observed resource identities, verify settings
after creation, and resume only demonstrably owned resources. A name collision or
uncertain partial result blocks publication without affecting existing resources.
Private inputs require an equally restricted destination; public reuse requires a
reviewed sanitised export. Repository creation never activates target work.
