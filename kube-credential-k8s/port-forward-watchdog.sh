# #!/bin/bash
# set -e

# # Prevent duplicate watchdogs
# if pgrep -f "port-forward-watchdog.sh" | grep -v $$ >/dev/null; then
#   echo "⚠️ Another watchdog already running. Exiting."
#   exit 0
# fi


# NAMESPACE="kube-credential"
# LOG_DIR="./port-forward-logs"
# mkdir -p "$LOG_DIR"

# # map: label -> local:remote
# declare -A POD_FORWARD_MAP=(
#   ["issuance-service"]="3000:3000"
#   ["verification-service"]="3001:3001"
#   ["issuance-frontend"]="3002:80"
#   ["verification-frontend"]="3003:80"
# )

# PORTS=(3000 3001 3002 3003)

# echo "🧹 Cleaning old kubectl port-forward processes..."
# pkill -f "kubectl port-forward" || true

# for PORT in "${PORTS[@]}"; do
#   sudo fuser -k "$PORT"/tcp >/dev/null 2>&1 || true
# done

# echo "🚀 Launching auto-healing port-forward watchdog service"
# echo "📂 Logs directory: $LOG_DIR"


# run_forward_loop() {
#   local LABEL="$1"
#   local PORTMAP="$2"
#   local LOG="$LOG_DIR/${LABEL}.log"
#   local WATCHLOG="$LOG_DIR/${LABEL}-watchdog.log"

#   while true; do
#     POD_NAME=$(kubectl get pod -n "$NAMESPACE" -l "app=$LABEL" -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)

#     if [[ -z "$POD_NAME" ]]; then
#       echo "$(date -Is) ❌ [$LABEL] No pod found - retrying in 5s" | tee -a "$WATCHLOG"
#       sleep 5
#       continue
#     fi

#     # if a port-forward for this exact POD and ports is already running, skip
#     if pgrep -f "kubectl port-forward -n $NAMESPACE $POD_NAME $PORTMAP" >/dev/null 2>&1; then
#       echo "$(date -Is) ℹ️ [$LABEL] port-forward already running for pod $POD_NAME" >> "$WATCHLOG"
#       sleep 3
#       continue
#     fi

#     echo "$(date -Is) 🔗 [$LABEL] Starting port-forward to pod $POD_NAME ($PORTMAP)" | tee -a "$WATCHLOG"
#     # run kubectl port-forward in the foreground; when it exits we loop and restart
#     kubectl port-forward -n "$NAMESPACE" "$POD_NAME" $PORTMAP --address=0.0.0.0 >>"$LOG" 2>&1

#     echo "$(date -Is) ⚠️ [$LABEL] port-forward exited for pod $POD_NAME. Restarting in 2s" | tee -a "$WATCHLOG"
#     sleep 2
#   done
# }

# # Start one background forward-loop per mapped label (not using bash -c with functions)
# for LABEL in "${!POD_FORWARD_MAP[@]}"; do
#   PORTMAP="${POD_FORWARD_MAP[$LABEL]}"
#   run_forward_loop "$LABEL" "$PORTMAP" &
# done

# echo "🚀 All watchdog loops launched (background)."
# wait

#!/bin/bash
set -e

# ==============================
# Kubernetes Port Forward Watchdog
# Auto-heals broken port-forward connections
# ==============================

NAMESPACE="kube-credential"
LOG_DIR="/home/ubuntu/kube-credential-system/port-forward-logs"
mkdir -p "$LOG_DIR"

# Map services to port-forward configuration local:remote
declare -A POD_FORWARD_MAP=(
  ["issuance-service"]="3000:3000"
  ["verification-service"]="3001:3001"
  ["issuance-frontend"]="3002:80"
  ["verification-frontend"]="3003:80"
)

PORTS=(3000 3001 3002 3003)

echo "🧹 Cleaning old kubectl port-forward processes..."
pkill -f "kubectl port-forward" >/dev/null 2>&1 || true

# free ports
for PORT in "${PORTS[@]}"; do
  sudo fuser -k "$PORT"/tcp >/dev/null 2>&1 || true
done

echo "🚀 Launching auto-healing port-forward watchdog"
echo "📂 Logs: $LOG_DIR"

run_forward_loop() {
  local LABEL="$1"
  local PORTMAP="$2"
  local LOG="$LOG_DIR/${LABEL}.log"
  local WATCHLOG="$LOG_DIR/${LABEL}-watchdog.log"

  while true; do
    # Find the related pod
    POD_NAME=$(kubectl get pod -n "$NAMESPACE" -l "app=$LABEL" -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)

    if [[ -z "$POD_NAME" ]]; then
      echo "$(date -Is) ❌ [$LABEL] No pod found, retrying..." | tee -a "$WATCHLOG"
      sleep 5
      continue
    fi

    # Check health by testing if local port is reachable
    LOCAL_PORT="${PORTMAP%%:*}"
    if ! nc -z 127.0.0.1 "$LOCAL_PORT"; then
      echo "$(date -Is) 🔗 [$LABEL] Starting port-forward to $POD_NAME ($PORTMAP)" | tee -a "$WATCHLOG"

      # kill any stale port-forward of same mapping
      pkill -f "kubectl port-forward -n $NAMESPACE $POD_NAME $PORTMAP" >/dev/null 2>&1 || true

      kubectl port-forward -n "$NAMESPACE" "$POD_NAME" $PORTMAP \
        --address=0.0.0.0 \
        --pod-running-timeout=5s >>"$LOG" 2>&1 || true

      echo "$(date -Is) ⚠️ [$LABEL] port-forward exited, restarting..." | tee -a "$WATCHLOG"
      sleep 2
    else
      echo "$(date -Is) ℹ️ [$LABEL] OK - port-forward healthy" >> "$WATCHLOG"
      sleep 3
    fi
  done
}

# Spawn a background watcher loop per defined service
for LABEL in "${!POD_FORWARD_MAP[@]}"; do
  PORTMAP="${POD_FORWARD_MAP[$LABEL]}"
  run_forward_loop "$LABEL" "$PORTMAP" &
done

echo "🚀 All watchdog loops launched"
wait
