#!/bin/bash
set -e

NAMESPACE="kube-credential"
LOG_DIR="./port-forward-logs"
mkdir -p "$LOG_DIR"

# map: label -> local:remote
declare -A POD_FORWARD_MAP=(
  ["issuance-service"]="3000:3000"
  ["verification-service"]="3001:3001"
  ["issuance-frontend"]="3002:80"
  ["verification-frontend"]="3003:80"
)

PORTS=(3000 3001 3002 3003)

echo "🧹 Cleaning old kubectl port-forward processes..."
pkill -f "kubectl port-forward" || true

for PORT in "${PORTS[@]}"; do
  sudo fuser -k "$PORT"/tcp >/dev/null 2>&1 || true
done

echo "🚀 Starting single-process auto-healing port-forward watchdog"
echo "📂 Logs: $LOG_DIR"

run_forward_loop() {
  local LABEL="$1"
  local PORTMAP="$2"
  local LOG="$LOG_DIR/${LABEL}.log"
  local WATCHLOG="$LOG_DIR/${LABEL}-watchdog.log"

  while true; do
    POD_NAME=$(kubectl get pod -n "$NAMESPACE" -l "app=$LABEL" -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)

    if [[ -z "$POD_NAME" ]]; then
      echo "$(date -Is) ❌ [$LABEL] No pod found - retrying in 5s" | tee -a "$WATCHLOG"
      sleep 5
      continue
    fi

    # if a port-forward for this exact POD and ports is already running, skip
    if pgrep -f "kubectl port-forward -n $NAMESPACE $POD_NAME $PORTMAP" >/dev/null 2>&1; then
      echo "$(date -Is) ℹ️ [$LABEL] port-forward already running for pod $POD_NAME" >> "$WATCHLOG"
      sleep 3
      continue
    fi

    echo "$(date -Is) 🔗 [$LABEL] Starting port-forward to pod $POD_NAME ($PORTMAP)" | tee -a "$WATCHLOG"
    # run kubectl port-forward in the foreground; when it exits we loop and restart
    kubectl port-forward -n "$NAMESPACE" "$POD_NAME" $PORTMAP --address=0.0.0.0 >>"$LOG" 2>&1

    echo "$(date -Is) ⚠️ [$LABEL] port-forward exited for pod $POD_NAME. Restarting in 2s" | tee -a "$WATCHLOG"
    sleep 2
  done
}

# Start one background forward-loop per mapped label (not using bash -c with functions)
for LABEL in "${!POD_FORWARD_MAP[@]}"; do
  PORTMAP="${POD_FORWARD_MAP[$LABEL]}"
  run_forward_loop "$LABEL" "$PORTMAP" &
done

echo "🚀 All watchdog loops launched (background)."
wait
