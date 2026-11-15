#!/bin/bash
set -o errexit
set -o nounset
set -o xtrace

# Install Node (ルートと docs/api の .node-version と揃える)
mise use --global node@26

# Install Claude Code
#curl -fsSL https://claude.ai/install.sh | bash
