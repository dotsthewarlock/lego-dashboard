import {catalogue, DiagnosticError, optional, qty, rows, text, type Obj, type Personal, type SetRecord} from './domain.js';

export const SAMPLE_PAGE_SIZE = 16;
const PROBE_PAGE_SIZE = 20;

export function samplePlan(year: number) {
  return [
    {slice: 'historical', year: 1999},
    {slice: 'city', year, theme: 'City'},
    {slice: 'technic', year, theme: 'Technic'},
    {slice: 'collectableMinifigures', year, theme: 'Collectable Minifigures'},
    {slice: 'gear', year, theme: 'Gear'},
    {slice: 'nextYear', year: year + 1},
  ];
}

// Two usage reads, two authentication checks, two personal reads and four search probes.
export const EXPANDED_REQUEST_LIMIT = 6 + samplePlan(2026).length + 4;

export function cataloguePage(response: Obj, pageSize: number) {
  const page = rows(response, 'sets');
  if (page.rows.length !== Math.min(page.matches, pageSize)) throw new DiagnosticError('invalid');

  const sets = page.rows.map(raw => ({raw, set: catalogue(raw, new Map())}));
  if (new Set(sets.map(({set}) => set.setID)).size !== sets.length) throw new DiagnosticError('invalid');
  return {matches: page.matches, sets};
}

type Sample = ReturnType<typeof cataloguePage>['sets'][number];
type GetSets = (params: Obj) => Promise<Obj>;
const equal = (left: string | null, right: string) =>
  left?.trim().toLowerCase() === right.trim().toLowerCase();
const fullNumber = (set: SetRecord) => `${set.number}-${set.variant}`;
const count = <T>(values: T[], test: (value: T) => boolean) =>
  values.reduce((total, value) => total + Number(test(value)), 0);

export async function sampleCatalogue(year: number, getSets: GetSets) {
  const slices = [];
  const unique = new Map<number, Sample>();
  for (const {slice, year: sampleYear, theme} of samplePlan(year)) {
    const page = cataloguePage(await getSets({
      year: String(sampleYear), ...(theme && {theme}),
      pageNumber: 1, pageSize: SAMPLE_PAGE_SIZE, orderBy: 'Number',
    }), SAMPLE_PAGE_SIZE);
    const inScope = page.sets.filter(({set}) =>
      set.year === sampleYear && (theme === undefined || equal(set.theme, theme)));
    for (const sample of inScope) {
      if (!unique.has(sample.set.setID)) unique.set(sample.set.setID, sample);
    }
    slices.push({
      slice, year: sampleYear, matches: page.matches, returned: page.sets.length, inScope: inScope.length,
      truncated: page.matches > page.sets.length,
    });
  }
  return {samples: [...unique.values()], slices};
}

export async function searchProbes(samples: Sample[], getSets: GetSets) {
  const first = samples[0]?.set;
  // Prefer a sampled variant family for the full-number check.
  const variant = samples.find(({set}) => samples.some(other =>
    other.set.number === set.number && other.set.variant !== set.variant))?.set ?? first;
  const themed = samples.find(({set}) => set.theme && !set.theme.includes(','))?.set;
  const grouped = samples.find(({set}) => set.theme && !set.theme.includes(',') &&
    set.subtheme && !set.subtheme.includes(','))?.set;

  async function probe(anchor: SetRecord | undefined, params: Obj, matchesField: (set: SetRecord) => boolean) {
    if (!anchor) return null;
    const page = cataloguePage(await getSets({pageSize: PROBE_PAGE_SIZE, pageNumber: 1, ...params}), PROBE_PAGE_SIZE);
    const matching = page.sets.filter(({set}) => matchesField(set));
    return {
      matches: page.matches,
      returned: page.sets.length,
      exactMatches: matching.length,
      exactAnchorFound: matching.some(({set}) => set.setID === anchor.setID && fullNumber(set) === fullNumber(anchor)),
      truncated: page.matches > page.sets.length,
    };
  }

  return {
    setNumber: await probe(variant, {setNumber: variant && fullNumber(variant)},
      set => variant !== undefined && fullNumber(set) === fullNumber(variant)),
    name: await probe(first, {query: first?.name, orderBy: 'Rank'},
      set => first !== undefined && equal(set.name, first.name)),
    theme: await probe(themed, {theme: themed?.theme},
      set => themed?.theme != null && equal(set.theme, themed.theme)),
    subtheme: await probe(grouped, {theme: grouped?.theme, subtheme: grouped?.subtheme},
      set => grouped?.theme != null && grouped.subtheme != null &&
        equal(set.theme, grouped.theme) && equal(set.subtheme, grouped.subtheme)),
  };
}

