# LEGO Companion Dashboard — agent instructions

## Authority and current gate
- Existing repository: dotsthewarlock/lego-dashboard. Inspect main, working tree, docs and tests before changing anything. Preserve existing work and Git history.
- Read README.md, docs/DECISIONS.md (latest decisions control), docs/ACCEPTANCE.md, docs/COMPATIBILITY.md, docs/PRIORITIES.md, CHANGELOG.md. ChatGPT Project's 00–07 source pack and latest explicit owner requirements control product decisions. If a consequential requirement is absent, request the relevant sanitized excerpt rather than invent it. Do not publish the private Project archive wholesale.
- Authorized milestone: V0.0 read-only compatibility only. Stop at the decision gate; V0.1 requires separate authorization. Preserve all 33 priorities exactly; importance is not implementation sequence.
- Brickset is authoritative for catalogue and collection; Brickset/myBricks remain primary update tools. AFOL Deals external. One mobile-first responsive PWA eventually, desktop secondary. No second editable collection store.
- Public GitHub source approved; private authenticated runtime and personal records remain mandatory. Personal companion API use approved by owner-reported key issuance; persistent caching, image use and redistribution not clarified. No bulk storage or images.

## Implementation
- Reuse Node 22+, strict TypeScript, existing provider/fixture contracts and vanilla diagnostic. Avoid new frameworks, databases or infrastructure unless justified at a later gate.
- Run `npm install --ignore-scripts --no-audit --no-fund` if no lockfile, then `npm test`. With a verified committed lockfile prefer npm ci. Review generated lockfile. Run fixture server with DIAGNOSTIC_MODE=fixture npm start. Current baseline: 20 offline tests, no live calls. Verify rather than assume.
- Typed normalized models; preserve provider ID, set number and variant, unknown vs zero, independent ownership/wanted, native CAD/USD prices and raw priority/condition fields. No inferred stock, retirement or missing prices.
- Fixed documented read allowlist only; never invoke setCollection or flag-label mutations. Bound calls and quota; no retries/polling by default, no per-keystroke provider calls. Fail closed; never convert an error to an empty collection or silently mix live and mock.
- No runtime AI, retailer scraping, price feeds, alerts, scanner buildout, writes or production features during V0.0.

## Development workflow and confidentiality
- Codex Cloud primary; ChatGPT Project architecture; GitHub version control. Codespaces optional fallback. Start with fixture-only tasks; private environment and limited egress.
- Never ask for, print, persist, log, commit or include credentials in prompts, issues, PRs, screenshots or fixtures. Use synthetic fixtures only in public source. Never publish raw provider responses, actual collection or flag labels.
- Before any live run, verify official provider docs, actual permission, secure domain-scoped network-secret substitution for POST forms, supported proxy, explicit user authorization for run, and sufficient quota. Use a tested headless aggregate-only diagnostic; no live data in cloud preview or agent output. No raw secret ordinary variables or setup-file workaround. If secure delivery fails, report blocker and use owner-operated private fallback. No deployment, payments, account changes or destructive actions without separate authorization.
- Maintain tests, acceptance matrix, decisions, changelog and setup docs. Clearly distinguish proposed, implemented, offline-tested, live-tested, deployed and verified-in-use. Report Pass/Partial/Fail/Blocked/Not tested with evidence. Do not claim fixture success as live integration.
- Work autonomously within approved scope. Prefer small changes with clear acceptance and rollback, review diff for secrets, keep Git history, present one concrete next step and remaining gate. Use branch/PR for Codex changes for owner review; no force-push or automatic merge.
