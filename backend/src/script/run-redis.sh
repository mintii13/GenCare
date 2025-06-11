#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
START_SCRIPT="$SCRIPT_DIR/start-redis.sh"

# Cấp quyền và chạy
chmod +x "$START_SCRIPT"
"$START_SCRIPT"
