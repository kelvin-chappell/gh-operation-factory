import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { headings, operationRepositoryName, validateSettings, verify } from '../templates/operation/scripts/verify.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = resolve(root, 'templates/operation');

function settings() {
  return {
    id: 'synthetic-operation', intent: 'Exercise local packaging', operator: 'test-operator',
    provenance: {
      factoryRepository: 'kelvin-chappell/gh-operation-factory',
      factoryRevision: 'a'.repeat(40),
      factoryDiffSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      createdAt: '2026-10-16T15:10:19Z',
      instanceId: 'a1b2c3d4-1234-4abc-8def-123456789abc',
    },
    delegates: [], scope: { owners: ['example'], repositories: [], exclude: [], visibility: 'public' },
    goal: 'All acceptance checks pass', milestones: ['initial', 'final'],
    bounds: { allowedPaths: ['src/**'], forbiddenChanges: ['dependencies'] },
    limits: {
      aiCredits: 10, reserveCredits: 1, maxMinutes: 30, maxActions: 5,
      maxAttempts: 2, maxTransientRetries: 3, retryBackoffSeconds: 2, maxBackoffSeconds: 60,
    },
    controls: {
      mode: 'inspect', stopAfter: 'exploration', stopMilestone: null,
      sample: { discoveryLimit: null, size: 2, seed: 'fixed-seed', strata: ['milestone'] },
    },
    environment: {
      tools: ['node 24.21.0'], isolation: 'Pending live proof', claims: 'Pending race tests',
      usage: 'Pending attributable meter', publication: 'Pending independent controls',
      modelDataPolicy: 'Pending data policy verification',
    },
    records: { visibility: 'public', artifactLocation: 'restricted-test-store', retentionDays: 7 },
  };
}

function bundle(t) {
  const directory = mkdtempSync(resolve(tmpdir(), 'operation-factory-test-'));
  t.after(() => rmSync(directory, { recursive: true }));
  cpSync(base, directory, { recursive: true });
  for (const file of ['.devcontainer/devenv.yaml', '.devcontainer/shared/devcontainer.json']) {
    mkdirSync(dirname(resolve(directory, file)), { recursive: true });
    cpSync(resolve(root, file), resolve(directory, file));
  }
  writeFileSync(resolve(directory, 'operation.json'), JSON.stringify(settings(), null, 2));
  for (const name of ['explore', 'act']) {
    const packagePath = resolve(directory, '.github/skills', name);
    mkdirSync(packagePath, { recursive: true });
    writeFileSync(resolve(packagePath, 'SKILL.md'),
      `---\nname: ${name}\ndescription: Synthetic package for structural tests only.\n---\n\n` +
      headings.map(heading => `## ${heading}\n\nSynthetic ${heading.toLowerCase()}.\n`).join('\n'));
  }
  return directory;
}

function change(directory, file, transform) {
  const path = resolve(directory, file);
  writeFileSync(path, transform(readFileSync(path, 'utf8')));
}

test('shared template passes without supplying domain skills', () => {
  const result = verify(base, { template: true });
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.kind, 'template');
});

test('review policy and reviewer profiles match both independent workspaces', () => {
  for (const file of ['.github/skills/review-change/SKILL.md', '.github/agents/reviewer.agent.md']) {
    assert.deepEqual(readFileSync(resolve(root, file)), readFileSync(resolve(base, file)));
  }
});

