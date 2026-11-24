import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {envelope} from '../dist/fixtures.js';
import {diagnoseExpanded} from '../scripts/brickset-diagnostic.mjs';

const config = {
  apiKey: 'SYNTHETIC_KEY_DO_NOT_PRINT',
  userHash: 'SYNTHETIC_HASH_DO_NOT_PRINT',
  permissionConfirmed: true,
  remainingCalls: 16,
  year: 2026,
};

const set = (setID, number, numberVariant, extra = {}) => ({
  setID, number, numberVariant, name: 'Synthetic catalogue name',
  year: 1999, theme: 'Synthetic catalogue theme', subtheme: 'Synthetic catalogue subtheme',
  ...extra,
});
const older = set(101, '99001', 1, {
  released: true, exitDate: '2000-02-29', category: 'Normal',
  LEGOCom: {CA: {retailPrice: 0}, US: {retailPrice: 15}},
  barcode: {UPC: '036000291452', EAN: '4006381333931'},
});
const variant = set(102, '99001', 2, {
  name: 'Synthetic variant name', released: true, category: 'Extended',
  LEGOCom: {US: {retailPrice: 0}}, barcode: {UPC: '036000291453', EAN: '4006381333932'},
});
const city = set(103, '99003', 1, {
  year: 2026, theme: 'City', released: true, category: 'Normal',
  LEGOCom: {CA: {retailPrice: 20}}, barcode: {UPC: 36000291452, EAN: '96385074'},
});
const technic = set(104, '99004', 1, {
  year: 2026, theme: 'Technic', category: 'Normal', barcode: {EAN: '9638-5074'},
});
const figure = set(105, '99005', 1, {
  year: 2026, theme: 'Collectable Minifigures', category: 'Random',
  barcode: {UPC: '036000291452\n', EAN: '00000000'},
});
const gear = set(106, '99006', 1, {year: 2026, theme: 'Gear', category: 'Gear'});
const upcoming = set(107, '99007', 1, {year: 2027, released: false, launchDate: '2099-01-01T00:00:00'});
const unrelated = set(108, '99008', 1, {
  name: 'Synthetic unrelated row', theme: 'Synthetic different theme',
});
const sameThemeOtherSubtheme = set(109, '99009', 1, {subtheme: 'Synthetic other subtheme'});

const collection = envelope('sets', [
  {setID: 101, owned: true, wanted: true, qtyOwned: 5, qtyOwnedNew: 2, qtyOwnedUsed: 3,
    qtyOwnedLoose: 1, wantedPriority: 9876, notes: 'SYNTHETIC_NOTE_DO_NOT_PRINT',
    flags: [{flagNo: 1, value: true}, {flagNo: 2, value: false}]},
  {setID: 102, owned: false, wanted: true, qtyOwned: 0, qtyWanted: 1, wantedPriority: 0, flags: []},
  {setID: 999, owned: true, wanted: false, qtyWanted: 0, qtyOwnedNew: 0},
  {setID: 998, wanted: true, qtyOwned: 1, qtyWanted: 0},
]);
const labels = envelope('flags', [{flagNo: 1, label: 'SYNTHETIC_LABEL_DO_NOT_PRINT'}, {flagNo: 2, label: ' '}]);
const usage = (used, dateStamp = '2031-03-05', dailyLimit = 75) => envelope('apiKeyUsage', [
  {dateStamp, count: used, dailyLimit},
  {dateStamp: '2031-03-01', count: 12, dailyLimit: 99},
]);

function sample(params) {
  if (params.setNumber) return envelope('sets', [older, variant]);
  if (params.query) return envelope('sets', [older, unrelated]);
  if (params.subtheme) return envelope('sets', [older, sameThemeOtherSubtheme]);
  if (!params.year) return envelope('sets', [older, sameThemeOtherSubtheme]);
  if (params.year === '1999') return envelope('sets', [older, variant]);
  if (params.year === '2027') return envelope('sets', [upcoming]);
  return envelope('sets', [{City: city, Technic: technic, 'Collectable Minifigures': figure, Gear: gear}[params.theme]]);
}

