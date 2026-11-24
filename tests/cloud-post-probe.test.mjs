import assert from 'node:assert/strict';
import test from 'node:test';
import {verifyForm} from '../scripts/cloud-post-probe.mjs';

const synthetic = 'CodexPostProbe2026';
const env = {CLOUD_POST_PROBE: 'synthetic-placeholder'};
const substituted = {apiKey: [synthetic], userHash: [synthetic], control: ['probe+form=a&b']};

test('Cloud probe sends the placeholder in URL-encoded fields and requires exact substitution', async () => {
  assert.equal(await verifyForm(env, async (url, init) => {
    assert.equal(url, 'https://httpbingo.org/post');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.equal(init.body.toString(), 'apiKey=synthetic-placeholder&userHash=synthetic-placeholder&control=probe%2Bform%3Da%26b');
    return Response.json({form: substituted});
  }), 'pass');
  assert.equal(await verifyForm(env, async () =>
    Response.json({form: {...substituted, userHash: [env.CLOUD_POST_PROBE]}})), 'form_mismatch');
});

test('Cloud probe rejects raw test inputs and Brickset bindings before transport', async () => {
  assert.equal(await verifyForm({CLOUD_POST_PROBE: synthetic}, assert.fail), 'binding_missing_or_unsafe');
  assert.equal(await verifyForm({...env, BRICKSET_API_KEY: env.CLOUD_POST_PROBE}, assert.fail),
    'binding_missing_or_unsafe');
});
