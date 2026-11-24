#!/usr/bin/env bash
set +x
set -e -o pipefail

if [[ ! -t 0 || ! -t 2 ]]; then
  printf 'Run this command from an owner-controlled private terminal.\n' >&2
  exit 1
fi

unset local_brickset_key local_brickset_hash
IFS= read -r -p 'Confirm approved, read-only use by entering remaining calls (at least 16): ' remaining_calls
if [[ ! "$remaining_calls" =~ ^[1-9][0-9]{0,15}$ ]] || (( remaining_calls < 16 )); then
  printf 'Enter a confirmed remaining call count of at least 16.\n' >&2
  exit 1
fi
IFS= read -rs -p 'Brickset API key: ' local_brickset_key
printf '\n' >&2
IFS= read -rs -p 'Brickset user hash: ' local_brickset_hash
printf '\n' >&2

printf '%s\n' "$local_brickset_key" "$local_brickset_hash" |
  node scripts/brickset-diagnostic.mjs --owner-stdin "$remaining_calls"
