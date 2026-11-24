# V0.0 acceptance / decision gate — 2026-11-24

**Historical baseline — HOLD / outcome C (before live test).** 20/20 local tests passed on Node 22.16.0, TypeScript 5.8.3, including a fresh rerun during source transfer. No actual API calls. Six synthetic catalogue sets, four synthetic personal records (three joined, one unmatched), two pages, two variants of one number. CA present 2/6, US present 2/6, both present 1/6; these are fixture properties, not Brickset estimates. Injected transport exercises nine calls, 26 synthetic records, two pages and exact variant lookup. Local HTTP tests exercise both fixture and live-unconfigured modes. No mutation invoked. Browser QA attempted; bundled Playwright browser unavailable, system Chromium loopback navigation blocked by administrator. No screenshot/reflow/device claims. Dependency installation offline failed (registry cache absent); global tsc used. Test evidence in docs/test-results.txt. No production deployment.

### Initial Codex Cloud verification

- **Pass — dependency install and build.** Installed TypeScript 5.8.3 from npm with Node 24.22.3 and npm 11.19.1. The repository has no committed lockfile.
- **Pass — offline suite.** All 25 tests passed (20 baseline, five headless-runner tests). Synthetic tests cover aggregate output, fixed POST requests, sanitized failures, zero requests when unconfigured, and HTTPS proxy routing without direct fallback.
- **Pass — fixture browser QA.** Headless Chromium at 320, 412 and 1366 CSS pixels rendered six synthetic rows and reported zero upstream calls. Exact variant filter `90001-2`, zero versus unknown quantities, independent CAD/USD prices, no results, keyboard focus and horizontal reflow passed. Physical Chromebook and Pixel testing remains open.
- **Blocked — live cloud acceptance at initial setup.** The environment draft declared both network secrets for `brickset.com`. At that point the active instance lacked the bindings and its network policy denied access to Brickset.

### POST preflight after PR #1

