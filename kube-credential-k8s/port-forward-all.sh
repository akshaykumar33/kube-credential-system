# #!/bin/bash

# set -e

# # ==================================
# # CONFIGURATION
# # ==================================
# NAMESPACE="kube-credential"
# LOG_DIR="./port-forward-logs"
# mkdir -p "$LOG_DIR"

# declare -A POD_FORWARD_MAP=(
#   ["issuance-frontend"]="3002:80"
#   ["verification-frontend"]="3003:80"
#   ["issuance-service"]="3000:3000"
#   ["verification-service"]="3001:3001"
# )

# PORTS=(3000 3001 3002 3003)

# # ==================================
# # CLEANUP
# # ==================================
# echo "🔻 Killing existing port-forward and freeing ports..."
# pkill -f "kubectl port-forward" || true

# for PORT in "${PORTS[@]}"; do
#   sudo fuser -k "$PORT"/tcp || true
# done

# echo "🚀 Starting port-forwarding..."
# echo ""

# # ==================================
# # PORT FORWARD LOOP
# # ==================================
# for LABEL in "${!POD_FORWARD_MAP[@]}"; do
#   PORT_MAP="${POD_FORWARD_MAP[$LABEL]}"

#   POD_NAME=$(kubectl get pod -n "$NAMESPACE" -l "app=$LABEL" \
#     -o jsonpath="{.items[0].metadata.name}")

#   if [ -z "$POD_NAME" ]; then
#     echo "❌ No running pod found for label app=$LABEL"
#     continue
#   fi

#   echo "🔗 Forwarding $LABEL (pod: $POD_NAME) on $PORT_MAP"

#   # For backend services → auto reconnect infinite loop
#   if [[ "$LABEL" == "issuance-service" || "$LABEL" == "verification-service" ]]; then
#     nohup bash -c "
#       while true; do
#         echo 'Starting $LABEL port-forward...'
#         kubectl port-forward -n $NAMESPACE $POD_NAME $PORT_MAP --address=0.0.0.0
#         echo '⚠️ Port-forward crashed for $LABEL. Restarting in 2s...'
#         sleep 2
#       done
#     " > \"$LOG_DIR/$LABEL.log\" 2>&1 &
#   else
#     # For frontends → normal port-forward
#     nohup kubectl port-forward -n "$NAMESPACE" "$POD_NAME" $PORT_MAP \
#       --address=0.0.0.0 > "$LOG_DIR/$LABEL.log" 2>&1 &
#   fi

#   HOSTPORT=$(echo "$PORT_MAP" | cut -d':' -f1)
#   echo "🌐 Available: http://<EC2-IP>:$HOSTPORT"
#   echo ""
# done

# # ==================================
# # SUMMARY
# # ==================================
# echo "🎉 All port-forward tasks started!"
# echo "📂 Logs in: $LOG_DIR"
# echo "👉 tail -f $LOG_DIR/issuance-service.log"
# echo ""
# jobs

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
  echo "🧹 Cleaning old port-forward processes..."
  pkill -f "kubectl port-forward" || true
  for PORT in "${PORTS[@]}"; do
    sudo fuser -k "$PORT"/tcp || true
  done
}
cleanup

start_forward() {
  LABEL=$1
  PORT_MAP=$2
  LOG_FILE="$LOG_DIR/$LABEL.log"

  echo "🔍 Watching $LABEL → $PORT_MAP"
  
  while true; do
    POD_NAME=$(kubectl get pod -n "$NAMESPACE" -l "app=$LABEL" \
      -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)

    if [[ -z "$POD_NAME" ]]; then
      echo "❌ No pod found | $LABEL"
      sleep 5
      continue
    fi

    if ! pgrep -f "$POD_NAME.*$PORT_MAP" > /dev/null; then
      echo "⚡ Restarting port-forward for $LABEL (pod: $POD_NAME)"
      pkill -f "$PORT_MAP" || true
      nohup kubectl port-forward -n "$NAMESPACE" "$POD_NAME" $PORT_MAP \
        --address=0.0.0.0 > "$LOG_FILE" 2>&1 &
    fi
    
    sleep 3
  done
}

for LABEL in "${!POD_FORWARD_MAP[@]}"; do
  start_forward "$LABEL" "${POD_FORWARD_MAP[$LABEL]}" &
done

echo "🚀 Watchdog running. Logs inside $LOG_DIR/"
wait
