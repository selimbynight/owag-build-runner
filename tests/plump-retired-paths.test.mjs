import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('aucun workflow ne peut republier l’ancien artefact figé Plump C14', () => {
  assert.equal(
    existsSync(resolve(root, '.github/workflows/deploy-frozen-pages-artifact.yml')),
    false,
  );

  const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
  assert.match(readme, /plumpfluffycubs\.com/u);
  assert.match(readme, /cloudflare:cf01/u);
  assert.match(readme, /projet\s+`plumpfluffycubs-fr`/u);
  assert.match(readme, /artefact figé C14 a\s+été retiré/u);
});