function fake(overrides = {}) {
  let usageCalls = 0;
  const calls = [];
  const transport = async (url, options) => {
    const method = new URL(url).pathname.split('/').at(-1);
    const form = Object.fromEntries(options.body);
    const params = JSON.parse(form.params ?? 'null');
    calls.push({method, url, options, form, params});
    const result = {
      checkKey: () => ({status: 'success'}),
      checkUserHash: () => ({status: 'success'}),
      getKeyUsageStats: () => usage(usageCalls++ ? 35 : 20),
      getCollection: () => collection,
      getUserFlagLabels: () => labels,
      getSets: sample,
      ...overrides,
    }[method](params, calls);
    return result instanceof Response ? result : Response.json(result);
  };
  return {calls, transport};
}

test('expanded diagnostic performs the bounded read plan and only emits public report keys and aggregates', async () => {
  const {calls, transport} = fake();
  const report = await diagnoseExpanded(config, transport);

  assert.equal(report.status, 'success');
  assert.equal(report.profile, 'expanded');
  assert.equal(report.calls, 16);
  assert.equal(report.requestLimit, 16);
  assert.deepEqual(calls.map(call => call.method), [
    'getKeyUsageStats', 'checkKey', 'checkUserHash', 'getCollection', 'getUserFlagLabels',
    ...Array(10).fill('getSets'), 'getKeyUsageStats',
  ]);
  for (const {method, url, options, form} of calls) {
    assert.equal(url, 'https://brickset.com/api/v3.asmx/' + method);
    assert.equal(options.method, 'POST');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(form.apiKey, config.apiKey);
    if (method === 'getSets') assert.equal(form.userHash, '');
    if (['checkUserHash', 'getCollection', 'getUserFlagLabels'].includes(method)) {
      assert.equal(form.userHash, config.userHash);
    }
  }
  assert.deepEqual(calls.slice(5, 11).map(call => call.params), [
    {year: '1999'}, {year: '2026', theme: 'City'}, {year: '2026', theme: 'Technic'},
    {year: '2026', theme: 'Collectable Minifigures'}, {year: '2026', theme: 'Gear'}, {year: '2027'},
  ].map(filters => ({...filters, pageSize: 16, pageNumber: 1, orderBy: 'Number'})));
  assert.deepEqual(calls.slice(11, 15).map(call => call.params), [
    {setNumber: '99001-1'}, {query: older.name, orderBy: 'Rank'},
    {theme: older.theme}, {theme: older.theme, subtheme: older.subtheme},
  ].map(filters => ({...filters, pageSize: 20, pageNumber: 1})));
  assert.deepEqual(report.quota, {
    before: {used: 20, dailyLimit: 75}, after: {used: 35, dailyLimit: 75},
    sameReportedDay: true, usageDelta: 15,
  });
  assert.deepEqual(Object.keys(report).sort(), [
    'calls', 'catalogue', 'collection', 'mode', 'profile', 'queries', 'quota', 'requestLimit', 'status',
  ]);
  const json = JSON.stringify(report);
  for (const sensitive of [
    config.apiKey, config.userHash, 'SYNTHETIC_NOTE', 'SYNTHETIC_LABEL', older.name,
    older.theme, older.subtheme, older.number, older.barcode.UPC, '9876', '2031-03-05',
  ]) assert.ok(!json.includes(sensitive));
});

