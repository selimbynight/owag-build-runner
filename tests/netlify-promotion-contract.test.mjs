import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(resolve(here, '../.github/workflows/build-site.yml'), 'utf8');
const smoke = readFileSync(resolve(here, '../.github/workflows/runner-smoke.yml'), 'utf8');

function workflowBetween(start, end) {
  const startAt = workflow.indexOf(start);
  const endAt = workflow.indexOf(end, startAt + start.length);
  assert.notEqual(startAt, -1, `section absente : ${start}`);
  assert.notEqual(endAt, -1, `fin de section absente : ${end}`);
  return workflow.slice(startAt, endAt);
}

const netlify = workflowBetween(
  '- name: Deploy draft puis promotion → Netlify (opt-in)',
  '# La propagation du domaine public',
);

test('Netlify reçoit d’abord un draft immuable, jamais un deploy --prod', () => {
  assert.match(netlify, /npx --yes netlify-cli@27\.0\.1 deploy/);
  assert.match(netlify, /--dir=dist/);
  assert.match(netlify, /--no-build/);
  assert.match(netlify, /--json/);
  assert.match(netlify, /--site="\$NETLIFY_SITE_ID"/);
  assert.doesNotMatch(netlify, /--prod(?:\s|\\|$)/m);
  assert.match(
    netlify,
    /resolve-netlify-deploy\.mjs \\\n+\s+"\$DRAFT_OUTPUT" "\$NETLIFY_SITE_ID" "\$NETLIFY_TECHNICAL_HOST"/,
  );
  assert.match(netlify, /NETLIFY_DEPLOY_ID="\$\(jq -er '\.deploy_id' "\$DRAFT_OUTPUT"\)"/);
});

test('le draft attesté est promu par Restore puis recoupé avec published_deploy', () => {
  const draftAt = netlify.indexOf('resolve-netlify-deploy.mjs');
  const restoreAt = netlify.indexOf('/deploys/$NETLIFY_DEPLOY_ID/restore');
  const siteAt = netlify.indexOf('https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID"');
  const verifyAt = netlify.indexOf('verify-netlify-promotion.mjs');
  const outputAt = netlify.indexOf('url=$NETLIFY_RELEASE_URL');

  assert.ok(draftAt < restoreAt && restoreAt < siteAt && siteAt < verifyAt && verifyAt < outputAt);
  assert.match(netlify, /RESTORE_STATUS="\$\(curl[\s\S]*--fail-with-body/);
  assert.match(netlify, /-X POST/);
  assert.match(netlify, /case "\$RESTORE_STATUS" in\s+200\|201\)/);
  assert.match(netlify, /--output "\$SITE_OUTPUT"/);
  assert.match(
    netlify,
    /verify-netlify-promotion\.mjs \\\n+\s+"\$DRAFT_OUTPUT" "\$RESTORE_OUTPUT" "\$SITE_OUTPUT" \\\n+\s+"\$NETLIFY_SITE_ID" "\$NETLIFY_TECHNICAL_HOST"/,
  );
});

test('la voie reste opt-in et strictement multi-tenant', () => {
  assert.match(netlify, /if: env\.NETLIFY_SITE_ID != ''/);
  assert.match(netlify, /NETLIFY_AUTH_TOKEN: \$\{\{ secrets\.NETLIFY_AUTH_TOKEN \}\}/);
  assert.doesNotMatch(netlify, /175e2662-93d6-4dae-9359-7aac65e079db/);
  assert.doesNotMatch(netlify, /friendly-mousse-d81c73/);
  assert.match(
    workflow,
    /CONFIG="\$\(node scripts\/resolve-netlify-config\.mjs "\$HOST"\)"/,
  );
});

test('la convergence utilise uniquement le permalink de la promotion attestée', () => {
  assert.match(
    workflow,
    /DEPLOY_URL: \$\{\{ steps\.netlify\.outputs\.url \|\| steps\.deploy\.outputs\.url \}\}/,
  );
  assert.match(netlify, /echo "url=\$NETLIFY_RELEASE_URL" >> "\$GITHUB_OUTPUT"/);
});

test('le smoke test exige le helper de vérification fourni par le frontend', () => {
  assert.match(smoke, /test -f scripts\/verify-netlify-promotion\.mjs/);
});
