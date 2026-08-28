#!/bin/bash
set -euo pipefail

# ==============================================================================
# 0. 실행 권한 및 사용자 환경 검증 (Fail-Fast)
# ==============================================================================
# 0-1. 일반 유저 권한이 아니면 차단 (mkcert 및 사용자 키체인 오염 방지)
if [[ "${EUID}" -eq 0 ]]; then
  echo "[ERROR] Do NOT run this master script with sudo or as root." >&2
  echo "[ERROR] Run directly as your normal user: bash infra/scripts/$(basename "${BASH_SOURCE[0]}")" >&2
  exit 1
fi

# 0-2. 경로 계산 (어느 디렉터리에서 호출하더라도 일관된 절대 경로 보장)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=================================================================="
echo " Starting Host Environment Bootstrap"
echo " OS: Ubuntu 24.04 LTS | Target: Infra Provisioning"
echo "=================================================================="

# ==============================================================================
# 1. 셸 스크립트 실행 권한(+x) 일괄 동기화
# ==============================================================================
echo "[1/5] Synchronizing execute permissions (+x) on infra shell scripts..."
find "${INFRA_DIR}" -type f -name "*.sh" -exec chmod +x {} +

# ==============================================================================
# 2. Docker 엔진 및 Compose 플러그인 셋업
# ==============================================================================
echo "[2/5] Setting up Docker environment..."

# Docker 미설치 시 내부에서 필요한 시점에만 sudo를 호출하도록 위임
sudo "${SCRIPT_DIR}/setup-docker.sh"

# ==============================================================================
# 3. Nginx Root CA 등록 및 SSL 인증서 발급
# ==============================================================================
echo "[3/5] Setting up Nginx Local CA and Certificates..."
# 3-1. 로컬 머신 및 브라우저 신뢰 저장소(NSS DB)에 Root CA 설치
"${INFRA_DIR}/nginx/scripts/setup-ca.sh"

# 3-2. localhost 인증서 및 개인키 발급 (localhost.pem, localhost-key.pem)
"${INFRA_DIR}/nginx/scripts/generate-certs.sh"

# ==============================================================================
# 4. Redis 환경 구성
# ==============================================================================
echo "[4/5] Setting up Redis configuration..."
sudo "${INFRA_DIR}/redis/scripts/setup-redis.sh"

# ==============================================================================
# 5. 비특권(Non-Root) 컨테이너 파일 시스템 권한 최종 조정
# ==============================================================================
echo "[5/5] Enforcing non-root container filesystem permissions..."

# 5-1. Nginx 인증서 디렉터리(755) 및 파일(644) 권한 설정 (UID 101 읽기 보장)
if [[ -d "${INFRA_DIR}/nginx/certs" ]]; then
  chmod 755 "${INFRA_DIR}/nginx/certs"
  find "${INFRA_DIR}/nginx/certs" -type f -name "*.pem" -exec chmod 644 {} +
fi

# 5-2. Nginx 및 Redis 설정 파일 읽기 권한 보장
find "${INFRA_DIR}/nginx/conf.d" -type f -name "*.conf" -exec chmod 644 {} + 2> /dev/null || true
find "${INFRA_DIR}/nginx/snippets" -type f -name "*.conf" -exec chmod 644 {} + 2> /dev/null || true
[[ -f "${INFRA_DIR}/nginx/nginx.conf" ]] && chmod 644 "${INFRA_DIR}/nginx/nginx.conf"
[[ -f "${INFRA_DIR}/redis/chat-store.conf" ]] && chmod 644 "${INFRA_DIR}/redis/chat-store.conf"

echo "=================================================================="
echo " Host bootstrap completed successfully!"
echo " Next command:"
echo "   make up-build"
echo "=================================================================="
