#!/bin/bash
set -euo pipefail

# sudo 권한이 아니면 차단
if [[ "${EUID}" -ne 0 ]]; then
  echo "[ERROR] This script requires administrative privileges (sudo)." >&2
  echo "[ERROR] Please run with sudo: sudo ./$(basename "${BASH_SOURCE[0]}")" >&2
  exit 1
fi

SERVICE_PATH="/etc/systemd/system/disable-thp.service"

# 1. THP 비활성화를 위한 systemd 서비스 생성 및 등록

# 1-1. systemd 서비스 유닛 파일 작성 (덮어쓰기)
cat << 'EOF' > "${SERVICE_PATH}"
[Unit]
Description=Disable Transparent Huge Pages (THP) for Redis
DefaultDependencies=no
After=sysinit.target local-fs.target
Before=mongod.service redis.service docker.service

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo never > /sys/kernel/mm/transparent_hugepage/enabled && echo never > /sys/kernel/mm/transparent_hugepage/defrag'

[Install]
WantedBy=basic.target
EOF

# 1-2. 파일 권한 설정 (rw-r--r--)
chmod 644 "${SERVICE_PATH}"

# 1-3. systemd 데몬 리로드 및 서비스 등록/즉시 실행
systemctl daemon-reload
systemctl enable --now disable-thp.service

# 2. Redis용 sysctl 파라미터 영구 설정 및 즉시 반영
SYSCTL_CONF="/etc/sysctl.d/99-redis.conf"

cat << 'EOF' > "${SYSCTL_CONF}"
vm.overcommit_memory = 1
EOF

chmod 644 "${SYSCTL_CONF}"

# 파일에 정의된 파라미터를 현재 런타임에 즉시 로드
sysctl -p "${SYSCTL_CONF}" > /dev/null

# 4. 적용 결과 검증 ([never] 표기 확인)
echo ""
echo "=== THP Configuration Result ==="
echo -n "enabled: " && cat /sys/kernel/mm/transparent_hugepage/enabled
echo -n "defrag:  " && cat /sys/kernel/mm/transparent_hugepage/defrag
