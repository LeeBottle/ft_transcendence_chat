#!/bin/bash

printf "Cleaning up project artifacts...\n\n"

# 삭제 전 목록 출력

find . -type d -name 'node_modules' -prune \
  -o -type d \( \
  -name '.next' \
  -o -name 'dist' \
  -o -name '.turbo' \
  -o -name 'tsconfig.build.tsbuildinfo' \
  -o -name '.turbo' \) -prune -print

echo

# 삭제

find . -type d -name 'node_modules' -prune -o -type d \( -name '.next' -o -name 'dist' -o -name '.turbo' \) -prune -exec rm -rf {} +

printf "Cleanup complete.\n\n"
