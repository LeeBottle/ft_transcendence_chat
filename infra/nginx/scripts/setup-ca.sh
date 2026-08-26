#!/bin/bash
set -euo pipefail

# 루트 권한으로 실행 방지 (일반 사용자 환경의 NSS DB 등록 보장)
if [[ "${EUID}" -eq 0 ]]; then
  echo "[ERROR] Do NOT run this script with sudo." >&2
  echo "[ERROR] Run directly as your normal user: ./$(basename "${BASH_SOURCE[0]}")" >&2
  exit 1
fi

# 필수 CLI 도구 존재 여부 확인
if ! command -v mkcert &> /dev/null || ! command -v certutil &> /dev/null; then
  echo "[INFO] Missing dependencies. Installing via apt..."
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libnss3-tools \
    mkcert
fi

# 일반 사용자 권한으로 로컬 CA 설치
echo "[INFO] Installing local Root CA to system and browser trust stores..."
mkcert -install
