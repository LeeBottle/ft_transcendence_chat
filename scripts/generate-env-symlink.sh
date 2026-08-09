#!/bin/bash

cd "$(dirname "$0")/.." || (
  echo "Failed to change directory to project root."
  exit 1
)

ln -sf ../../infra/.env.api apps/api/.env.api
ln -sf ../../infra/.env.database apps/api/.env.database
