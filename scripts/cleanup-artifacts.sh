#!/bin/bash
set -euo pipefail

printf "Cleaning up project artifacts...\n\n"

# 삭제 전 목록 출력

find . -type d -name 'node_modules' -prune -exec sh -c 'for d; do if [ -d "$d/.cache" ]; then echo "$d/.cache"; fi; done' _ {} + \
  -o -type d \( -name 'dist' -o -name '.next' -o -name '.turbo' -o -name 'out' \) -prune -print

echo

# 삭제

find . -type d -name 'node_modules' -prune -exec sh -c 'for d; do rm -rf "$d/.cache"; done' _ {} + \
  -o -type d \( -name 'dist' -o -name '.next' -o -name '.turbo' -o -name 'out' \) -prune -exec rm -rf {} +

printf "Cleanup complete.\n\n"