test('catalogue coverage keeps product and lifecycle observations, MSRP zeros, and GTIN failures separate', async () => {
  const report = await diagnoseExpanded(config, fake().transport);
  const {catalogue} = report;
  assert.equal(catalogue.sampled, 7);
  assert.equal(catalogue.distinctYears, 3);
  assert.equal(catalogue.distinctThemes, 5);
  assert.equal(catalogue.numbersWithMultipleVariants, 1);
  assert.deepEqual(catalogue.productCategories, {
    normal: 3, extended: 1, collection: 0, random: 1, other: 0, gear: 1, book: 0, missing: 1, unrecognized: 0,
  });
  assert.deepEqual(catalogue.lifecycle, {
    released: 3, unreleased: 1, unknownRelease: 3,
    launchDates: {missing: 6, invalid: 0, onOrBeforeObservation: 0, afterObservation: 1},
    exitDates: {missing: 6, invalid: 0, onOrBeforeObservation: 1, afterObservation: 0},
  });
  assert.deepEqual(catalogue.msrp, {
    CAD: {missing: 5, zero: 1, positive: 1}, USD: {missing: 5, zero: 1, positive: 1},
  });
  assert.deepEqual(catalogue.barcodes, {
    UPC: {missing: 3, invalidFormat: 2, allZero: 0, invalidChecksum: 1, valid: 1},
    EAN: {missing: 2, invalidFormat: 1, allZero: 1, invalidChecksum: 1, valid: 2},
  });
});

test('queries distinguish exact field matches, anchor identity, ambiguity, truncation and no match', async () => {
  const {transport} = fake({getSets: params => {
    if (params.setNumber) return envelope('sets', [{...older, setID: 222}, variant]);
    if (params.query) return envelope('sets', [older, {...variant, name: ' SYNTHETIC CATALOGUE NAME '}]);
    if (params.subtheme) return envelope('sets', []);
    if (!params.year) {
      return envelope('sets', Array.from({length: 20}, (_, i) =>
        i === 0 ? older : {...unrelated, setID: 500 + i}), 30);
    }
    return sample(params);
  }});
  const {queries} = await diagnoseExpanded(config, transport);
  assert.deepEqual(queries, {
    setNumber: {matches: 2, returned: 2, exactMatches: 1, exactAnchorFound: false, truncated: false},
    name: {matches: 2, returned: 2, exactMatches: 2, exactAnchorFound: true, truncated: false},
    theme: {matches: 30, returned: 20, exactMatches: 1, exactAnchorFound: true, truncated: true},
    subtheme: {matches: 0, returned: 0, exactMatches: 0, exactAnchorFound: false, truncated: false},
  });
});

test('collection metrics expose nonempty evidence, quantity coverage and discrepancies without personal values', async () => {
  const {collection: report} = await diagnoseExpanded(config, fake().transport);
  assert.equal(report.evidence, 'nonempty');
  assert.equal(report.records, 4);
  assert.equal(report.joinedToSample, 2);
  assert.equal(report.ownedAndWanted, 1);
  assert.deepEqual(report.owned, {
    distinct: 2, falseState: 1, unknownState: 1,
    quantities: {missing: 1, zero: 1, positive: 2, knownTotal: '6'},
    missingQuantityWhenTrue: 1, zeroQuantityWhenTrue: 0, positiveQuantityWhenFalse: 0,
  });
  assert.deepEqual(report.wanted, {
    distinct: 3, falseState: 1, unknownState: 0,
    quantities: {missing: 1, zero: 2, positive: 1, knownTotal: '1'},
    missingQuantityWhenTrue: 1, zeroQuantityWhenTrue: 1, positiveQuantityWhenFalse: 0,
  });
  assert.deepEqual(report.wantedPriority, {missing: 1, zero: 1, positive: 1, distinctKnownCodes: 2});
  assert.deepEqual(report.ownedCondition, {
    new: {missing: 0, zero: 1, positive: 1, knownTotal: '2'},
    used: {missing: 1, zero: 0, positive: 1, knownTotal: '3'},
    loose: {missing: 1, zero: 0, positive: 1, knownTotal: '1'},
    newPlusUsed: {comparable: 1, unequal: 0},
    newPlusLoose: {comparable: 1, unequal: 1},
  });
  assert.deepEqual(report.flags, {
    missingRecords: 2, emptyRecords: 1, populatedRecords: 1,
    trueValues: 1, falseValues: 1, valuesWithNonemptyLabel: 1, labelsReturned: 2, nonemptyLabels: 1,
  });
});