function numericPresence(values: (number | null)[]) {
  return {
    missing: count(values, value => value === null),
    zero: count(values, value => value === 0),
    positive: count(values, value => value !== null && value > 0),
  };
}

function barcodes(values: unknown[], lengths: number[]) {
  const result = {missing: 0, invalidFormat: 0, allZero: 0, invalidChecksum: 0, valid: 0};
  for (const value of values) {
    if (value == null || (typeof value === 'string' && !value.trim())) {
      result.missing++;
    } else if (typeof value !== 'string' || !lengths.includes(value.length) || /[^0-9]/.test(value)) {
      result.invalidFormat++;
    } else if (!/[1-9]/.test(value)) {
      result.allZero++;
    } else {
      // GS1 modulo 10. Starting with the check digit, weights alternate 1 and 3.
      const sum = [...value].reverse().reduce((total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
      if (sum % 10 === 0) result.valid++;
      else result.invalidChecksum++;
    }
  }
  return result;
}

function isoDay(value: string | null) {
  if (value === null) return null;
  const day = value.match(/^\d{4}-\d{2}-\d{2}(?=$|T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$)/)?.[0];
  if (!day || !Number.isFinite(Date.parse(value))) return null;
  const date = new Date(day);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(day) ? day : null;
}

function dates(values: (string | null)[], observedDay: string) {
  const result = {missing: 0, invalid: 0, onOrBeforeObservation: 0, afterObservation: 0};
  for (const value of values) {
    const day = isoDay(value);
    if (value === null) result.missing++;
    else if (day === null) result.invalid++;
    else if (day <= observedDay) result.onOrBeforeObservation++;
    else result.afterObservation++;
  }
  return result;
}

export function catalogueSummary(samples: Sample[], observedDay: string) {
  const sets = samples.map(({set}) => set);
  const barcodeFields = samples.map(({raw}) => optional(raw.barcode));
  const categories = samples.map(({raw}) => text(raw.category)?.trim().toLowerCase() ?? null);
  const knownCategories = ['normal', 'extended', 'collection', 'random', 'other', 'gear', 'book'];
  const categoryCounts = Object.fromEntries(knownCategories.map(category =>
    [category, count(categories, value => value === category)]));
  const variants = new Map<string, Set<number>>();
  for (const set of sets) {
    const family = variants.get(set.number) ?? new Set<number>();
    family.add(set.variant);
    variants.set(set.number, family);
  }

  return {
    sampled: sets.length,
    distinctYears: new Set(sets.flatMap(set => set.year === null ? [] : [set.year])).size,
    distinctThemes: new Set(sets.flatMap(set => set.theme === null ? [] : [set.theme.trim().toLowerCase()])).size,
    numbersWithMultipleVariants: count([...variants.values()], family => family.size > 1),
    productCategories: {
      ...categoryCounts,
      missing: count(categories, value => value === null),
      unrecognized: count(categories, value => value !== null && !knownCategories.includes(value)),
    },
    lifecycle: {
      released: count(sets, set => set.released === true),
      unreleased: count(sets, set => set.released === false),
      unknownRelease: count(sets, set => set.released === null),
      launchDates: dates(sets.map(set => set.launchDate), observedDay),
      exitDates: dates(sets.map(set => set.exitDate), observedDay),
    },
    msrp: {CAD: numericPresence(sets.map(set => set.CAD.msrp)), USD: numericPresence(sets.map(set => set.USD.msrp))},
    barcodes: {
      UPC: barcodes(barcodeFields.map(barcode => barcode.UPC), [12]),
      EAN: barcodes(barcodeFields.map(barcode => barcode.EAN), [8, 13]),
    },
  };
}

function valuesSummary(values: (number | null)[]) {
  return {
    ...numericPresence(values),
    knownTotal: values.reduce((total, value) => total + BigInt(value ?? 0), 0n).toString(),
  };
}

export function collectionSummary(records: Personal[], sampled: Sample[], labels: {flagNo: number; label: string}[]) {
  const sampledIDs = new Set(sampled.map(({set}) => set.setID));
  const owned = records.filter(record => record.owned === true);
  const wanted = records.filter(record => record.wanted === true);
  const priorities = wanted.map(record => record.wantedPriority);
  const flags = records.flatMap(record => record.flags ?? []);
  const labeled = new Set(labels.filter(label => label.label.trim()).map(label => label.flagNo));
  function state(field: 'owned' | 'wanted', quantity: 'qtyOwned' | 'qtyWanted') {
    return {
      distinct: count(records, record => record[field] === true),
      falseState: count(records, record => record[field] === false),
      unknownState: count(records, record => record[field] === null),
      quantities: valuesSummary(records.map(record => record[quantity])),
      missingQuantityWhenTrue: count(records, record => record[field] === true && record[quantity] === null),
      zeroQuantityWhenTrue: count(records, record => record[field] === true && record[quantity] === 0),
      positiveQuantityWhenFalse: count(records, record => record[field] === false && (record[quantity] ?? 0) > 0),
    };
  }
  function conditionComparison(field: 'qtyOwnedUsed' | 'qtyOwnedLoose') {
    const result = {comparable: 0, unequal: 0};
    for (const record of owned) {
      const {qtyOwned, qtyOwnedNew} = record;
      const condition = record[field];
      if (qtyOwned === null || qtyOwnedNew === null || condition === null) continue;
      result.comparable++;
      if (BigInt(qtyOwnedNew) + BigInt(condition) !== BigInt(qtyOwned)) result.unequal++;
    }
    return result;
  }

  return {
    records: records.length,
    evidence: records.length ? 'nonempty' : 'empty',
    joinedToSample: count(records, record => sampledIDs.has(record.setID)),
    owned: state('owned', 'qtyOwned'),
    wanted: state('wanted', 'qtyWanted'),
    ownedAndWanted: count(owned, record => record.wanted === true),
    wantedPriority: {
      ...numericPresence(priorities),
      distinctKnownCodes: new Set(priorities.filter(value => value !== null)).size,
    },
    ownedCondition: {
      new: valuesSummary(owned.map(record => record.qtyOwnedNew)),
      used: valuesSummary(owned.map(record => record.qtyOwnedUsed)),
      loose: valuesSummary(owned.map(record => record.qtyOwnedLoose)),
      newPlusUsed: conditionComparison('qtyOwnedUsed'),
      newPlusLoose: conditionComparison('qtyOwnedLoose'),
    },
    flags: {
      missingRecords: count(records, record => record.flags === null),
      emptyRecords: count(records, record => record.flags?.length === 0),
      populatedRecords: count(records, record => (record.flags?.length ?? 0) > 0),
      trueValues: count(flags, flag => flag.value),
      falseValues: count(flags, flag => !flag.value),
      valuesWithNonemptyLabel: count(flags, flag => labeled.has(flag.flagNo)),
      labelsReturned: labels.length,
      nonemptyLabels: labeled.size,
    },
  };
}

export function latestUsage(response: Obj) {
  const usage = rows(response, 'apiKeyUsage');
  if (usage.matches !== usage.rows.length) throw new DiagnosticError('invalid');
  if (!usage.rows.length) throw new DiagnosticError('quota');
  const observations = usage.rows.map(row => {
    const day = isoDay(text(row.dateStamp));
    if (day === null) throw new DiagnosticError('invalid');
    return {day, row};
  });
  if (new Set(observations.map(({day}) => day)).size !== observations.length) throw new DiagnosticError('invalid');
  const [{day, row}] = observations.sort((a, b) => b.day.localeCompare(a.day));
  const used = qty(row.count);
  const dailyLimit = qty(row.dailyLimit);
  if (used === null || dailyLimit === null || dailyLimit === 0) throw new DiagnosticError('invalid');
  return {day, used, dailyLimit};
}

export function usageSummary(before: ReturnType<typeof latestUsage>, after: ReturnType<typeof latestUsage>) {
  const sameDay = before.day === after.day;
  return {
    before: {used: before.used, dailyLimit: before.dailyLimit},
    after: {used: after.used, dailyLimit: after.dailyLimit},
    sameReportedDay: sameDay,
    usageDelta: sameDay ? after.used - before.used : null,
  };
}