test('complete synthetic definition passes and has a stable digest', t => {
  const directory = bundle(t);
  const first = verify(directory, { base });
  assert.equal(first.ok, true, first.errors.join('\n'));
  assert.match(first.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(verify(directory).digest, first.digest);
  assert.ok(first.files.includes('.github/skills/act/SKILL.md'));
  assert.equal(first.repositoryName, 'operation-20261016T151019Z-synthetic-operation');
});

test('repository naming is stable across resume and independent of checkout location', () => {
  const value = settings();
  const name = operationRepositoryName(value);
  assert.equal(operationRepositoryName(JSON.parse(JSON.stringify(value))), name);
  value.provenance.factoryRevision = 'b'.repeat(40);
  assert.equal(operationRepositoryName(value), name);
  value.provenance.instanceId = 'b1b2c3d4-1234-4abc-8def-123456789abc';
  assert.equal(operationRepositoryName(value), name);
  value.provenance.createdAt = '2026-10-16T15:10:20Z';
  assert.notEqual(operationRepositoryName(value), name);
});

test('repository names fit the GitHub limit without silent slug truncation', () => {
  const value = settings();
  value.id = 'a'.repeat(73);
  assert.equal(operationRepositoryName(value).length, 100);
  value.id += 'a';
  assert.throws(() => operationRepositoryName(value), /at most 73/);
});

test('provenance is part of the approved definition digest', t => {
  const directory = bundle(t);
  const before = verify(directory).digest;
  change(directory, 'operation.json', text => text.replace('a'.repeat(40), 'b'.repeat(40)));
  const after = verify(directory, { base });
  assert.equal(after.ok, true, after.errors.join('\n'));
  assert.notEqual(after.digest, before);
});

test('factory template cannot embed operation-specific skills', t => {
  const result = verify(bundle(t), { template: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /supplied only at definition time/);
});

test('records do not change the definition digest', t => {
  const directory = bundle(t);
  const before = verify(directory);
  mkdirSync(resolve(directory, 'records'));
  writeFileSync(resolve(directory, 'records/events.jsonl'), '{"outcome":"blocked"}\n');
  assert.equal(verify(directory).digest, before.digest);
});

test('definition bytes, including skill dependencies, change the digest', t => {
  const directory = bundle(t);
  const before = verify(directory).digest;
  writeFileSync(resolve(directory, '.github/skills/act/helper.txt'), 'synthetic evidence');
  assert.notEqual(verify(directory).digest, before);
});

const mutations = [
  ['missing skill', directory => rmSync(resolve(directory, '.github/skills/act/SKILL.md')), /missing required file/],
  ['missing container', directory => rmSync(resolve(directory, '.devcontainer/devenv.yaml')), /missing required file/],
  ['modified shared policy', directory => change(directory, 'RUNBOOK.md', text => `${text}\nOverride\n`), /differs from shared base/],
  ['extra agent', directory => writeFileSync(resolve(directory, '.github/agents/other.agent.md'), 'extra'), /unexpected definition file/],
  ['skill placeholder', directory => change(directory, '.github/skills/act/SKILL.md', text => `${text}\n{{missing}}\n`), /unresolved placeholder/],
  ['missing contract section', directory => change(directory, '.github/skills/act/SKILL.md', text => text.replace('## Verification', '## Checks')), /missing heading Verification/],
  ['empty contract section', directory => change(directory, '.github/skills/act/SKILL.md', text => text.replace('Synthetic verification.', '')), /empty section Verification/],
  ['wrong skill name', directory => change(directory, '.github/skills/act/SKILL.md', text => text.replace('name: act', 'name: alternate')), /expected name: act/],
  ['duplicate frontmatter', directory => change(directory, '.github/skills/act/SKILL.md', text => text.replace('name: act', 'name: act\nname: alternate')), /only single-line/],
  ['skill invocation override', directory => change(directory, '.github/skills/act/SKILL.md', text => text.replace('name: act', 'name: act\ndisable-model-invocation: true')), /only single-line/],
  ['broken reference', directory => change(directory, '.github/skills/act/SKILL.md', text => `${text}\n[missing](missing.md)\n`), /missing link/],
  ['escaping reference', directory => change(directory, '.github/skills/act/SKILL.md', text => `${text}\n[escape](../../../../README.md)\n`), /escaping link/],
  ['malformed encoded reference', directory => change(directory, '.github/skills/act/SKILL.md', text => `${text}\n[bad](%XX.md)\n`), /malformed link/],
  ['auto-loaded skill instructions', directory => writeFileSync(resolve(directory, '.github/skills/act/AGENTS.md'), 'override'), /auto-loaded/],
  ['hidden skill configuration', directory => writeFileSync(resolve(directory, '.github/skills/act/.mcp.json'), '{}'), /hidden skill configuration/],
  ['floating skill tools', directory => writeFileSync(resolve(directory, '.github/skills/act/.tool-versions'), 'node latest\n'), /exact version pin/],
  ['partial skill tool version', directory => writeFileSync(resolve(directory, '.github/skills/act/.tool-versions'), 'node 24\n'), /exact version pin/],
  ['symlink', directory => symlinkSync('/etc/passwd', resolve(directory, '.github/skills/act/outside')), /symbolic links/],
  ['malformed settings', directory => writeFileSync(resolve(directory, 'operation.json'), '{'), /operation.json:/],
  ['empty file', directory => writeFileSync(resolve(directory, '.github/skills/act/helper.txt'), ''), /empty file/],
];

for (const [name, mutate, expected] of mutations) {
  test(`rejects ${name}`, t => {
    const directory = bundle(t);
    mutate(directory);
    const result = verify(directory, { base });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), expected);
  });
}

