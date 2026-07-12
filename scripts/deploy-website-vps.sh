#!/usr/bin/env bash
set -euo pipefail

required_vars=(VPS_HOST VPS_USERNAME VPS_WEBSITE_PATH)
for var_name in "${required_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
        echo "Missing required environment variable: ${var_name}" >&2
        exit 1
    fi
done

source_dir="packages/website/out"
if [[ ! -d "${source_dir}" ]]; then
    echo "Website artifact directory does not exist: ${source_dir}" >&2
    echo "Run pnpm build:website before deploying." >&2
    exit 1
fi

ssh_port="${VPS_SSH_PORT:-22}"
ssh_target="${VPS_USERNAME}@${VPS_HOST}"
ssh_args=(-p "${ssh_port}")
rsync_ssh_command="ssh -p ${ssh_port}"

release_id="${GITHUB_SHA:-$(date -u +%Y%m%d-%H%M%S)}"
base_path="${VPS_WEBSITE_PATH}"
release_dir="${base_path}/releases/${release_id}"

dry_run_args=()
if [[ "${DEPLOY_DRY_RUN:-false}" == "true" ]]; then
    dry_run_args=(--dry-run --itemize-changes)
    echo "Dry run enabled: no changes will be made to the VPS."
else
    echo "Deploying release ${release_id} to ${base_path}"
fi

if [[ "${DEPLOY_DRY_RUN:-false}" != "true" ]]; then
    ssh "${ssh_args[@]}" "${ssh_target}" "mkdir -p \"${release_dir}\""
fi

rsync -azh --delete --delay-updates --info=progress2 "${dry_run_args[@]}" \
    -e "${rsync_ssh_command}" \
    "${source_dir}/" \
    "${ssh_target}:${release_dir}/"

if [[ "${DEPLOY_DRY_RUN:-false}" == "true" ]]; then
    echo "Dry run completed. Would have deployed to ${release_dir}"
    exit 0
fi

ssh "${ssh_args[@]}" "${ssh_target}" bash -s "${base_path}" "${release_id}" << 'ENDSSH'
set -euo pipefail
base_path="$1"
release_id="$2"

current_link="${base_path}/current"
previous_link="${base_path}/previous"
release_dir="${base_path}/releases/${release_id}"

if [ -L "${current_link}" ] && [ -e "${current_link}" ]; then
    current_target=$(readlink "${current_link}")
    ln -sfn "${current_target}" "${previous_link}" 2>/dev/null || true
fi

ln -sfn "releases/${release_id}" "${base_path}/.current_new"
mv -Tf "${base_path}/.current_new" "${current_link}"

if [[ "$(readlink "${current_link}")" != "releases/${release_id}" ]]; then
    echo "Failed to activate release ${release_id}" >&2
    exit 1
fi

echo "Deployment complete. Current release: ${release_id}"

keep_count="${RELEASE_KEEP_COUNT:-5}"
ls -1dt "${base_path}/releases/"*/ 2>/dev/null | tail -n +$((keep_count + 1)) | xargs -r rm -rf
ENDSSH
