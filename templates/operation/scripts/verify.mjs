import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const stages = ['readiness', 'exploration', 'sample', 'rollout', 'completion'];
export const headings = [
  'Purpose', 'Inputs', 'Procedure', 'Outputs', 'Verification',
  'Exceptions', 'Safety', 'Compatibility',
];
const shared = [
  'README.md', 'AGENTS.md', 'RUNBOOK.md', 'RECORDS.md', 'SKILLS.md', '.tool-versions',
  '.github/agents/supervisor.agent.md', '.github/agents/reviewer.agent.md',
  '.github/skills/review-change/SKILL.md', 'scripts/verify.mjs',
];
const containers = ['.devcontainer/devenv.yaml', '.devcontainer/shared/devcontainer.json'];
const packages = ['.github/skills/explore/', '.github/skills/act/'];
const schema = {
  id: 'text', intent: 'text', operator: 'text', delegates: ['text'],
  provenance: {
    factoryRepository: 'text', factoryRevision: 'text', factoryDiffSha256: 'text',
    createdAt: 'text', instanceId: 'text',
  },
  scope: { owners: ['text'], repositories: ['text'], exclude: ['text'], visibility: 'text' },
  goal: 'text', milestones: ['text'],
  bounds: { allowedPaths: ['text'], forbiddenChanges: ['text'] },
  limits: {
    aiCredits: 'positive', reserveCredits: 'nonnegative', maxMinutes: 'positive',
    maxActions: 'integer', maxAttempts: 'integer', maxTransientRetries: 'zeroInteger',
    retryBackoffSeconds: 'positive', maxBackoffSeconds: 'positive',
  },
  controls: {
    mode: 'text', stopAfter: 'text', stopMilestone: 'nullableText',
    sample: { discoveryLimit: 'nullableInteger', size: 'integer', seed: 'text', strata: ['text'] },
  },
  environment: {
    tools: ['text'], isolation: 'text', claims: 'text', usage: 'text',
    publication: 'text', modelDataPolicy: 'text',
  },
  records: { visibility: 'text', artifactLocation: 'text', retentionDays: 'integer' },
};

function identityErrors(settings) {
  const errors = [];
  if (typeof settings?.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,72}$/.test(settings.id)) {
    errors.push('id: use a lowercase slug of at most 73 characters');
  }
  const { createdAt, instanceId } = settings?.provenance ?? {};
  if (typeof createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(createdAt) ||
      !Number.isFinite(Date.parse(createdAt)) ||
      new Date(createdAt).toISOString().replace('.000Z', 'Z') !== createdAt) {
    errors.push('provenance.createdAt: use a valid UTC timestamp YYYY-MM-DDTHH:mm:ssZ');
  }
  if (typeof instanceId !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(instanceId)) {
    errors.push('provenance.instanceId: use a lowercase UUID v4');
  }
  return errors;
}

export function operationRepositoryName(settings) {
  const errors = identityErrors(settings);
  if (errors.length) throw new TypeError(errors.join('; '));
  return `operation-${settings.provenance.createdAt.replace(/[-:]/g, '')}-${settings.id}`;
}

function checkShape(value, spec, path, errors) {
  if (Array.isArray(spec)) {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array`);
      return;
    }
    value.forEach((item, index) => checkShape(item, spec[0], `${path}[${index}]`, errors));
    if (new Set(value).size !== value.length) errors.push(`${path}: duplicate values`);
  } else if (typeof spec === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${path}: expected object`);
      return;
    }
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(spec, key)) errors.push(`${path}.${key}: unexpected setting`);
    }
    for (const [key, child] of Object.entries(spec)) {
      checkShape(value[key], child, `${path}.${key}`, errors);
    }
  } else {
    const text = typeof value === 'string' && value.trim().length > 0;
    const number = typeof value === 'number' && Number.isFinite(value);
    const valid = {
      text, nullableText: value === null || text,
      positive: number && value > 0,
      nonnegative: number && value >= 0,
      integer: Number.isSafeInteger(value) && value > 0,
      nullableInteger: value === null || (Number.isSafeInteger(value) && value > 0),
      zeroInteger: Number.isSafeInteger(value) && value >= 0,
    };
    if (!valid[spec]) errors.push(`${path}: expected ${spec}`);
  }
}

