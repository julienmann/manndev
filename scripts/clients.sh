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
# The server side of every rsync runs under flock on client-files/.sync.lock,
# the same lock portal_api.py holds while it changes a password, so the two
# never interleave.
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_HOST="lmann@lionelmann.com"
REMOTE_DIR="/srv/www/manndev/client-files"
RSYNC_PATH="flock $REMOTE_DIR/.sync.lock rsync"   # util-linux flock on the server

# .changed-at is written only by the server, so push never sends or deletes it
# (pull still fetches it for the stamp check). .sync.lock is the server's lock
# file. .DS_Store is Finder litter that never belongs on the server.
PULL_OPTS=(--rsync-path="$RSYNC_PATH" --exclude /.sync.lock --exclude .DS_Store)
PUSH_OPTS=(--rsync-path="$RSYNC_PATH" --exclude /.changed-at --exclude /.sync.lock --exclude .DS_Store)

remote_stamp() {
  ssh "$REMOTE_HOST" "cat '$REMOTE_DIR/.changed-at' 2>/dev/null || true"
}

# Stops if a client changed their password on the server since the last pull.
check_stamp() {
  local local_stamp
  server_stamp=$(remote_stamp)
  local_stamp=$(cat client-files/.changed-at 2>/dev/null || true)
  if [ "$server_stamp" != "$local_stamp" ]; then
    echo "Stopped: a client changed their password on the server since your last pull."
    echo "Pushing now would undo it. Run '$0 pull', redo your edits in admin.html, then push."
    exit 1
  fi
}

case "${1:-}" in
  pull)
    mkdir -p client-files
    rsync -av --delete "${PULL_OPTS[@]}" "$REMOTE_HOST:$REMOTE_DIR/" client-files/
    echo "Pulled. Edit clients in admin.html, then run: $0 push"
    ;;
  push)
    # An empty or fresh client-files/ would mirror as "delete every client".
    clients=0
    for dir in client-files/*/; do
      if [[ $(basename "$dir") =~ ^[0-9a-f]{32}$ ]]; then clients=$((clients + 1)); fi
    done
    if [ "$clients" -eq 0 ]; then
      echo "Stopped: client-files/ has no client folders, so pushing would delete every client on the server."
      echo "Run '$0 pull' first."
      exit 1
    fi

    check_stamp

    # Show what --delete would remove before it removes anything. Missing
    # stamps on both sides look "in sync" above, so this is the real guard
    # against mirroring a stale or partial copy over the server.
    deletions=$(rsync -anv --itemize-changes --delete "${PUSH_OPTS[@]}" client-files/ "$REMOTE_HOST:$REMOTE_DIR/" \
      | sed -n -E 's/^\*?deleting +//p')
    if [ -n "$deletions" ]; then
      echo "This push will delete from the server:"
      sed 's/^/  /' <<< "$deletions"
      answer=''
      read -r -p "Type yes to continue: " answer || true
      if [ "$answer" != "yes" ]; then
        echo "Aborted. Nothing was pushed."
        exit 1
      fi
      check_stamp   # a client may have changed their password while you read the list
    fi

    rsync -av --delete "${PUSH_OPTS[@]}" client-files/ "$REMOTE_HOST:$REMOTE_DIR/"
    after_stamp=$(remote_stamp)

    # rsync -a keeps this Mac's modes (often 700/600), which nginx can't read,
    # and openrsync can't --chmod, so fix them now instead of waiting for the
    # server's cron job. Also clear any .DS_Store pushed before it was excluded.
    ssh "$REMOTE_HOST" "find '$REMOTE_DIR' -type f -name .DS_Store -delete \
      && find '$REMOTE_DIR' -type d -exec chmod 755 {} + \
      && find '$REMOTE_DIR' -type f -exec chmod 644 {} +" \
      || echo "Warning: couldn't fix permissions on the server. Its cron job will within 5 minutes." >&2

    # The lock covers the rsync itself, not the gap between the stamp check
    # and the rsync. A password change in that gap has just been reverted.
    if [ "$after_stamp" != "$server_stamp" ]; then
      echo >&2
      echo "!!! WARNING: a client changed their password while this push was running." >&2
      echo "!!! The push may have undone it: their new password may not work." >&2
      echo "!!! Server stamp is now: $after_stamp" >&2
      echo "!!! Run '$0 pull' now and push again from that copy. If a client says" >&2
      echo "!!! their new password doesn't work, use Reset password for them." >&2
      exit 1
    fi
    echo "Pushed. Permissions are fixed on the server."
    ;;
  *)
    echo "Usage: $0 pull|push" >&2
    exit 2
    ;;
esac