test('package-local references and tool pins are allowed', t => {
  const directory = bundle(t);
  writeFileSync(resolve(directory, '.github/skills/act/reference.md'), '# Synthetic reference\n');
  writeFileSync(resolve(directory, '.github/skills/act/.tool-versions'), 'node 24.21.0\n');
  change(directory, '.github/skills/act/SKILL.md', text => `${text}\n[Reference](reference.md)\n`);
  assert.deepEqual(verify(directory, { base }).errors, []);
});

test('root directory symlinks are rejected', t => {
  const directory = bundle(t);
  const link = `${directory}-link`;
  symlinkSync(directory, link);
  t.after(() => rmSync(link));
  assert.equal(verify(link).ok, false);
});

const invalidSettings = [
  ['missing provenance', value => { delete value.provenance; }, /provenance: expected object/],
  ['invalid factory repository', value => { value.provenance.factoryRepository = 'unknown'; }, /expected owner\/repository/],
  ['floating factory revision', value => { value.provenance.factoryRevision = 'main'; }, /exact Git revision/],
  ['invalid factory diff', value => { value.provenance.factoryDiffSha256 = 'unknown'; }, /expected SHA-256/],
  ['invalid instance', value => { value.provenance.instanceId = 'not-a-uuid'; }, /UUID v4/],
  ['non-v4 instance', value => { value.provenance.instanceId = 'a1b2c3d4-1234-1abc-8def-123456789abc'; }, /UUID v4/],
  ['offset creation time', value => { value.provenance.createdAt = '2026-10-16T15:10:19+00:00'; }, /UTC timestamp/],
  ['fractional creation time', value => { value.provenance.createdAt = '2026-10-16T15:10:19.123Z'; }, /UTC timestamp/],
  ['invalid calendar date', value => { value.provenance.createdAt = '2026-02-30T15:10:19Z'; }, /UTC timestamp/],
  ['overlong intent slug', value => { value.id = 'a'.repeat(74); }, /at most 73/],
  ['unknown field', value => { value.controller = true; }, /unexpected setting/],
  ['missing value', value => { delete value.goal; }, /goal: expected text/],
  ['null limit', value => { value.limits.aiCredits = null; }, /aiCredits: expected positive/],
  ['negative limit', value => { value.limits.maxMinutes = -1; }, /maxMinutes: expected positive/],
  ['boolean limit', value => { value.limits.maxActions = true; }, /maxActions: expected integer/],
  ['fractional retry', value => { value.limits.maxTransientRetries = 0.5; }, /expected zeroInteger/],
  ['unsafe integer', value => { value.limits.maxActions = Number.MAX_SAFE_INTEGER + 1; }, /expected integer/],
  ['infinite credits', value => { value.limits.aiCredits = Infinity; }, /expected positive/],
  ['excessive reserve', value => { value.limits.reserveCredits = 10; }, /must be below/],
  ['invalid backoff', value => { value.limits.maxBackoffSeconds = 1; }, /below initial/],
  ['empty scope', value => { value.scope.owners = []; }, /specify owners/],
  ['invalid owner', value => { value.scope.owners = ['*']; }, /invalid owner/],
  ['invalid repository', value => { value.scope.repositories = ['example']; }, /owner\/repository/],
  ['duplicate milestone', value => { value.milestones = ['same', 'same']; }, /duplicate values/],
  ['no transition', value => { value.milestones = ['only']; }, /at least initial and final/],
  ['absolute path', value => { value.bounds.allowedPaths = ['/etc']; }, /stay within/],
  ['escaping path', value => { value.bounds.allowedPaths = ['../other']; }, /stay within/],
  ['no allowed paths', value => { value.bounds.allowedPaths = []; }, /allowedPaths: required/],
  ['no tools', value => { value.environment.tools = []; }, /tools: required/],
  ['public private-target records', value => { value.scope.visibility = 'private'; }, /private scope/],
  ['unknown visibility', value => { value.records.visibility = 'mixed'; }, /public or private/],
  ['unknown mode', value => { value.controls.mode = 'automatic'; }, /inspect, sample or full/],
  ['unknown stop', value => { value.controls.stopAfter = 'deploy'; }, /unknown lifecycle stage/],
  ['unknown milestone stop', value => { value.controls.stopMilestone = 'absent'; }, /unknown milestone/],
  ['inspect rollout', value => { value.controls.stopAfter = 'rollout'; }, /inspect mode cannot/],
  ['sample completion', value => { value.controls.mode = 'sample'; value.controls.stopAfter = 'completion'; }, /sample mode cannot/],
  ['empty sample', value => { value.controls.sample.size = 0; }, /size: expected integer/],
  ['zero discovery bound', value => { value.controls.sample.discoveryLimit = 0; }, /discoveryLimit: expected nullableInteger/],
];

