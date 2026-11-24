# V0.0 acceptance / decision gate — 2026-11-24

**HOLD / outcome C.** 20/20 local tests passed on Node 22.16.0, TypeScript 5.8.3, including a fresh rerun during source transfer. No actual API calls. Six synthetic catalogue sets, four synthetic personal records (three joined, one unmatched), two pages, two variants of one number. CA present 2/6, US present 2/6, both present 1/6; these are fixture properties, not Brickset estimates. Injected transport exercises nine calls, 26 synthetic records, two pages and exact variant lookup. Local HTTP tests exercise both fixture and live-unconfigured modes. No mutation invoked. Browser QA attempted; bundled Playwright browser unavailable, system Chromium loopback navigation blocked by administrator. No screenshot/reflow/device claims. Dependency installation offline failed (registry cache absent); global tsc used. Test evidence in docs/test-results.txt. No production deployment.

### Codex Cloud verification

- **Pass — dependency install and build.** Installed TypeScript 5.8.3 from npm with Node 24.22.3 and npm 11.19.1. The repository has no committed lockfile.
- **Pass — offline suite.** All 25 tests passed (20 baseline, five headless-runner tests). Synthetic tests cover aggregate output, fixed POST requests, sanitized failures, zero requests when unconfigured, and HTTPS proxy routing without direct fallback.
- **Pass — fixture browser QA.** Headless Chromium at 320, 412 and 1366 CSS pixels rendered six synthetic rows and reported zero upstream calls. Exact variant filter `90001-2`, zero versus unknown quantities, independent CAD/USD prices, no results, keyboard focus and horizontal reflow passed. Physical Chromebook and Pixel testing remains open.
- **Blocked — live cloud acceptance.** The environment draft declares both network secrets for `brickset.com`. The active instance lacks these bindings, and its network policy denied access to the official Brickset docs. Managed substitution in POST forms, live authentication, quota, and account reconciliation remain unverified. No live API calls were made.

| ID | Status | Evidence / next action |
|---|---|---|
| T01 | Partial | personal companion permission and key issuance reported by owner; persistent caching/image scope unclarified |
| T02 | Blocked | HTTP Basic guard and headless proxy routing pass offline; managed POST substitution, actual key/hash and private tunnel untested |
| T03 | Pass | fixed read allowlist; POST upstream retrieval only; browser POST 405 and mutation route 404; no live calls |
| T04 | Blocked | synthetic join works; actual account counts/quantities not reconciled |
| T05 | Partial | fixtures retain raw priority, condition and flags; code mapping not verified |
| T06 | Partial | synthetic ID join, variants and pagination; actual number/name/theme/subtheme results not verified |
| T07 | Not tested | 50–100 real representative sets not sampled |
| T08 | Partial | synthetic native values and nulls pass; actual CA/US coverage unknown |
| T09 | Partial | raw lifecycle fields kept separate; real date semantics not verified |
| T10 | Not tested | myBricks -> Brickset -> diagnostic refresh not tested |
| T11 | Partial | all-call docs and usage endpoint verified; injected budget/429 checks pass; live entitlement/reset unknown |
| T12 | Blocked | no persistent cache; persistent retention permission pending |
| T13 | Partial | injected timeout, unauthorized, quota, upstream and bad payload pass; the headless runner returns a sanitized error and does not retry after proxy failure; live transport untested |
| T14 | Pass | fixture fallback tested and labeled; actual export import not implemented or tested |
| T15 | Not tested | optional RSS directory documented, no XML/rights verification |
| T16 | Partial | synthetic UPC string leading zeros; actual EAN/UPC coverage and variants untested |

T03 and T14 pass within current implementation scope only. T01/T02/T04/T06/T11/T12/T13 live hard gates still open. V0.1 not started or authorized by this result.

## Live completion plan (when authorized)
1. Verify permission and privacy; check API key/hash and actual usage. Check no credential leakage in network/browser bundle/logs, unauthorized access denied both UI and API over private tunnel. No persistent cache/images.
2. Record timestamp, approved quota, counts and field presence (no personal raw payloads). Compare Owned/Wanted distinct counts/quantities against Brickset UI and sample at least 10 existing varied records. Check priority code mapping using account UI, flags/labels and new/used quantities. Do not mutate within V0.0. Empty collection confirms only the empty case.
3. Sample 50–100 actual sets across older/current/upcoming, themes, variants and product types; use a bounded diagnostic run per authorized year plus selected exact/name/theme/subtheme queries. Current candidate only supports one year and exact probe: extend test harness inside V0.0 as needed, avoid extra requests before budget approval. Record match precision, pages and missing CAD/USD/UPC/EAN counts; compare selected prices/dates to Brickset pages and distinguish MSRP vs current sale. No claim of entire catalogue coverage. Clarify exit-date semantics with provider if needed.
4. Observe an already-made or user-initiated ordinary myBricks update, verify sync in Brickset, then explicit fresh diagnostic. Compare counts; no application mutation. If no change available, leave T10 not tested.
5. Verify error handling with simulated failures, do not deliberately exhaust real quota. Test a permitted export if API access insufficient; verify format and parity before implementing importer. Validate actual mobile/desktop browser preview and private proxy authentication. Stop at compatibility gate, report Pass/Partial/Fail/Blocked/Not tested; no V0.1 without authorization.
