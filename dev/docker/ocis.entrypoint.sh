#!/usr/bin/env sh
set -eo pipefail
[[ "${DEBUG}" == "true" ]] && set -x

sleep 3

ocis init --insecure true || true
ocis server
