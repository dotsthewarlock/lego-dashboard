import {readFileSync} from 'node:fs';
import * as http from 'node:http';
import {pathToFileURL} from 'node:url';
import {EXPANDED_REQUEST_LIMIT} from '../dist/compatibility.js';
import {DiagnosticError} from '../dist/domain.js';
import {BricksetProvider} from '../dist/provider.js';

const errorCodes = new Set(['quota', 'unauthorized', 'timeout', 'upstream', 'invalid', 'unconfigured']);

const errorCode = error =>
  error instanceof DiagnosticError && errorCodes.has(error.code) ? error.code : 'upstream';

const count = (records, predicate) => records.filter(predicate).length;

function collectionCounts(records, state, quantity) {
  return {
    distinct: count(records, record => record[state] === true),
    unknownState: count(records, record => record[state] === null),
    knownQuantityTotal: records.reduce((total, record) => total + BigInt(record[quantity] ?? 0), 0n).toString(),
    unknownQuantity: count(records, record => record[quantity] === null),
  };
}

export async function diagnose(config, transport) {
  let calls = 0;
  try {
    const provider = new BricksetProvider(config, (url, options) => {
      calls++;
      return transport(url, options);
    });
    const snapshot = await provider.snapshot();
    return {
      mode: 'live',
      status: 'success',
      calls,
      catalogue: {
        sampled: snapshot.sets.length,
        matches: snapshot.matches,
        missingCadMsrp: count(snapshot.sets, set => set.CAD.msrp === null),
        missingUsdMsrp: count(snapshot.sets, set => set.USD.msrp === null),
        missingUpc: count(snapshot.sets, set => set.UPC === null),
        missingEan: count(snapshot.sets, set => set.EAN === null),
        exactVariantFound: snapshot.probes[0]?.consistent ?? null,
      },
      collection: {
        records: snapshot.personal.length,
        joined: count(snapshot.sets, set => set.personal !== null),
        owned: collectionCounts(snapshot.personal, 'owned', 'qtyOwned'),
        wanted: collectionCounts(snapshot.personal, 'wanted', 'qtyWanted'),
        labelsReturned: snapshot.flagLabels.length,
      },
    };
  } catch (error) {
    return {mode: 'live', status: 'error', calls, code: errorCode(error)};
  }
}

function expandedFailure(code, calls = 0) {
  return {mode: 'live', profile: 'expanded', status: 'error', calls, requestLimit: EXPANDED_REQUEST_LIMIT, code};
}

export async function diagnoseExpanded(config, transport) {
  let calls = 0;
  try {
    const provider = new BricksetProvider(config, (url, options) => {
      calls++;
      return transport(url, options);
    });
    const summary = await provider.expandedDiagnostic();
    return {
      mode: 'live', profile: 'expanded', status: 'success', calls,
      requestLimit: EXPANDED_REQUEST_LIMIT, ...summary,
    };
  } catch (error) {
    return expandedFailure(errorCode(error), calls);
  }
}

async function runOwner(args) {
  if (args.length !== 1 || !/^\d+$/.test(args[0]) || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    return expandedFailure('unconfigured');
  }
  const remainingCalls = Number(args[0]);
  if (!Number.isSafeInteger(remainingCalls) || remainingCalls < EXPANDED_REQUEST_LIMIT) {
    return expandedFailure('unconfigured');
  }

  let lines;
  try {
    lines = readFileSync(0, 'utf8').split('\n');
  } catch {
    return expandedFailure('unconfigured');
  }
  const [apiKey, userHash, end] = lines;
  if (lines.length !== 3 || end !== '' || !apiKey.trim() || !userHash.trim()) {
    return expandedFailure('unconfigured');
  }
  return diagnoseExpanded({
    apiKey, userHash, permissionConfirmed: true, remainingCalls, year: new Date().getUTCFullYear(),
  }, fetch);
}

export function useHttpsProxy(env) {
  const proxy = new URL(env.https_proxy || env.HTTPS_PROXY);
  if (!['http:', 'https:'].includes(proxy.protocol) || env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error('secure_proxy_unavailable');
  }
  // Force the managed HTTPS proxy even if NO_PROXY has broader exclusions.
  return http.setGlobalProxyFromEnv({HTTPS_PROXY: proxy.href, NO_PROXY: 'localhost'});
}

export async function run(env = process.env) {
  const unavailable = code => ({mode: 'live', status: 'error', calls: 0, code});
  if (env.BRICKSET_NETWORK_SECRETS_CONFIRMED !== 'yes' ||
      env.BRICKSET_PERMISSION_CONFIRMED !== 'yes' ||
      !env.BRICKSET_API_KEY || !env.BRICKSET_USER_HASH) {
    return unavailable('unconfigured');
  }

  let restoreProxy;
  try {
    restoreProxy = useHttpsProxy(env);
  } catch {
    return unavailable('secure_proxy_unavailable');
  }

  try {
    return await diagnose({
      apiKey: env.BRICKSET_API_KEY,
      userHash: env.BRICKSET_USER_HASH,
      permissionConfirmed: true,
      remainingCalls: Number(env.BRICKSET_REMAINING_CALLS),
      year: Number(env.BRICKSET_SAMPLE_YEAR ?? 2025),
    }, fetch);
  } finally {
    restoreProxy();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [mode, ...args] = process.argv.slice(2);
  const result = mode === '--owner-stdin' ? await runOwner(args) : await run();
  process.stdout.write(JSON.stringify(result) + '\n');
  process.exitCode = result.status === 'success' ? 0 : 1;
}
