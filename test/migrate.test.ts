import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error -- plain ESM script, no declarations
import { migrate, selectMigrations } from '../bin/lib.mjs';

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
