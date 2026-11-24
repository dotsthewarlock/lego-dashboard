# Capability / permission report — 2026-11-24

Repository inspected via authenticated GitHub connector: dotsthewarlock/lego-dashboard, ID 1470424403, administrator/push true, public, default main. Initial assessment: empty, no branches. Subsequently owner approved public source control (ADR-24), and main was initialized with a README. Private runtime remains mandatory.

Official sources checked (2026-11-24):
- https://brickset.com/article/52664/api-version-3-documentation (v1.10 change log 2026-11-19; method tables and class definitions)
- https://brickset.com/article/52666/brickset-web-service (key, cap, copycat restriction)
- https://brickset.com/tools/webservices/requestkey (official application)
- https://brickset.com/api/v3.asmx?op=login (POST form)
- https://brickset.com/api/v3.asmx?op=getSets (POST form)
- https://brickset.com/api/v3.asmx?op=getKeyUsageStats (POST form)
- https://brickset.com/article/52659/terms-of-use (image classes and database policy)
- https://brickset.com/article/110540/ (collection settings)
- https://brickset.com/faq (CSV collection backup)
- https://brickset.com/article/52663/ (RSS directory)
- https://www.lego.com/en-gb/legal/notices-and-policies/fair-play (image/trademark constraints)
- https://docs.github.com/en/codespaces/reference/security-in-github-codespaces (creator-only private ports)
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace (port forwarding)

| Capability | Documented | V0.0 result / limitation |
|---|---|---|
| checkKey / login / checkUserHash | API key, login yields hash | checkKey/checkUserHash candidate implemented; login delegated to official page; lifecycle unknown, no live authentication |
| getCollection | sets array of collection objects, internal setID | candidate implemented; full record counts must reconcile, no absent-row false zero |
| getSets | year, query (name/number/theme/subtheme), full setNumber, setID, theme/subtheme, pageNumber and pageSize <=500 | two pages x25, exact number probe; other query modes still need live tests |
| getUserFlagLabels | flags response | candidate label structure from class; docs link to flag class instead of flagLabel; verify actual response |
| getKeyUsageStats | apiKeyUsage, dateStamp/count/dailyLimit | 100 initial calls published; all calls count as of Nov 19, despite older text; current cap/reset unverified |
| Owned/Wanted | independent qtyOwned/qtyWanted and boolean states | fixture passes, real reconciliation blocked |
| Priority | numeric wantedPriority | raw value retained; mapping to labels blocked |
| Condition | qtyOwnedNew / qtyOwnedUsed (class), qtyOwnedLoose (changelog) | both retained separately; no assumption of equivalence |
| CA/US native MSRP | LEGOCom.CA/US.retailPrice | fixture nulls preserved; real coverage blocked |
| Release | released, launchDate, exitDate, regional dates, availability | raw metadata, no official retirement/stock inference |
| Barcode | barcode.UPC/EAN, itemNumber.NA/EU | barcode strings preserved; regional item numbers not mapped yet |
| Images | image.thumbnailURL/imageURL | no rendering or retrieval; official image reuse conditional on LEGO Fair Play; other images may require attribution/permission |
| ACM acquisition | no dedicated per-copy endpoint identified | remains Brickset |
| Retail history/live stock | no comprehensive API identified | remains external; no pricing infrastructure |
| RSS | directory lists CA and US Amazon feeds | directory confirmed only, XML/retention not tested, no ingestion |
| Export | FAQ documents CSV backups from My Sets | actual schema and reuse permission unverified; no real import |
| Mutations | setCollection etc documented | excluded from allowlist, routes and tests; never invoked |

Permission boundary: public docs permit API apps subject to copycat restriction and revocation. Owner-reported approval email and key issuance on 2026-11-24 support private personal read-only companion use. Persistent retention, catalogue indexing, image display and redistribution are not established as authorized. Transient diagnostic only; no live calls or data retention performed. Pricing feed terms unknown and deferred. No production hosting selected. Rechecked official login and usage POST forms and API docs in continuation.

Fallback: keep Brickset/myBricks as collection authority. If API denied, ask whether privately viewing permitted user CSV export is allowed. Download actual Owned/Wanted exports via My Sets, inspect columns, normalize into a read-only snapshot with export time and exact identifiers; validate quantities and duplicate/variant handling; no writes, no auto-sync, no guessing missing values. Without permission, keep synthetic fixtures only. If catalogue breadth insufficient, evaluate Rebrickable licensed downloads separately and join only verified identities; no second editable collection authority. If cache denied, transient permitted scoped queries only, no offline retention. If images denied, text and source links. For insufficient quota, reduce sampling, no keystroke API requests; never silently return empty collection on provider failure. No automatic migration or paid services.

## Expanded headless profile

The owner-operated profile now measures scoped catalogue breadth, search precision, native MSRP presence and zeros, UPC-A and EAN-8/EAN-13 quality, collection field completeness and actual quota observations. The fixed sample uses Brickset's `category` field for product-type counts and retains release flags and date observations separately. The expanded profile has synthetic test evidence. The initial live evidence in the acceptance report covers the original profile. [Owner-operated diagnostic](../README.md#owner-operated-fallback--private-terminal)