- **Pass — reproducible install and offline suite.** Generated the npm lockfile for TypeScript 5.8.3, ran `npm ci --ignore-scripts --no-audit --no-fund`, and passed all 27 tests on Node 24.22.3. Two new offline tests check the form body, exact echo assertions, and rejection of unsafe inputs.
- **Blocked — managed POST substitution.** Status reports both Brickset bindings ready and scoped to `brickset.com`. Presence alone leaves body substitution unverified. The synthetic echo host was denied by the current restricted policy, and the separate synthetic binding was absent. The probe requires a temporary host grant and a public synthetic value in a separate network secret. No Brickset API requests were made.
- **Blocked — follow-up probe.** Ran `node scripts/cloud-post-probe.mjs` once on the Cloud task. It printed `binding_missing_or_unsafe` and exited with status 1 before sending a POST. The running task lacked `CLOUD_POST_PROBE` and its enforced allowlist omitted `httpbingo.org`. A fresh `npm ci` and all 27 offline tests passed. For a separately authorized Brickset compatibility test while Cloud substitution is unverified, use the [owner-operated headless fallback](../README.md#owner-operated-fallback--private-terminal).

### First owner-operated live validation — 2026-11-24

**Current decision: HOLD / outcome B (partial provider compatibility).** Owner supplied a sanitized successful headless result from the merged PR #2 implementation. Repository merge and source path independently checked; live execution is owner-reported, not an independently rerun request. Nine attempted calls completed, including key/hash validation, usage, collection/flag-label reads, two 25-record catalogue pages for 2025 and an exact full-number probe. Fifty unique catalogue identities normalized and the exact probe matched. Both native MSRP fields and UPC/EAN were non-null in the normalized sample; zero-price sentinels, GTIN validity, source value parity and broader catalogue representativeness still need inspection. Nonempty collection and flag semantics are not established. Quota guard accepted the run; actual daily limit, before/after usage and reset are not reported by this runner. No mutations, persistent cache, images or deployment in the tested path. No personal collection values, account quota records, credentials or raw provider payloads published.

The owner-operated headless path is usable; Codex Cloud managed form substitution remains unverified and is not required for this test. Browser/private preview authentication remains a separate check before deploying a web app.

| ID | Status | Evidence / next action |
|---|---|---|
| T01 | Partial | personal companion permission and key issuance reported by owner; persistent caching/image scope unclarified |
| T02 | Pass | owner-reported successful key/hash verification via audited private headless path; hidden prompts and aggregate-only output; no server opened. Cloud substitution and live browser auth not certified |
| T03 | Pass | fixed read allowlist; POST upstream retrieval only; browser POST 405 and mutation route 404 in tests; first owner-reported live run used only bounded reads |
| T04 | Partial | live collection envelope accepted; nonempty record retrieval and private account reconciliation remain outstanding |
| T05 | Partial | live flag-label endpoint accepted; nonempty priority/condition/flag values and mapping remain unverified |
| T06 | Partial | two live pages and exact full-number probe succeeded per owner report; name/theme/subtheme, ambiguity and broader variants pending |
| T07 | Partial | 50 live normalized records from one 2025 query; cross-year/theme/lifecycle and product-type representativeness pending |
| T08 | Pass | owner-reported 50/50 non-null normalized fields in each native market, no FX fallback; coverage only, not zero sentinel semantics or source price parity |
| T09 | Partial | raw lifecycle fields kept separate; real date semantics not verified |
| T10 | Not tested | myBricks -> Brickset -> diagnostic refresh not tested |
| T11 | Partial | successful nine-call diagnostic and usage guard per owner report; observed before/after count, actual daily limit/reset and search budget pending |
| T12 | Blocked | no persistent cache; persistent retention permission pending |
| T13 | Partial | offline failure tests and owner-reported successful live transport; nonempty reconciliation and further response shape checks pending; do not deliberately exhaust quota |
| T14 | Pass | fixture fallback tested and labeled; actual export import not implemented or tested |
| T15 | Not tested | optional RSS directory documented, no XML/rights verification |
| T16 | Partial | owner-reported 50/50 non-null fields for both UPC and EAN; GTIN validation, aliases and regional variant coverage remain open |

4 Pass / 9 Partial / 1 Blocked / 2 Not tested (16 total). T02 and T08 pass only within the tested headless authentication and sample field-coverage scope. T01/T04/T06/T11/T12/T13 hard gates remain open. V0.1 not started or authorized. Next: improve aggregate diagnostics for quota before/after, personal field completeness, zero MSRP vs missing, GTIN checks and representative bounded query coverage, offline-test first. Then owner runs approved read-only tests against existing genuine collection records; compare privately. Obtain explicit provider retention/image guidance. No requirement to add artificial records, mutate via API, or repeat the blocked Cloud probe.

## Expanded diagnostic implementation — 2026-11-24

**Pass — offline implementation.** A clean lockfile install and all 36 tests passed on Node 24.22.3. Nine added tests cover the 16-call read plan, report sanitization, catalogue slices, query precision and ambiguity, MSRP zeros, GTIN format and checksum, collection field coverage, quota rollover and early stops, malformed responses, and credential and budget preflight. The fixture preview served six synthetic rows with zero upstream calls. The owner command also completed in a synthetic terminal with hidden input and one JSON report. The original nine-call profile remains covered by the existing suite.

| IDs | Status | Expanded evidence and next check |
|---|---|---|
| T04–T05 | Partial | Offline summaries distinguish empty and nonempty collection data, independent Owned/Wanted quantities, priority coverage, new/used/loose fields and flag coverage. Reconcile existing records privately. |
| T06–T07 | Partial | Offline checks cover exact full number, name, theme and subtheme plus six catalogue slices. Live match precision and breadth are pending. |
| T08–T09 | Pass within initial live sample for T08; Partial for T09 | Expanded offline checks distinguish missing and zero native MSRP, record release flags and count launch/exit dates. Source parity and date semantics remain open. |
| T11 | Partial | Offline checks enforce the 16-call budget and compare observed usage only within the same provider-reported day. Actual expanded readings and reset semantics are pending. |
| T13 | Partial | Offline tests verify fail-closed response and traffic handling. Expanded live response shapes remain unverified. |
| T16 | Partial | Offline checks validate UPC-A and EAN-8/EAN-13 formats and checksums. Live format coverage, aliases and regional variants remain open. |

The expanded profile has not run against Brickset. Outcome B / HOLD and the original acceptance matrix still apply. Use the documented owner-operated command in a private terminal or existing private Codespace. [Owner-operated diagnostic](../README.md#owner-operated-fallback--private-terminal)

## Live completion plan (when authorized)
1. Verify permission and privacy, confirm secure POST substitution if using Cloud, and check the API key/hash and actual usage through an authorized headless run. Retain only sanitized aggregate output.
2. Record timestamp, approved quota, counts and field presence (no personal raw payloads). Compare Owned/Wanted distinct counts/quantities against Brickset UI and sample at least 10 existing varied records. Check priority code mapping using account UI, flags/labels and new/used quantities. Do not mutate within V0.0. Empty collection confirms only the empty case.
3. Run the expanded profile once with an approved budget. Review whether its six slices cover 50–100 actual sets across older/current/upcoming, themes, variants and product categories. Record match precision, page counts, missing and zero CAD/USD MSRP and barcode quality counts. Compare selected prices and dates to Brickset pages and distinguish MSRP from current sale. Clarify exit-date semantics with provider if needed.
4. Observe an already-made or user-initiated ordinary myBricks update, verify sync in Brickset, then explicit fresh diagnostic. Compare counts; no application mutation. If no change available, leave T10 not tested.
5. Verify error handling with simulated failures and stay within the confirmed quota. If API access is insufficient, test a permitted export and verify format and parity before implementing an importer. Check the fixture UI on physical mobile and desktop devices. Stop at the V0.0 compatibility gate and report Pass, Partial, Fail, Blocked, or Not tested for each item.
