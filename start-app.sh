#!/bin/bash
cd /home/runner/workspace
pkill -f "server-standalone" 2>/dev/null || true
sleep 1
node server-standalone.cjs &
echo "Poopalotzi boat management application starting on port 5000..."
sleep 3
echo "Application is ready!"