#!/usr/bin/env bash
set -euo pipefail

required_vars=(VPS_HOST VPS_USERNAME VPS_GAME_PATH)
for var_name in "${required_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
        echo "Missing required environment variable: ${var_name}" >&2
        exit 1
    fi
done

source_dir="packages/game/dist"
if [[ ! -d "${source_dir}" ]]; then
    echo "Game artifact directory does not exist: ${source_dir}" >&2
    echo "Run pnpm build:game before deploying." >&2
    exit 1
fi

ssh_port="${VPS_SSH_PORT:-22}"
ssh_target="${VPS_USERNAME}@${VPS_HOST}"
ssh_args=(-p "${ssh_port}")
rsync_ssh_command="ssh -p ${ssh_port}"

dry_run_args=()
if [[ "${DEPLOY_DRY_RUN:-false}" == "true" ]]; then
    dry_run_args=(--dry-run --itemize-changes)
fi

if [[ "${DEPLOY_DRY_RUN:-false}" == "true" ]]; then
    echo "Dry run enabled: skipping remote directory creation."
else
    ssh "${ssh_args[@]}" "${ssh_target}" "mkdir -p \"${VPS_GAME_PATH}\""
fi

rsync -az --delete "${dry_run_args[@]}" \
    -e "${rsync_ssh_command}" \
    "${source_dir}/" \
    "${ssh_target}:${VPS_GAME_PATH}/"