export function validateSettings(settings) {
  const errors = [];
  checkShape(settings, schema, 'operation', errors);
  if (errors.length) return errors;
  const { scope, limits, controls, records, milestones } = settings;
  errors.push(...identityErrors(settings));
  if (!['public', 'private'].includes(scope.visibility)) errors.push('scope.visibility: public or private');
  if (!['public', 'private'].includes(records.visibility)) errors.push('records.visibility: public or private');
  if (scope.visibility === 'private' && records.visibility !== 'private') {
    errors.push('records.visibility: private scope requires private records');
  }
  if (!scope.owners.length && !scope.repositories.length) errors.push('scope: specify owners or repositories');
  const ownerPattern = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
  const repoPattern = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/;
  if (!repoPattern.test(settings.provenance.factoryRepository)) {
    errors.push('provenance.factoryRepository: expected owner/repository');
  }
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(settings.provenance.factoryRevision)) {
    errors.push('provenance.factoryRevision: expected exact Git revision');
  }
  if (!/^[a-f0-9]{64}$/.test(settings.provenance.factoryDiffSha256)) {
    errors.push('provenance.factoryDiffSha256: expected SHA-256 of git diff --binary HEAD');
  }
  if (scope.owners.some(owner => !ownerPattern.test(owner))) errors.push('scope.owners: invalid owner');
  if ([...scope.repositories, ...scope.exclude].some(repo => !repoPattern.test(repo))) {
    errors.push('scope repositories/exclude: expected owner/repository');
  }
  if (milestones.length < 2) errors.push('milestones: need at least initial and final');
  if (!settings.bounds.allowedPaths.length) errors.push('bounds.allowedPaths: required');
  if (settings.bounds.allowedPaths.some(path =>
    isAbsolute(path) || path.split(/[\\/]/).includes('..'))) {
    errors.push('bounds.allowedPaths: paths must stay within the target');
  }
  if (!settings.environment.tools.length) errors.push('environment.tools: required');
  if (limits.reserveCredits >= limits.aiCredits) errors.push('reserveCredits: must be below aiCredits');
  if (limits.maxBackoffSeconds < limits.retryBackoffSeconds) errors.push('maxBackoffSeconds: below initial backoff');
  if (!['inspect', 'sample', 'full'].includes(controls.mode)) errors.push('controls.mode: inspect, sample or full');
  if (!stages.includes(controls.stopAfter)) errors.push('controls.stopAfter: unknown lifecycle stage');
  if (controls.stopMilestone !== null && !milestones.includes(controls.stopMilestone)) {
    errors.push('controls.stopMilestone: unknown milestone');
  }
  if (controls.mode === 'inspect' && stages.indexOf(controls.stopAfter) > 2) {
    errors.push('controls: inspect mode cannot request rollout or completion');
  }
  if (controls.mode === 'sample' && stages.indexOf(controls.stopAfter) > 2) {
    errors.push('controls: sample mode cannot request rollout or completion');
  }
  return errors;
}

function inside(root, target) {
  const path = relative(root, target);
  return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function inventory(root, errors) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      const name = relative(root, path).split(sep).join('/');
      if (name === '.git') continue;
      if (entry.isSymbolicLink()) {
        errors.push(`${name}: symbolic links are not allowed`);
      } else if (name === 'records' && entry.isDirectory()) {
        continue;
      } else if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile()) {
        files.push(name);
      } else {
        errors.push(`${name}: unsupported file type`);
      }
    }
  }
  walk(root);
  return files.sort();
}

function checkLinks(root, file, text, files, template, errors) {
  const packageRoot = packages.find(prefix => file.startsWith(prefix));
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const link = match[1];
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    let local;
    try {
      local = decodeURIComponent(link.split('#')[0]);
    } catch {
      errors.push(`${file}: malformed link ${link}`);
      continue;
    }
    const target = resolve(root, dirname(file), local);
    const name = relative(root, target).split(sep).join('/');
    if (!inside(root, target) || isAbsolute(local) ||
        (packageRoot && !inside(resolve(root, packageRoot), target))) {
      errors.push(`${file}: escaping link ${link}`);
    } else if (!files.includes(name) &&
        !(template && packages.some(prefix => name === `${prefix}SKILL.md`))) {
      errors.push(`${file}: missing link ${link}`);
    }
  }
}