test('empty collection and out-of-scope catalogue rows yield limited evidence and skip probes', async () => {
  const {transport} = fake({
    getCollection: () => envelope('sets', []),
    getUserFlagLabels: () => envelope('flags', []),
    getSets: params => params.year === '1999' ? envelope('sets', [city]) : envelope('sets', []),
  });
  const report = await diagnoseExpanded(config, transport);
  assert.equal(report.status, 'success');
  assert.equal(report.calls, 12);
  assert.equal(report.collection.evidence, 'empty');
  assert.equal(report.catalogue.sampled, 0);
  assert.deepEqual(report.catalogue.slices[0],
    {slice: 'historical', year: 1999, matches: 1, returned: 1, inScope: 0, truncated: false});
  assert.deepEqual(report.queries, {setNumber: null, name: null, theme: null, subtheme: null});
});

test('quota observations allow exact headroom and suppress the delta across provider days', async () => {
  const {transport} = fake({
    getKeyUsageStats: (_, calls) => calls.length === 1 ? usage(60) : usage(3, '2031-03-06', 90),
  });
  const report = await diagnoseExpanded(config, transport);
  assert.equal(report.calls, 16);
  assert.deepEqual(report.quota, {
    before: {used: 60, dailyLimit: 75}, after: {used: 3, dailyLimit: 90},
    sameReportedDay: false, usageDelta: null,
  });
});

test('insufficient attested budget, permission, and provider usage stop before personal reads', async () => {
  for (const override of [{remainingCalls: 15}, {remainingCalls: Infinity}, {permissionConfirmed: false}]) {
    const fixture = fake();
    const report = await diagnoseExpanded({...config, ...override}, fixture.transport);
    assert.equal(report.code, 'unconfigured');
    assert.equal(fixture.calls.length, 0);
  }
  for (const observed of [usage(61), envelope('apiKeyUsage', [])]) {
    const fixture = fake({getKeyUsageStats: () => observed});
    const report = await diagnoseExpanded(config, fixture.transport);
    assert.equal(report.code, 'quota');
    assert.deepEqual(fixture.calls.map(call => call.method), ['getKeyUsageStats']);
  }
});

test('malformed usage, collection and catalogue responses fail closed and disclose only fixed errors', async () => {
  const scenarios = [
    {method: 'getKeyUsageStats', value: usage(10, '2031-02-30'), calls: 1},
    {method: 'getKeyUsageStats', value: usage(10, '2031-03-05', null), calls: 1},
    {method: 'getCollection', value: {status: 'success', matches: 0}, calls: 4},
    {method: 'getSets', value: envelope('sets', [older], 16), calls: 6},
    {method: 'getSets', value: envelope('sets', [older, older]), calls: 6},
  ];
  for (const scenario of scenarios) {
    const fixture = fake({[scenario.method]: () => scenario.value});
    assert.deepEqual(await diagnoseExpanded(config, fixture.transport), {
      mode: 'live', profile: 'expanded', status: 'error', calls: scenario.calls, requestLimit: 16, code: 'invalid',
    });
  }
  const fixture = fake({getSets: () => { throw new Error('SYNTHETIC_PRIVATE_UPSTREAM_BODY'); }});
  assert.deepEqual(await diagnoseExpanded(config, fixture.transport), {
    mode: 'live', profile: 'expanded', status: 'error', calls: 6, requestLimit: 16, code: 'upstream',
  });
});

test('owner CLI fails closed on missing stdin values and insufficient budget', () => {
  for (const [budget, input] of [['16', '\n\n'], ['15', 'synthetic-key\nsynthetic-hash\n']]) {
    const result = spawnSync(process.execPath, ['scripts/brickset-diagnostic.mjs', '--owner-stdin', budget],
      {encoding: 'utf8', input, env: {}});
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    assert.deepEqual(JSON.parse(result.stdout), {
      mode: 'live', profile: 'expanded', status: 'error', calls: 0, requestLimit: 16, code: 'unconfigured',
    });
  }
});
