#!/bin/sh

HOST_IP=$(getent hosts host.docker.internal | awk '{ print $1 }')

deno run -A npm:chrome-devtools-mcp@latest \
  --browserUrl http://${HOST_IP:-127.0.0.1}:9222 \
  --logFile /tmp/devtools.log
