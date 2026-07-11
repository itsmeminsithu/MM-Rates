#!/bin/zsh
set -e
cd "$(dirname "$0")/Web"
echo "Starting MM Rates demo..."
( sleep 1; open "http://localhost:3000" ) &
python3 scripts/demo_server.py