for (const [name, mutate, expected] of invalidSettings) {
  test(`settings reject ${name}`, () => {
    const value = settings();
    mutate(value);
    assert.match(validateSettings(value).join('\n'), expected);
  });
}

test('valid modes, stops and milestone bounds are supported', () => {
  for (const mode of ['inspect', 'sample', 'full']) {
    const value = settings();
    value.controls.mode = mode;
    value.controls.stopAfter = mode === 'full' ? 'completion' : 'sample';
    value.controls.stopMilestone = 'final';
    value.controls.sample.discoveryLimit = mode === 'full' ? null : 10;
    value.limits.maxTransientRetries = 0;
    assert.deepEqual(validateSettings(value), []);
  }
});

test('CLI returns nonzero and explicit diagnostics for an invalid definition', t => {
  const directory = bundle(t);
  writeFileSync(resolve(directory, 'operation.json'), 'null');
  const result = spawnSync(process.execPath, [resolve(base, 'scripts/verify.mjs'), directory], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /expected object/);
});

test('CLI rejects unknown options and missing base values', () => {
  for (const args of [[base, '--unknown'], [base, '--base'], []]) {
    const result = spawnSync(process.execPath, [resolve(base, 'scripts/verify.mjs'), ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});

test('all maintained Markdown links resolve within this repository', () => {
  const errors = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (['.git', 'node_modules'].includes(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && path.endsWith('.md')) {
        const text = readFileSync(path, 'utf8');
        for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
          const link = match[1];
          if (/^(https?:|mailto:|#)/.test(link)) continue;
          const target = resolve(dirname(path), decodeURIComponent(link.split('#')[0]));
          if (packagesMissingInTemplate(target)) continue;
          if (!existsSync(target)) errors.push(`${path}: ${link}`);
        }
      }
    }
  }
  function packagesMissingInTemplate(path) {
    return ['explore', 'act'].some(name =>
      path === resolve(base, '.github/skills', name, 'SKILL.md'));
  }
  walk(root);
  assert.deepEqual(errors, []);
});
