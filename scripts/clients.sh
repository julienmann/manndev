#!/usr/bin/env bash
# Sync client-files/ between this Mac and the server.
#
#   ./scripts/clients.sh pull   server -> local (do this before editing clients)
#   ./scripts/clients.sh push   local -> server (after editing in admin.html)
#
# Both directions mirror exactly (--delete). Clients can change their own
# password on the server, which rewrites files there and stamps
# client-files/.changed-at; push refuses to run if the server's stamp differs
# from the one you last pulled, so a stale local copy can't undo their change.
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_HOST="lmann@lionelmann.com"
REMOTE_DIR="/srv/www/manndev/client-files"

case "${1:-}" in
  pull)
    mkdir -p client-files
    rsync -av --delete "$REMOTE_HOST:$REMOTE_DIR/" client-files/
    echo "Pulled. Edit clients in admin.html, then run: $0 push"
    ;;
  push)
    remote_stamp=$(ssh "$REMOTE_HOST" "cat '$REMOTE_DIR/.changed-at' 2>/dev/null || true")
    local_stamp=$(cat client-files/.changed-at 2>/dev/null || true)
    if [ "$remote_stamp" != "$local_stamp" ]; then
      echo "Stopped: a client changed their password on the server since your last pull."
      echo "Pushing now would undo it. Run '$0 pull', redo your edits in admin.html, then push."
      exit 1
    fi
    rsync -av --delete client-files/ "$REMOTE_HOST:$REMOTE_DIR/"
    echo "Pushed. (Permissions are fixed on the server by cron within 5 minutes.)"
    ;;
  *)
    echo "Usage: $0 pull|push" >&2
    exit 2
    ;;
esac
