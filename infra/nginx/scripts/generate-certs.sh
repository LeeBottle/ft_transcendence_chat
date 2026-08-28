#!/bin/bash
set -euo pipefail

# 일반 유저 권한이 아니면 차단
if [[ "${EUID}" -eq 0 ]]; then
  echo "[ERROR] Do NOT run this script with sudo." >&2
  echo "[ERROR] Run directly as your normal user: ./$(basename "${BASH_SOURCE[0]}")" >&2
  exit 1
fi

if ! command -v mkcert &> /dev/null; then
  echo "[ERROR] mkcert is not installed. Please run ./infra/nginx/scripts/setup-ca.sh first." >&2
  exit 1
fi

# 스크립트 파일의 절대 경로 기준으로 디렉터리 지정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/../certs"

# 프로젝트 루트 경로 기준 (없으면 자동 생성)
mkdir -p "${CERTS_DIR}"

# localhost, 127.0.0.1, IPv6 loopback SAN이 포함된 인증서 발급
echo "[INFO] Generating certificates for local development..."
mkcert \
  -key-file "${CERTS_DIR}/localhost-key.pem" \
  -cert-file "${CERTS_DIR}/localhost.pem" \
  localhost 127.0.0.1 ::1
