#!/bin/bash
# deploy.sh
# Full automatic deployment with NodePort + Port Forwarding
# Location: kube-credential-system/kube-credential-k8s

set -e

# Resolve script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NAMESPACE="kube-credential"

echo "🚀 Starting automated deployment process..."
echo "============================================"

# -------------------------------------------------------
# Step 0: Check Namespace and clean only if exists
# -------------------------------------------------------
if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo "🧹 Namespace exists — Starting cleanup using undeploy.sh"

    if [ -f "$SCRIPT_DIR/undeploy.sh" ]; then
        chmod +x "$SCRIPT_DIR/undeploy.sh"
        echo "y" | "$SCRIPT_DIR/undeploy.sh"   # auto-confirm deletion
    else
        echo "❌ undeploy.sh not found in $SCRIPT_DIR"
    fi
else
    echo "ℹ️ Namespace $NAMESPACE does not exist — skipping cleanup"
fi

echo ""
echo "⚙️ Deploying new infrastructure and services (NodePort mode)"

# -------------------------------------------------------
# Step 1: Run initial-setup (force NodePort)
# -------------------------------------------------------
if [ -f "$SCRIPT_DIR/initial-setup.sh" ]; then
    chmod +x "$SCRIPT_DIR/initial-setup.sh"
    echo "N" | "$SCRIPT_DIR/initial-setup.sh"     # answer 'N' to choose NodePort
else
    echo "❌ initial-setup.sh missing!"
    exit 1
fi
# -------------------------------------------------------
# Step 2: Start WATCHDOG (single manager for port-forwards)
# -------------------------------------------------------
echo ""
echo "🛡️ Starting port-forward watchdog service..."

if [ -f "$SCRIPT_DIR/port-forward-watchdog.sh" ]; then
    chmod +x "$SCRIPT_DIR/port-forward-watchdog.sh"

    # NEW: kill already-running watchdog
    if pgrep -f "port-forward-watchdog.sh" >/dev/null 2>&1; then
        echo "🛑 Stopping old watchdog process..."
        pkill -f "port-forward-watchdog.sh" || true
    fi

    mkdir -p "$SCRIPT_DIR/port-forward-logs"

    echo "▶ Launching new watchdog..."
    nohup "$SCRIPT_DIR/port-forward-watchdog.sh" > "$SCRIPT_DIR/port-forward-logs/watchdog.out" 2>&1 &
    echo "🔍 Watchdog running in background (auto restart on failure)"
else
    echo "❌ port-forward-watchdog.sh missing!"
fi
