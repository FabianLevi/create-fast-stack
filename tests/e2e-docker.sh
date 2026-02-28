#!/usr/bin/env bash
set -euo pipefail

##
# E2E Docker tests for create-fast-stack
# Runs 5 independent tests: 3 backends (health check) + 2 frontends (build)
# Usage: bash tests/e2e-docker.sh
##

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMPDIR_BASE=$(mktemp -d)
PASS=0
FAIL=0
RESULTS=()

cleanup() {
  echo ""
  echo "Cleaning up temp dir: $TMPDIR_BASE"
  rm -rf "$TMPDIR_BASE"
  # Remove any leftover containers/images
  for name in cfs-e2e-python-fastapi cfs-e2e-go-fiber cfs-e2e-nestjs; do
    docker rm -f "$name" 2>/dev/null || true
    docker rmi -f "$name" 2>/dev/null || true
  done
  for name in cfs-e2e-react-vite cfs-e2e-nextjs; do
    docker rmi -f "$name" 2>/dev/null || true
  done
}
trap cleanup EXIT

# ── Prereq checks ──────────────────────────────────────────────

check_prereqs() {
  if ! command -v docker &>/dev/null; then
    echo "FATAL: docker not found"
    exit 1
  fi
  if ! docker info &>/dev/null; then
    echo "FATAL: docker daemon not running"
    exit 1
  fi
  if ! command -v bun &>/dev/null; then
    echo "FATAL: bun not found"
    exit 1
  fi
  echo "prereqs OK (docker + bun)"
}

# ── Helpers ─────────────────────────────────────────────────────

record() {
  local label=$1 status=$2
  if [ "$status" = "PASS" ]; then
    PASS=$((PASS + 1))
    RESULTS+=("[PASS] $label")
    echo "[PASS] $label"
  else
    FAIL=$((FAIL + 1))
    RESULTS+=("[FAIL] $label")
    echo "[FAIL] $label"
  fi
}

scaffold() {
  local name=$1 backend=$2 frontend=$3 outdir=$4
  local args="--name=$name --out=$outdir"
  [ -n "$backend" ] && args="$args --backend=$backend"
  [ -n "$frontend" ] && args="$args --frontend=$frontend"
  cd "$PROJECT_ROOT"
  bun tests/e2e-scaffold.ts $args
}

wait_for_health() {
  local port=$1 max_retries=20 i=0
  while [ $i -lt $max_retries ]; do
    if curl -sf "http://localhost:${port}/health" &>/dev/null; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

# ── Backend test ────────────────────────────────────────────────

test_backend() {
  local framework=$1 dockerfile_content=$2
  local test_name="e2e-${framework}"
  local outdir="$TMPDIR_BASE/$test_name"
  local container_name="cfs-e2e-${framework}"
  local image_name="cfs-e2e-${framework}"
  local port=8000

  echo ""
  echo "── Testing backend: $framework ──"

  # Scaffold
  mkdir -p "$outdir"
  if ! scaffold "$test_name" "$framework" "" "$outdir"; then
    record "$framework: scaffold failed" "FAIL"
    return
  fi

  local app_dir="$outdir/$test_name/${test_name}-backend"

  # Write Dockerfile
  echo "$dockerfile_content" > "$app_dir/Dockerfile"

  # Build
  echo "  building docker image..."
  if ! docker build -t "$image_name" "$app_dir" --quiet; then
    record "$framework: docker build failed" "FAIL"
    return
  fi

  # Run
  echo "  starting container..."
  docker rm -f "$container_name" 2>/dev/null || true
  docker run -d -p "${port}:8000" --name "$container_name" "$image_name" >/dev/null

  # Health check
  echo "  waiting for /health..."
  if ! wait_for_health "$port"; then
    echo "  container logs:"
    docker logs "$container_name" 2>&1 | tail -20
    docker rm -f "$container_name" 2>/dev/null || true
    docker rmi -f "$image_name" 2>/dev/null || true
    record "$framework: /health timeout" "FAIL"
    return
  fi

  # Validate response
  local response
  response=$(curl -sf "http://localhost:${port}/health")
  docker rm -f "$container_name" >/dev/null 2>&1
  docker rmi -f "$image_name" >/dev/null 2>&1

  if echo "$response" | grep -q '"status".*"ok"'; then
    record "$framework: /health -> ${response}" "PASS"
  else
    record "$framework: unexpected response: ${response}" "FAIL"
  fi
}

# ── Frontend test ───────────────────────────────────────────────

test_frontend() {
  local framework=$1 dockerfile_content=$2
  local test_name="e2e-${framework}"
  local outdir="$TMPDIR_BASE/$test_name"
  local image_name="cfs-e2e-${framework}"

  echo ""
  echo "── Testing frontend: $framework ──"

  # Scaffold
  mkdir -p "$outdir"
  if ! scaffold "$test_name" "" "$framework" "$outdir"; then
    record "$framework: scaffold failed" "FAIL"
    return
  fi

  local app_dir="$outdir/$test_name/${test_name}-frontend"

  # Write Dockerfile
  echo "$dockerfile_content" > "$app_dir/Dockerfile"

  # Build (includes npm install + npm run build)
  echo "  building docker image (npm install + build)..."
  if docker build -t "$image_name" "$app_dir"; then
    docker rmi -f "$image_name" >/dev/null 2>&1
    record "$framework: npm run build succeeded" "PASS"
  else
    docker rmi -f "$image_name" >/dev/null 2>&1
    record "$framework: npm run build failed" "FAIL"
  fi
}

# ── Dockerfiles ─────────────────────────────────────────────────

DOCKERFILE_PYTHON=$(cat <<'DOCKERFILE'
FROM python:3.12-slim
RUN pip install uv
WORKDIR /app
COPY . .
RUN uv sync
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
DOCKERFILE
)

DOCKERFILE_GO=$(cat <<'DOCKERFILE'
FROM golang:1.21-alpine
WORKDIR /app
COPY . .
RUN go mod tidy && go mod download
EXPOSE 8000
CMD ["go", "run", "main.go"]
DOCKERFILE
)

DOCKERFILE_NEST=$(cat <<'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV APP_HOST=0.0.0.0
EXPOSE 8000
CMD ["npm", "run", "start:dev"]
DOCKERFILE
)

DOCKERFILE_FRONTEND=$(cat <<'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
DOCKERFILE
)

# ── Main ────────────────────────────────────────────────────────

main() {
  echo "=== create-fast-stack E2E Docker Tests ==="
  echo "tmp dir: $TMPDIR_BASE"
  echo ""

  check_prereqs

  # 3 backend tests (sequential — share port 8000)
  test_backend "python-fastapi" "$DOCKERFILE_PYTHON"
  test_backend "go-fiber" "$DOCKERFILE_GO"
  test_backend "nestjs" "$DOCKERFILE_NEST"

  # 2 frontend tests (sequential — docker build)
  test_frontend "react-vite" "$DOCKERFILE_FRONTEND"
  test_frontend "nextjs" "$DOCKERFILE_FRONTEND"

  # Summary
  echo ""
  echo "=== Results ==="
  for r in "${RESULTS[@]}"; do
    echo "  $r"
  done
  echo ""
  echo "$((PASS + FAIL)) tests: $PASS passed, $FAIL failed"

  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
}

main "$@"
