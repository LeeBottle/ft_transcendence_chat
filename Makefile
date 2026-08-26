SHELL := /bin/bash

COMPOSE := docker compose -f ./infra/compose.yaml --env-file ./infra/.env.database

# 특정 서비스 지정 변수 (예: make up c=api, make logs c=web, make shell c=redis)
c ?=

.PHONY: all help build up up-build down start stop restart ps top logs shell pull clean prune setup-host

all: help

## ----------------------------------------------------------------------
## Multi-Container Docker Compose Management
## ----------------------------------------------------------------------

help:
	@echo "사용 가능한 명령어 목록:"
	@echo "  make up [c=서비스명]       - 백그라운드 컨테이너 실행 (c 생략 시 전체 실행)"
	@echo "  make up-build [c=서비스명] - 이미지 빌드 후 백그라운드 실행"
	@echo "  make build [c=서비스명]    - 이미지 빌드 (캐시 활용)"
	@echo "  make down                  - 컨테이너 및 네트워크 제거 (볼륨 유지)"
	@echo "  make start [c=서비스명]    - 정지된 컨테이너 시작"
	@echo "  make stop [c=서비스명]     - 컨테이너 정지"
	@echo "  make restart [c=서비스명]  - 컨테이너 재시작"
	@echo "  make ps                    - 서비스 실행 상태 및 포트/헬스체크 확인"
	@echo "  make top [c=서비스명]      - 실행 중인 프로세스 목록 확인"
	@echo "  make logs [c=서비스명]     - 실시간 로그 스트리밍"
	@echo "  make shell c=서비스명      - 특정 서비스 컨테이너 셸(bash/sh) 접속"
	@echo "  make pull [c=서비스명]     - 베이스/원격 이미지 최신화"
	@echo "  make clean                 - 컨테이너, 네트워크 및 [모든 볼륨] 완전 삭제"
	@echo "  make prune                 - 미사용 도커 리소스 일괄 정리 (주의)"
	@echo "  make setup-host            - 호스트 환경 설정 스크립트 실행 (all-in-one) (일반 유저 권한으로 실행할 것)"

up: BUILD_FLAG :=
up-build: BUILD_FLAG := --build

up up-build:
ifneq ($(strip $(c)),)
	$(COMPOSE) up -d $(BUILD_FLAG) $(c)
else
	@# 1. DB 준비 상태 보장
	$(COMPOSE) up -d --wait db

	@# 2. API 이미지 리빌드 후 마이그레이션 검증
	$(COMPOSE) run $(BUILD_FLAG) --rm --no-deps api node --enable-source-maps node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

	@# 3. 전체 서비스 일괄 기동 (변경된 서비스만 스마트 교체, db는 유지)
	$(COMPOSE) up -d $(BUILD_FLAG)
endif

build:
	$(COMPOSE) build $(c)

pull:
	$(COMPOSE) pull $(c)

# 컨테이너 상태 제어
down:
	$(COMPOSE) down --remove-orphans

start:
	$(COMPOSE) start $(c)

stop:
	$(COMPOSE) stop $(c)

restart:
	$(COMPOSE) restart $(c)

# 모니터링 및 로깅
ps:
	$(COMPOSE) ps

top:
	$(COMPOSE) top $(c)

logs:
	$(COMPOSE) logs -f --tail=100 $(c)

# 임의의 서비스 셸 접속 (bash 우선 시도 후 sh 폴백)
shell:
	@if [ -z "$(c)" ]; then \
		echo "접속할 서비스명을 지정해야 합니다. (예: make shell c=api 또는 make shell c=db)"; \
		exit 1; \
	fi
	$(COMPOSE) exec -it $(c) /bin/sh -c "[ -x /bin/bash ] && exec /bin/bash || exec /bin/sh"

# 데이터 볼륨 및 환경 정리
clean:
	$(COMPOSE) down -v --remove-orphans

prune:
	docker system prune -af --volumes

setup-host:
	@./infra/scripts/setup-host.sh