export function verify(rootPath, { template = false, base } = {}) {
  const root = resolve(rootPath);
  const errors = [];
  if (lstatSync(root).isSymbolicLink() || realpathSync(root) !== root) {
    return { ok: false, errors: ['root: use a real directory without symbolic links'] };
  }
  const files = inventory(root, errors);
  const required = [...shared, 'operation.json', ...(template ? [] : containers)];
  if (!template) required.push(...packages.map(prefix => `${prefix}SKILL.md`));
  for (const name of required) {
    if (!files.includes(name)) errors.push(`${name}: missing required file`);
  }
  const digest = createHash('sha256');
  for (const file of files) {
    const packageRoot = packages.find(prefix => file.startsWith(prefix));
    if (!required.includes(file) && !containers.includes(file) && !packageRoot) {
      errors.push(`${file}: unexpected definition file`);
    }
    if (packageRoot) {
      if (template) errors.push(`${file}: domain skills are supplied only at definition time`);
      const parts = file.slice(packageRoot.length).split('/');
      if (parts.some(part => (part.startsWith('.') && part !== '.tool-versions') ||
          ['AGENTS.md', 'CLAUDE.md', 'mcp.json'].includes(part))) {
        errors.push(`${file}: auto-loaded or hidden skill configuration is not allowed`);
      }
    }
    const data = readFileSync(resolve(root, file));
    digest.update(`${file}\0${data.length}\0`).update(data);
    if (data.length === 0) errors.push(`${file}: empty file`);
    const text = data.toString('utf8');
    if (packageRoot && file.endsWith('.tool-versions')) {
      for (const line of text.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#'))) {
        const [, version] = line.trim().split(/\s+/);
        if (!/^\S+\s+\S+$/.test(line.trim()) ||
            /^(?:latest|lts(?:-.*)?|system|stable|nightly|canary|\d+(?:\.\d+)?)$/.test(version) ||
            /[~^*><]|\bx\b/.test(version)) {
          errors.push(`${file}: expected tool and exact version pin`);
        }
      }
    }
    if (!template && /\{\{[^}]+\}\}/.test(text)) errors.push(`${file}: unresolved placeholder`);
    if (file.endsWith('.md')) checkLinks(root, file, text, files, template, errors);
    if (packageRoot && file === `${packageRoot}SKILL.md`) {
      const name = packageRoot.split('/').at(-2);
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
      if (!frontmatter) {
        errors.push(`${file}: missing frontmatter`);
      } else {
        const fields = frontmatter[1].split(/\r?\n/);
        if (!fields.includes(`name: ${name}`)) errors.push(`${file}: expected name: ${name}`);
        if (!fields.some(line => /^description: \S.+/.test(line))) errors.push(`${file}: missing description`);
        if (fields.length !== 2 || fields.some(line => !/^(name|description): .+/.test(line))) {
          errors.push(`${file}: only single-line name and description frontmatter are supported`);
        }
      }
      for (const heading of headings) {
        const section = new RegExp(`^## ${heading}\\r?\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm').exec(text);
        if (!section) errors.push(`${file}: missing heading ${heading}`);
        else if (!section[1].trim()) errors.push(`${file}: empty section ${heading}`);
      }
    }
  }
  let repositoryName;
  if (files.includes('operation.json')) {
    let settings;
    try {
      settings = JSON.parse(readFileSync(resolve(root, 'operation.json'), 'utf8'));
    } catch (error) {
      errors.push(`operation.json: ${error.message}`);
    }
    if (settings !== undefined && !template) {
      const settingsErrors = validateSettings(settings);
      errors.push(...settingsErrors);
      if (!settingsErrors.length) repositoryName = operationRepositoryName(settings);
    }
  }
  if (base) {
    const baseRoot = resolve(base);
    const factoryRoot = resolve(baseRoot, '../..');
    for (const file of [...shared, ...containers]) {
      const source = resolve(containers.includes(file) ? factoryRoot : baseRoot, file);
      if (!files.includes(file)) continue;
      if (!readFileSync(source).equals(readFileSync(resolve(root, file)))) {
        errors.push(`${file}: differs from shared base`);
      }
    }
  }
  return {
    ok: errors.length === 0, kind: template ? 'template' : 'definition',
    digest: `sha256:${digest.digest('hex')}`, files, errors,
    ...(repositoryName ? { repositoryName } : {}),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  if (!args[0] || args[0].startsWith('--') ||
      args.some((arg, index) => index > 0 && arg !== '--template' && arg !== '--base' && index !== baseIndex + 1) ||
      (baseIndex !== -1 && (!args[baseIndex + 1] || args[baseIndex + 1].startsWith('--')))) {
    console.error('Usage: node verify.mjs DIRECTORY [--template] [--base FACTORY_TEMPLATE]');
    process.exitCode = 1;
  } else {
    try {
      const result = verify(args[0], {
        template: args.includes('--template'), base: baseIndex === -1 ? undefined : args[baseIndex + 1],
      });
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.ok ? 0 : 1;
    } catch (error) {
      console.error(`Verification failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
