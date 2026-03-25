#!/bin/bash
set -o errexit
set -o nounset
set -o xtrace

# Install Deno
curl -fsSL https://deno.land/install.sh | sudo DENO_INSTALL=/usr/local sh -s -- -y "v2.7.1"

# Install Claude Code
#curl -fsSL https://claude.ai/install.sh | bash
