#!/bin/bash
set -euo pipefail

printf "Cleaning up project node_modules...\n\n"

find . -type d -name 'node_modules' -prune # 삭제 전 목록 출력

echo

find . -type d -name 'node_modules' -prune -exec rm -rf {} +

printf "Cleanup complete.\n\n"
