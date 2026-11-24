# LEGO Companion Dashboard — V0.0 compatibility diagnostic

**Decision: HOLD at V0.0.** Personal companion use is approved and a key issued (owner-reported provider email, 2026-11-24); actual authentication, data validation, persistent cache and image permissions are still open. This is a read-only diagnostic, not the V0.1 dashboard or installable PWA. No production hosting or live API requests have been made.

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

If Cloud POST substitution remains unavailable, the shortest fallback is the same headless diagnostic on the owner's computer. Use an existing private Codespace only if a local terminal is impractical and its usage is acceptable. This workflow needs no HTTP server or forwarded port.

After separately authorizing the run, use Brickset's official HTTPS forms privately to obtain the hash and check the budget. Confirm at least nine calls remain after login and the quota check. If no usage record is returned, stop and retain only the sanitized status. [Brickset login](https://brickset.com/api/v3.asmx?op=login) · [Quota check](https://brickset.com/api/v3.asmx?op=getKeyUsageStats)

In an owner-controlled Bash terminal outside Codex, run `npm ci --ignore-scripts --no-audit --no-fund` and `npm run build` from the repository root. The hidden prompts below pass the key and hash over stdin to the one-shot Node process. Keep terminal tracing and recording off. Share only the aggregate result or error code.

```bash
(
  set +x
  set -e -o pipefail
  unset local_brickset_key local_brickset_hash
  IFS= read -rs -p 'Brickset API key: ' local_brickset_key
  printf '\n'
  IFS= read -rs -p 'Brickset user hash: ' local_brickset_hash
  printf '\n'
  IFS= read -r -p 'Confirmed remaining calls (at least 9): ' remaining_calls

  printf '%s\n' "$local_brickset_key" "$local_brickset_hash" |
    NODE_TLS_REJECT_UNAUTHORIZED=1 node --input-type=module -e '
      import {readFileSync} from "node:fs";
      import {diagnose} from "./scripts/brickset-diagnostic.mjs";
      const [apiKey, userHash] = readFileSync(0, "utf8").split("\n");
      const report = await diagnose({
        apiKey, userHash, permissionConfirmed: true,
        remainingCalls: Number(process.argv[1]), year: 2025,
      }, fetch);
      console.log(JSON.stringify(report));
      process.exitCode = report.status === "success" ? 0 : 1;
    ' "$remaining_calls"
)
```

## Public source control policy

Public source is owner-approved. The personal dashboard, credentials, live records, logs containing personal data and actual exports remain private. Never publish actual Brickset responses or catalogue datasets. Public GitHub code does not authorize redistribution. The npm package is marked private to prevent npm publication; this does not control GitHub visibility. No license selected. No production deployment, payment or V0.1 development is authorized.

See docs/COMPATIBILITY.md, docs/ACCEPTANCE.md, docs/DECISIONS.md, docs/PRIORITIES.md and CHANGELOG.md.
