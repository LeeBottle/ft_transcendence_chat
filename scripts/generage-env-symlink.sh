#!/bin/bash

cd "$(dirname "$0")/.."

ln -sf ../../infra/.env.api apps/api/.env.api
ln -sf ../../infra/.env.database apps/api/.env.database
