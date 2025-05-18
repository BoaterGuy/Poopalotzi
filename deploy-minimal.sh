#!/bin/bash

# Kill any running servers
pkill -f "node" || true

# Start minimal server
cd minimal-deploy
node index.js