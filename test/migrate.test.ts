import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error -- plain ESM script, no declarations
import { bumpDependency, migrate, selectMigrations } from '../bin/lib.mjs';

const names = ['2.0.0-remove-glow-field.mjs', '3.0.0-focus-ring-token.mjs'];

describe('selectMigrations', () => {
  it('takes migrations after from and up to to', () => {
    expect(selectMigrations(names, '2.0.1', '3.0.0').map((m: { version: string }) => m.version)).toEqual(['3.0.0']);
  });

  it('takes the whole span when a consumer is two majors behind', () => {
    expect(selectMigrations(names, '1.5.0', '3.0.0')).toHaveLength(2);
  });

  it('takes none when the consumer is current', () => {
    expect(selectMigrations(names, '3.0.0', '3.0.0')).toEqual([]);
  });
});

describe('bumpDependency', () => {
  const write = async (deps: string) => {
    const dir = await mkdtemp(join(tmpdir(), 'orc-bump-'));
    await writeFile(join(dir, 'package.json'), deps);
    return dir;
  };

  it('moves the version and keeps the range style', async () => {
    const dir = await write('{"dependencies":{"@orc-tools/orc-design-system":"^4.0.2"}}');

    expect(await bumpDependency(dir, '5.0.0')).toBe('^5.0.0');
    expect(JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')).dependencies).toEqual({
      '@orc-tools/orc-design-system': '^5.0.0',
    });
  });

  it('finds the dependency in devDependencies too', async () => {
    const dir = await write('{"devDependencies":{"@orc-tools/orc-design-system":"4.0.2"}}');

    expect(await bumpDependency(dir, '5.0.0')).toBe('5.0.0');
  });

  it('returns null when the project does not depend on the package', async () => {
    const dir = await write('{"dependencies":{"vite":"^7.0.0"}}');

    expect(await bumpDependency(dir, '5.0.0')).toBeNull();
  });
});

describe('migrate', () => {
  it('renames the removed element and reports what needs a decision', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'orc-migrate-'));
    const file = join(dir, 'composer.html');
    await writeFile(file, '<orc-glow-field suppress-focus-ring aria-label="Ask"></orc-glow-field>');

    const [result] = await migrate({ dir, from: '1.5.0', to: '2.0.0', dryRun: false });

    expect(await readFile(file, 'utf8')).toBe('<orc-textarea aria-label="Ask"></orc-textarea>');
    expect(result.notes).toHaveLength(1);
  });

  it('writes nothing on a dry run', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'orc-migrate-'));
    const file = join(dir, 'composer.html');
    await writeFile(file, '<orc-glow-field></orc-glow-field>');

    const [result] = await migrate({ dir, from: '1.5.0', to: '2.0.0', dryRun: true });

    expect(result.changes).toHaveLength(1);
    expect(await readFile(file, 'utf8')).toBe('<orc-glow-field></orc-glow-field>');
  });
});
