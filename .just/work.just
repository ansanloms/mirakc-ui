# このファイルは .just/ にあるため、レシピのデフォルト cwd が .just/ になる。
# `--workspace-folder .` 等がリポジトリルート基準で動くよう、cwd をルートへ戻す。
set working-directory := '..'

# 個人ローカルの上書き（.just/work.local.just があれば取り込む。無くても無視される）
import? 'work.local.just'

# devcontainer up
[confirm('本当に実施しますか？')]
up:
    devcontainer up \
      --log-level debug \
      --workspace-folder . \
      --config .devcontainer/devcontainer.json

# devcontainer build
[confirm('本当に実施しますか？')]
build:
    devcontainer build \
      --log-level debug \
      --workspace-folder . \
      --config .devcontainer/devcontainer.json

# devcontainer exec（既定は zsh を起動）
exec cmd='zsh':
    devcontainer exec \
      --log-level debug \
      --workspace-folder . \
      --config .devcontainer/devcontainer.json \
      {{cmd}}

# devcontainer stop
[confirm('本当に実施しますか？')]
[working-directory('.devcontainer')]
stop:
    docker compose --profile "*" stop

# devcontainer down
[confirm('本当に実施しますか？')]
[working-directory('.devcontainer')]
down:
    docker compose --profile "*" down --remove-orphans
