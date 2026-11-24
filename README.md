# LEGO Companion Dashboard — V0.0 compatibility diagnostic

**Decision: HOLD at V0.0.** Personal companion use is approved and a key issued (owner-reported provider email, 2026-11-24); actual authentication, data validation, persistent cache and image permissions are still open. This is a read-only diagnostic, not the V0.1 dashboard or installable PWA. No production hosting or live API requests have been made.

## Primary workflow — Codex Cloud

ChatGPT Project is the architecture/research authority; Codex Cloud is the primary coding and testing environment; GitHub main is the versioned source of truth. Codespaces is optional and reserved for a concrete secure-live-test or interactive-preview blocker. No platform-specific application migration is required.

1. Open ChatGPT/Codex on the web, select Work in > Cloud, and use the default environment if available or Create environment. Select the existing repository `dotsthewarlock/lego-dashboard` and branch main. Keep any reusable environment private (Only me). Check subscription/usage availability; no new paid service authorized.
2. First task: read AGENTS.md and referenced docs, inspect current main, confirm Node 22+, install dependencies with `npm install --ignore-scripts --no-audit --no-fund`, run `npm test`, and run fixture-only browser QA using Browser Use or HTTP Preview (port 3000) if available. Do not add live credentials yet. Verify 20 baseline tests (or explain discrepancies), review generated lockfile if installation succeeds, and report actual results. Prepare changes for review via a branch/PR; do not rewrite history.
3. For repeat work, configure install script with the dependency command above; once a verified lockfile exists use `npm ci --ignore-scripts --no-audit --no-fund`. Start only the fixture server with `DIAGNOSTIC_MODE=fixture npm start`. No automatic live startup. Use package-manager domains only for initial development; avoid broad internet access.
4. For a subsequent explicitly initiated live test, use current Codex Cloud private HTTP/network secrets scoped only to `brickset.com` for BRICKSET_API_KEY and BRICKSET_USER_HASH, if the account supports them. Network secrets provide placeholders with proxy substitution; direct environment variables are visible to programs and are not an equivalent protection. The existing adapter sends secrets as URL-encoded POST form fields; actual proxy compatibility is not yet established. First validate the fixed request contract and secret delivery with non-sensitive values, inspect current official docs, and ensure the HTTP client uses the configured proxy. Do not expose raw credentials, disable proxy/security controls, place secrets in setup scripts, ordinary variables, saved filesystem, task prompts or logs, or broaden egress to work around failures. Legacy Codex Cloud setup-only secrets differ; do not use them as a persistent runtime workaround.
5. Use the [headless cloud diagnostic](#headless-cloud-diagnostic) for an explicitly authorized live test after its prerequisites are verified. Keep actual personal data out of task artifacts, screenshots, source, PRs and persistent caches.
6. If safe network-secret delivery, private preview, or the necessary validation is unavailable, retain fixture-first Codex development and use the optional Codespaces workflow below for owner-operated live validation. Do not create or pay for other infrastructure by default.

See the [Codex Cloud documentation](https://learn.chatgpt.com/docs/cloud) and [cloud environment documentation](https://learn.chatgpt.com/docs/environments/cloud-environments) for platform setup.

## Headless cloud diagnostic

- Keep the Cloud environment private. In environment settings, scope both `BRICKSET_API_KEY` and `BRICKSET_USER_HASH` network-secret bindings to `brickset.com`. Verify both bindings are ready and confirm with non-sensitive values that the managed proxy substitutes placeholders inside URL-encoded HTTPS POST forms. Keep the actual values out of ordinary process variables, shell commands and files. If POST substitution cannot be verified, stop before using real credentials in Cloud.
- Recheck the official Brickset API contract, permission and current quota. Obtain the user hash privately through Brickset. Run only after the owner explicitly authorizes this run and confirms there are at least nine calls left after checking usage.
- Use Node 24.14 or newer for the headless runner's built-in HTTPS proxy support. The fixture app still supports Node 22+. Build with `npm run build` from the repository root. In a private terminal, with the above checks complete and the binding names provided by the platform, invoke the runner once. Replace the example budget of 9 with the confirmed remaining calls.

```bash
BRICKSET_NETWORK_SECRETS_CONFIRMED=yes BRICKSET_PERMISSION_CONFIRMED=yes \
  BRICKSET_REMAINING_CALLS=9 node scripts/brickset-diagnostic.mjs
```

The runner uses the configured HTTPS proxy with TLS verification, starts no server, and prints one JSON report. It counts up to nine attempted read-only calls, with no retry or polling. The report includes sample and collection totals, field coverage and the exact-variant result. Known quantity totals are decimal strings, with missing quantities counted separately. Errors return a fixed code and exit status 1. A successful report with a false or undetermined variant check still needs review. Keep results private and compare aggregate Owned and Wanted counts and quantities against the owner's Brickset UI.

## Optional fallback — browser-only Codespaces workflow

1. Existing repository: https://github.com/dotsthewarlock/lego-dashboard. Public source control is explicitly approved. Never commit credentials, live collection records, provider payloads, or private configuration. Use synthetic fixtures only.
2. Use Code > Codespaces > Create codespace on main. Check available free usage/billing first; do not activate paid usage without approval. In the browser terminal confirm node -v (22+) and npm -v.
3. Run npm install --ignore-scripts --no-audit --no-fund, npm test, then npm start. TypeScript is pinned at 5.8.3. Dependency installation was not verified in the offline environment; no lockfile was generated. Review and commit the generated package-lock.json only after installation succeeds. No production dependencies.
4. In the Ports panel forward port 3000. Confirm visibility is Private (creator-only), not Public or Organization. Open the forwarded HTTPS browser URL. The local server speaks HTTP over loopback; do not switch its local protocol to HTTPS without configuring TLS. Default mode is synthetic and has zero upstream calls. Test the six sample rows, exact variant filter 90001-2, unknown and zero quantities, native prices, no results, 320px reflow, keyboard focus, and Chromebook/Pixel usability. Browser QA was blocked in the local execution environment.
5. Stop the server with Ctrl+C and stop the codespace when finished. This is a temporary development preview, not a production deployment. No service worker, browser data cache or public hosting. GitHub Pages is not appropriate for live secrets.

## Live diagnostic (only in private preview)

- Personal companion use and key issuance were confirmed in the owner's approval report. No bulk catalogue caching, image display, long-term retention or redistribution is authorized by this implementation. Obtain explicit clarification before those features.
- On the official HTTPS test page https://brickset.com/api/v3.asmx?op=login, enter the approved key and your own Brickset credentials, then Invoke (POST). Obtain the hash from the response. Never put password/key/hash in chat, screenshots, source, issues or logs. Do not retain the Brickset password in the app. Close the response tab after copying the hash. Token lifespan and revocation remain unverified.
- Use https://brickset.com/api/v3.asmx?op=getKeyUsageStats and the same key (POST) to inspect actual quota, counting login and diagnostic calls conservatively. Confirm sufficient remaining calls (at least 9 after this check). If no usage record is returned, stop and report only the sanitized status, not the key or payload.
- In a fresh private Codespaces browser terminal, ensure no shell tracing/recording and no public forwarding. Use hidden-input prompts instead of shell history/command arguments. Choose a unique preview password of at least 24 characters, distinct from Brickset credentials. Enter the confirmed remaining quota as an integer. Do not paste secrets into chat.

```bash
set +x
read -rsp 'Brickset API key: ' BRICKSET_API_KEY; echo
read -rsp 'Brickset user hash: ' BRICKSET_USER_HASH; echo
read -rsp 'Separate preview password (24+ characters): ' DIAGNOSTIC_PASSWORD; echo
read -rp 'Confirmed remaining calls today (at least 9): ' BRICKSET_REMAINING_CALLS
export BRICKSET_API_KEY BRICKSET_USER_HASH DIAGNOSTIC_PASSWORD BRICKSET_REMAINING_CALLS
export BRICKSET_PERMISSION_CONFIRMED=yes DIAGNOSTIC_MODE=live BRICKSET_SAMPLE_YEAR=2025
npm start
```

- Open the private HTTPS preview. HTTP Basic username: owner; password: the separate preview password. The application enforces authentication for every live route, including static files. It rejects missing permission or credentials. Never remove auth to work around forwarding. Both the creator-only tunnel and application Basic auth are required; proxy/header behavior is not yet verified. If the tunnel fails, stop and report the error. In shared environments use a private browsing session, stop the server after use and close that session; HTTP Basic has no in-app logout. Do not expose directly on a LAN or public network.
- Each process starts one read-only run (maximum 9 calls; fewer for small results), no browser-triggered upstream calls, no retries, no polling, no persistent data or raw payload logging. Latest usage row must show at least 6 remaining after the initial three calls. Date/reset semantics are unvalidated; a fresh key with no usage rows may stop conservatively. Do not restart repeatedly.
- Record only safe results: mode, success/error code, sample size, number of upstream calls, missing CAD/USD counts, exact-variant probe result, and whether Owned/Wanted counts agree with the Brickset account. Do not share the actual collection, labels, raw response or credentials. An empty account can validate an empty collection but cannot establish nonempty priority/flag semantics or myBricks sync. Those tests remain pending until normal account records exist.
- After Ctrl+C run:

```bash
unset BRICKSET_API_KEY BRICKSET_USER_HASH DIAGNOSTIC_PASSWORD BRICKSET_REMAINING_CALLS BRICKSET_PERMISSION_CONFIRMED DIAGNOSTIC_MODE BRICKSET_SAMPLE_YEAR
```

Stop the codespace; clear your clipboard and close the private session.

## Public source control policy

Public source is owner-approved. The personal dashboard, credentials, live records, logs containing personal data and actual exports remain private. Never publish actual Brickset responses or catalogue datasets. Public GitHub code does not authorize redistribution. The npm package is marked private to prevent npm publication; this does not control GitHub visibility. No license selected. No production deployment, payment or V0.1 development is authorized.

See docs/COMPATIBILITY.md, docs/ACCEPTANCE.md, docs/DECISIONS.md, docs/PRIORITIES.md and CHANGELOG.md.
