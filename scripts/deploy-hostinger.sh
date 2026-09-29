#!/usr/bin/env bash
# =============================================================================
# Tusko — Orkestrasi deploy backend ke Hostinger (dijalankan di GitHub Runner)
# =============================================================================
# Variabel diisi oleh `.github/workflows/deploy-hostinger.yml`:
#   SSH_HOST, SSH_PORT, SSH_USER, DEPLOY_PATH, SSH_KEY (opsional), SSH_PASSWORD.
#
# Alur: rsync kode backend -> server, lalu jalankan `deploy/hostinger-deploy.sh`
# (composer install, migrate, seed referensi) melalui SSH.
# =============================================================================
set -euo pipefail

: "${SSH_HOST:?Variabel HOSTINGER_SSH_HOST belum diset}"
: "${SSH_PORT:?Variabel HOSTINGER_SSH_PORT belum diset}"
: "${SSH_USER:?Variabel HOSTINGER_SSH_USER belum diset}"
: "${DEPLOY_PATH:?Variabel HOSTINGER_DEPLOY_PATH belum diset}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_ROOT/backend"
REMOTE="$SSH_USER@$SSH_HOST"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

SSH_OPTS="-p $SSH_PORT -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$HOME/.ssh/known_hosts"

if [ -n "${SSH_KEY:-}" ]; then
    KEY_FILE="$HOME/.ssh/hostinger_deploy"
    printf '%s\n' "$SSH_KEY" > "$KEY_FILE"
    chmod 600 "$KEY_FILE"
    SSH_CMD="ssh -i $KEY_FILE $SSH_OPTS"
else
    : "${SSH_PASSWORD:?Isi secret HOSTINGER_SSH_PASSWORD atau HOSTINGER_SSH_KEY}"
    if ! command -v sshpass >/dev/null 2>&1; then
        sudo apt-get update -qq
        sudo apt-get install -y -qq sshpass
    fi
    export SSHPASS="$SSH_PASSWORD"
    SSH_CMD="sshpass -e ssh $SSH_OPTS"
fi

echo "==> Sinkronisasi berkas backend -> $REMOTE:$DEPLOY_PATH"
# `--delete` menghapus berkas lama di server; `--exclude` melindungi .env,
# vendor, storage, dan berkas runtime agar tidak terhapus.
rsync -az --delete \
    -e "$SSH_CMD" \
    --exclude='.git/' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='vendor/' \
    --exclude='node_modules/' \
    --exclude='storage/' \
    --exclude='database/*.sqlite' \
    --exclude='database/*.sqlite3' \
    --exclude='tests/' \
    --exclude='.phpunit.result.cache' \
    --exclude='public/storage' \
    --exclude='*.log' \
    "$SRC_DIR/" "$REMOTE:$DEPLOY_PATH/"

# `.htaccess` root project -> root domain (`public_html/.htaccess`), yaitu
# direktori induk dari DEPLOY_PATH (mis. `.../public_html/backend`).
WEB_ROOT="$(dirname "$DEPLOY_PATH")"
if [ -f "$REPO_ROOT/.htaccess" ]; then
    echo "==> Sinkronisasi .htaccess root -> $REMOTE:$WEB_ROOT/.htaccess"
    rsync -az -e "$SSH_CMD" "$REPO_ROOT/.htaccess" "$REMOTE:$WEB_ROOT/.htaccess"
fi

echo "==> Menjalankan composer install + migrate + seed di server"
$SSH_CMD "$REMOTE" "cd '$DEPLOY_PATH' && bash deploy/hostinger-deploy.sh"

echo "==> Deploy backend selesai."
