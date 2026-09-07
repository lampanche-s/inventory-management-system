#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is required for complete verification because PostgreSQL/Testcontainers tests are mandatory." >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is installed but unavailable. PostgreSQL/Testcontainers tests are mandatory for complete verification." >&2
    exit 1
  fi
}

require_surefire_execution() {
  local report="$1"
  local label="$2"

  if [[ ! -f "$report" ]]; then
    echo "ERROR: Required test report was not generated: $label ($report)." >&2
    exit 1
  fi

  local header tests skipped failures errors
  header="$(grep -m1 '<testsuite ' "$report" || true)"
  tests="$(sed -n 's/.* tests="\([0-9][0-9]*\)".*/\1/p' <<<"$header")"
  skipped="$(sed -n 's/.* skipped="\([0-9][0-9]*\)".*/\1/p' <<<"$header")"
  failures="$(sed -n 's/.* failures="\([0-9][0-9]*\)".*/\1/p' <<<"$header")"
  errors="$(sed -n 's/.* errors="\([0-9][0-9]*\)".*/\1/p' <<<"$header")"

  if [[ -z "$tests" || -z "$skipped" || -z "$failures" || -z "$errors" ]]; then
    echo "ERROR: Could not read required test counters from $label." >&2
    exit 1
  fi

  if (( tests < 1 || skipped != 0 || failures != 0 || errors != 0 )); then
    echo "ERROR: Required PostgreSQL test did not run cleanly: $label (tests=$tests skipped=$skipped failures=$failures errors=$errors)." >&2
    exit 1
  fi
}

require_docker

(
  cd "$project_dir/backend"
  ./mvnw package
)

require_surefire_execution \
  "$project_dir/backend/target/surefire-reports/TEST-com.nexusstock.almoxarifado.PostgreSqlMigrationTests.xml" \
  "PostgreSqlMigrationTests"
require_surefire_execution \
  "$project_dir/backend/target/surefire-reports/TEST-com.nexusstock.almoxarifado.migration.LegacyRoleMigrationTests.xml" \
  "LegacyRoleMigrationTests"
require_surefire_execution \
  "$project_dir/backend/target/surefire-reports/TEST-com.nexusstock.almoxarifado.service.impl.SolicitacaoMovimentacaoConcurrencyTests.xml" \
  "SolicitacaoMovimentacaoConcurrencyTests"

(
  cd "$project_dir/frontend"
  npm ci
  npm audit --audit-level=low
  npm run check
)
