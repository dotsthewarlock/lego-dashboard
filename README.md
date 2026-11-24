# LEGO Companion Dashboard — V0.0 compatibility diagnostic

**Decision: HOLD at V0.0.** Personal companion use is approved and a key issued (owner-reported provider email, 2026-11-24); actual authentication, data validation, persistent cache and image permissions are still open. This is a read-only diagnostic, not the V0.1 dashboard or installable PWA. No production hosting or live API requests have been made.

## Browser-only Chromebook workflow

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
