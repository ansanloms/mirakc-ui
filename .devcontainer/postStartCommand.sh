#!/bin/bash
set -o errexit
set -o nounset
set -o xtrace

# docker socket の権限設定(DooD のため)
sudo chmod 777 /var/run/docker.sock
