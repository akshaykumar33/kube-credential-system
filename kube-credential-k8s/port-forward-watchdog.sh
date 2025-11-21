#!/bin/bash
set -e

NAMESPACE="kube-credential"
LOG_DIR="./port-forward-logs"
mkdir -p "$LOG_DIR"

declare -A POD_FORWARD_MAP=(
  ["issuance-service"]="3000:3000"
  ["verification-service"]="3001:3001"
  ["issuance-frontend"]="3002:80"
  ["verification-frontend"]="3003:80"
)

PORTS=(3000 3001 3002 3003)

cleanup() {
  echo "🧹 Cleaning old kubectl port-forward processes..."
  pkill -f "kubectl port-forward" || true

  for PORT in "${PORTS[@]}"; do
    sudo fuser -k "$PORT"/tcp || true
  done
}

cleanup

watch_and_forward() {
  LABEL=$1
  PORT_MAP=$2
  LOG_FILE="$LOG_DIR/$LABEL.log"

  while true; do
    POD_NAME=$(kubectl get pod -n "$NAMESPACE" -l "app=$LABEL" \
      -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)

    if [[ -z "$POD_NAME" ]]; then
      echo "❌ [$LABEL] Pod not ready. Retrying..."
      sleep 3
      continue
    fi

    echo "🔗 [$LABEL] Forwarding pod $POD_NAME on $PORT_MAP"

    # Start PF – exits on crash or pod deletion
    kubectl port-forward -n "$NAMESPACE" "$POD_NAME" $PORT_MAP \
      --address=0.0.0.0 > "$LOG_FILE" 2>&1

    echo "⚠️ [$LABEL] Port-forward stopped. Restarting in 2s..."
    sleep 2
  done
}

for LABEL in "${!POD_FORWARD_MAP[@]}"; do
  nohup bash -c "watch_and_forward \"$LABEL\" \"${POD_FORWARD_MAP[$LABEL]}\"" \
    > "$LOG_DIR/$LABEL-watchdog.log" 2>&1 &
done

echo "🚀 Auto-healing port-forwarding started"
echo "📂 Logs: $LOG_DIR/"
echo "👉 tail -f $LOG_DIR/issuance-service.log"
wait
