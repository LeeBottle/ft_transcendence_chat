#!/bin/bash
set -euo pipefail

# 이 스크립트 실행 후 터미널 재시작 없이 docker 명령어를 바로 사용하려면, `newgrp docker` 실행할것

# 1. 충돌 가능성 있는 기존 패키지 제거
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove -y $pkg 2> /dev/null || true
done

# 2. Docker 공식 APT 저장소 키 및 소스 등록

# 1) 패키지 색인 업데이트 및 필수 유틸리티 설치
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2) Docker GPG 키 디렉터리 생성 및 키 다운로드
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3) APT 소스 목록에 공식 Docker 리포지토리 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4) 저장소 목록 갱신
sudo apt-get update

# 3. Docker Engine 및 Compose 플러그인 설치
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. sudo 없이 docker 명령어를 사용하기 위한 사용자 그룹 권한 부여

# 실행 타겟 유저 판별 (sudo 실행 시에도 실제 로그인 유저 타겟팅)
TARGET_USER="${SUDO_USER:-$USER}"

# 현재 로그인된 사용자를 docker 그룹에 추가
sudo usermod -aG docker "$TARGET_USER"

printf "\n\n"

# 5. 설치 및 동작 검증

# sg 명령어로 docker 그룹 권한을 부여한 일회성 서브셸을 열어 검증 명령어들을 일괄 실행
sg docker -c "
  echo
  docker --version  # Docker 데몬 및 CLI 버전 확인
  docker compose version  # Docker Compose v2 플러그인 버전 확인
  echo
  docker run --rm hello-world # 테스트 컨테이너 실행 확인
"
