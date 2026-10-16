# Run this operation

Created by [gh-operation-factory](https://github.com/kelvin-chappell/gh-operation-factory).
The `provenance` in [operation.json](operation.json) records this instance and its
factory source. The checker reports its dated repository name. These markers aid
discovery; they do not establish ownership, approval or authority.

This repository contains one operation. Its initial state is **inactive**.

1. Open the repository in its dev container. Start a Copilot session and select
   `supervisor`.
2. Read [operation.json](operation.json) for the approved values and
   [RUNBOOK.md](RUNBOOK.md) for the shared procedure. Inspect the factory assessment,
   approval and any blockers in `records/`.
3. Run `mise exec -- node scripts/verify.mjs .`. A package pass does not establish
   execution readiness.
4. Ask the Supervisor to verify readiness and report the proposed mode, sample and
   stop boundary. Authorise the exact definition and permitted activity explicitly.
5. Follow progress in `records/progress.md`. To pause, change a boundary, troubleshoot
   or resume, use the controls in the runbook. [RECORDS.md](RECORDS.md) explains the
   evidence behind each reported result.

Example session instruction:

```text
Verify readiness and report blockers. Once I authorise exploration, inspect the
configured sample read-only and stop after exploration. Do not perform actions.
```

The supplied [exploration](.github/skills/explore/SKILL.md) and
[action](.github/skills/act/SKILL.md) packages contain domain work, not lifecycle
policy. [SKILLS.md](SKILLS.md) owns their assessment contract, including replacements.
No return to the factory is needed. Real blockers, human review and resource
limits can prevent completion; a stopped or sampled run is not a completed operation.
