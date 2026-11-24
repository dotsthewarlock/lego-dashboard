import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {once} from 'node:events';
import * as http from 'node:http';
import test from 'node:test';
import {promisify} from 'node:util';
import {envelope, mockCollection, mockLabels, mockPages, mockSets, mockUsage} from '../dist/fixtures.js';
import {diagnose, run} from '../scripts/brickset-diagnostic.mjs';

const config = {
  apiKey: 'synthetic-key', userHash: 'synthetic-hash', permissionConfirmed: true,
  remainingCalls: 9, year: 2025,
};
const liveEnv = {
  BRICKSET_API_KEY: config.apiKey,
  BRICKSET_USER_HASH: config.userHash,
  BRICKSET_NETWORK_SECRETS_CONFIRMED: 'yes',
  BRICKSET_PERMISSION_CONFIRMED: 'yes',
  BRICKSET_REMAINING_CALLS: '9',
};
const runFile = promisify(execFile);
const script = ['scripts/brickset-diagnostic.mjs'];
const ok = {status: 'success'};

test('headless runner uses only the fixed POST contract and emits aggregates', async () => {
  const sample = envelope('sets', mockPages.flatMap(page => page.sets));
  const calls = [];
  const report = await diagnose(config, async (url, options) => {
    const method = new URL(url).pathname.split('/').pop();
    assert.equal(url, 'https://brickset.com/api/v3.asmx/' + method);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.body.get('apiKey'), config.apiKey);
    calls.push(method);
    const params = JSON.parse(options.body.get('params') ?? 'null');
    switch (method) {
      case 'checkKey': return Response.json(ok);
      case 'checkUserHash':
        assert.equal(options.body.get('userHash'), config.userHash);
        return Response.json(ok);
      case 'getKeyUsageStats': return Response.json(mockUsage);
      case 'getCollection': return Response.json(mockCollection);
      case 'getUserFlagLabels': return Response.json(mockLabels);
      case 'getSets':
        assert.equal(options.body.get('userHash'), '');
        return Response.json(params.setNumber ? envelope('sets', [mockSets[0]]) : sample);
      default: assert.fail('Unexpected provider method');
    }
  });
  assert.deepEqual(calls, ['checkKey', 'checkUserHash', 'getKeyUsageStats', 'getCollection',
    'getUserFlagLabels', 'getSets', 'getSets', 'getKeyUsageStats']);
  assert.deepEqual(report, {
    mode: 'live', status: 'success', calls: 8,
    catalogue: {sampled: 6, matches: 6, missingCadMsrp: 4, missingUsdMsrp: 4,
      missingUpc: 5, missingEan: 6, exactVariantFound: true},
    collection: {records: 4, joined: 3,
      owned: {distinct: 2, unknownState: 1, knownQuantityTotal: '4', unknownQuantity: 0},
      wanted: {distinct: 2, unknownState: 2, knownQuantityTotal: '2', unknownQuantity: 1},
      labelsReturned: 1},
  });
});

test('headless runner reports sanitized errors and stops after the failed request', async () => {
  const report = await diagnose(config, async () => {
    throw new Error('sensitive transport detail');
  });
  assert.deepEqual(report, {mode: 'live', status: 'error', calls: 1, code: 'upstream'});
});

test('headless runner requires explicit permission, verified bindings, budget and a secure proxy', async () => {
  const denied = {mode: 'live', status: 'error', calls: 0, code: 'unconfigured'};
  assert.deepEqual(await run({...liveEnv, BRICKSET_PERMISSION_CONFIRMED: 'no'}), denied);
  assert.deepEqual(await run({...liveEnv, BRICKSET_NETWORK_SECRETS_CONFIRMED: 'no'}), denied);
  assert.deepEqual(await diagnose({...config, remainingCalls: 8}, assert.fail), denied);
  assert.deepEqual(await run({...liveEnv, HTTPS_PROXY: 'http://127.0.0.1:1', NODE_TLS_REJECT_UNAUTHORIZED: '0'}),
    {...denied, code: 'secure_proxy_unavailable'});
  assert.deepEqual(await run(liveEnv), {...denied, code: 'secure_proxy_unavailable'});
});

test('CLI fails closed and outputs one JSON record on stdout with no stderr', async () => {
  await assert.rejects(runFile(process.execPath, script, {env: {}}), error => {
    assert.equal(error.code, 1);
    assert.equal(error.stderr, '');
    assert.equal(error.stdout, '{"mode":"live","status":"error","calls":0,"code":"unconfigured"}\n');
    return true;
  });
});

test('CLI sends HTTPS through the supplied proxy and does not retry or fall back to a direct request', {
  skip: typeof http.setGlobalProxyFromEnv !== 'function' && 'Requires Node 24.14+',
}, async t => {
  const destinations = [];
  const proxy = http.createServer();
  proxy.on('connect', (request, socket) => {
    destinations.push(request.url);
    socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
  });
  proxy.listen(0, '127.0.0.1');
  await once(proxy, 'listening');
  t.after(() => proxy.close());
  const env = {...liveEnv, HTTPS_PROXY: 'http://127.0.0.1:' + proxy.address().port, NO_PROXY: 'brickset.com'};
  await assert.rejects(runFile(process.execPath, script, {env, timeout: 5000}), error => {
    assert.equal(error.code, 1);
    assert.equal(error.stderr, '');
    assert.equal(error.stdout, '{"mode":"live","status":"error","calls":1,"code":"upstream"}\n');
    return true;
  });
  assert.deepEqual(destinations, ['brickset.com:443']);
});
