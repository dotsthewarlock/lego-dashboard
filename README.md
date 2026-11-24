# LEGO Companion Dashboard — V0.0 compatibility diagnostic

**Decision: HOLD at V0.0 (outcome B).** Personal companion use approved; first owner-operated live headless run reported successful authentication and catalogue retrieval on 2026-11-24. See docs/ACCEPTANCE.md for scope and remaining gates. Nonempty collection reconciliation, broader search/coverage, quota accounting, persistent cache and image permissions remain open. This is a read-only diagnostic, not the V0.1 dashboard or installable PWA. No production hosting. Codex remains primary for coding; the private terminal is the proven owner-reported live-test path.

## Primary workflow — Codex Cloud

Use the existing private Codex Cloud environment and select `dotsthewarlock/lego-dashboard` on `main`. From the repository root, run `npm ci --ignore-scripts --no-audit --no-fund` and `npm test` with Node 22 or newer. For fixture UI checks, start `DIAGNOSTIC_MODE=fixture npm start`. Keep fixture mode as the startup default.

The Cloud headless diagnostic and its transport probe use Node 24.14 or newer. See the [Codex Cloud documentation](https://learn.chatgpt.com/docs/cloud) and [cloud environment documentation](https://learn.chatgpt.com/docs/environments/cloud-environments).

## Verify Cloud POST substitution with synthetic data

1. In a private Cloud task, temporarily add `httpbingo.org` to restricted Internet access. Keep the existing domains and package-manager preset. Create a **network secret** with the environment variable name `CLOUD_POST_PROBE`, allowed domain `httpbingo.org` only, and the public synthetic value `CodexPostProbe2026`. This probe uses a public echo service. Use only that synthetic value for its binding and keep the existing Brickset bindings scoped separately.
2. Apply the settings and confirm the network-secret binding is ready on the running task. From the repository root run `npm run build` and then `node scripts/cloud-post-probe.mjs`. The script uses the diagnostic's HTTPS proxy setup with TLS verification. It sends one URL-encoded POST to the echo service with the synthetic placeholder in both credential-shaped fields and a separate control field. It prints one result code.
3. A `pass` confirms that the echo service received the expected synthetic value in both fields and the unchanged control field. `form_mismatch` means the POST reached the echo service but did not prove substitution. `binding_missing_or_unsafe`, `secure_proxy_unavailable`, `echo_http_error`, and `echo_failed` identify setup or transport blockers. Record the result code, then remove the temporary secret and echo-host grant. Keep the probe out of environment startup.

This checks the Cloud transport with a synthetic binding. Brickset authentication and quota require a separately authorized run.

## Headless Cloud diagnostic

- In the private environment's settings, allow `brickset.com` under restricted Internet access. Configure two **network secret** bindings with environment variable targets `BRICKSET_API_KEY` and `BRICKSET_USER_HASH`. Set the allowed domain of each binding to `brickset.com` only. Verify both bindings are ready on the running task. Keep credential values in the platform's secure secret settings.
- Require a passing synthetic POST check before relying on Cloud substitution. Recheck the official Brickset API contract and permission, and obtain the hash and current quota privately through Brickset. Run only after the owner explicitly authorizes one run and confirms at least nine calls remain after the quota check. [Brickset API documentation](https://brickset.com/article/52664/api-version-3-documentation)
- Run `npm run build`. From a private terminal, with the prerequisites complete and the bindings provided by the platform, run the command below once. Replace the example budget of 9 with the confirmed remaining calls.

```bash
BRICKSET_NETWORK_SECRETS_CONFIRMED=yes BRICKSET_PERMISSION_CONFIRMED=yes \
  BRICKSET_REMAINING_CALLS=9 node scripts/brickset-diagnostic.mjs
```

The runner starts no server and prints one aggregate JSON report. It attempts at most nine read-only calls, with no retry or polling. Known quantity totals are decimal strings and missing quantities are counted separately. Errors return a fixed code and exit status 1. Compare aggregate Owned and Wanted counts and quantities privately against the Brickset UI. A false or undetermined exact-variant result still needs review.

## Owner-operated fallback — private terminal

Use an owner-controlled Bash terminal on your computer or in an existing private GitHub Codespace. Run from the branch you intend to test. This command needs Node 22 or newer and opens no HTTP server or forwarded port.

1. Authorize one read-only run. Use Brickset’s HTTPS forms privately to obtain the user hash and verify at least 16 calls remain after login and the quota check. Stop if Brickset reports no usage record. [Brickset login](https://brickset.com/api/v3.asmx?op=login) · [Quota check](https://brickset.com/api/v3.asmx?op=getKeyUsageStats)
2. Run the commands below. Enter the confirmed remaining calls to approve this run, then enter the API key and user hash at the hidden prompts. Keep terminal tracing and recording off. The shell passes both values to Node over stdin.

   ```bash
   npm ci --ignore-scripts --no-audit --no-fund
   npm run --silent diagnostic:owner
   ```

3. Review the JSON privately. Record only sanitized aggregate evidence or the fixed error code. The report contains account-specific quota and collection totals, so keep it out of public issues and PRs.

The expanded profile attempts at most 16 calls. The first usage check must leave enough headroom for the remaining 15 calls. A full run includes two usage reads, two authentication checks, two personal reads, six catalogue pages and up to four search probes. The runner stops at the first request or validation error, exits 1 and prints a fixed code with the attempted count. It performs no retries or polling. Skipped probes reduce the request count. Budget and terminal input errors can also stop the command before credentials are requested.

- **Catalogue.** One page of up to 16 rows per slice, sorted by number. The slices cover 1999, the current UTC year for City, Technic, Collectable Minifigures and Gear, and the next UTC year, for up to 96 distinct records. Compare returned and in-scope counts per slice. The report counts observed years, themes, variant families, Brickset product categories, release flags and launch/exit date coverage. An exit date alone does not establish retirement or retail availability.
- **Queries.** A sampled record anchors each probe. Full number uses `setNumber` and prefers an observed variant family. Name uses ranked `query`. Theme and subtheme use the dedicated filters, with subtheme scoped to its parent theme. Each probe reports the provider match total, page size returned, exact field matches, and whether the original identity was among those exact matches. Text comparisons ignore case and outer whitespace. A `null` probe lacked a usable anchor. A truncated page can miss the anchor, and more than one exact result remains ambiguous for a unique lookup.
- **Prices and barcodes.** CAD and USD MSRP each report missing, zero and positive counts. Barcode results distinguish missing, invalid format, all-zero placeholders, failed checksum and structural validity. UPC uses 12 digits and EAN uses 8 or 13 digits, with the GS1 check digit. Check selected source prices and dates privately. Barcode assignment and regional alias coverage require separate evidence.
- **Collection.** `evidence: "empty"` covers only the empty case. For nonempty results, compare distinct Owned and Wanted counts and known quantity totals with Brickset privately. Quantity totals are decimal strings and include every known value across the collection. Priority coverage is measured on wanted records. New, used and loose coverage and reconciliation are measured separately on owned records. Review the flag coverage and label counts privately against existing records. The report omits personal rows, priority codes and flag labels.
- **Quota.** The report includes the latest provider-reported daily limit and used count at each read. A delta is reported when Brickset supplies the same day on both reads. Counter timing, other activity on the key, and the provider’s reset timezone can affect interpretation. Compare the delta with attempted calls privately.

A successful run means the read sequence completed. Use the per-check counts and private comparisons to assess compatibility. [Brickset API documentation](https://brickset.com/article/52664/api-version-3-documentation) · [Brickset set categories](https://brickset.com/article/110200/brickset-set-categories)

## Public source control policy

Public source is owner-approved. The personal dashboard, credentials, live records, logs containing personal data and actual exports remain private. Never publish actual Brickset responses or catalogue datasets. Public GitHub code does not authorize redistribution. The npm package is marked private to prevent npm publication; this does not control GitHub visibility. No license selected. No production deployment, payment or V0.1 development is authorized.

See docs/COMPATIBILITY.md, docs/ACCEPTANCE.md, docs/DECISIONS.md, docs/PRIORITIES.md and CHANGELOG.md.
