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
# Step 2: Port forwarding all services
# -------------------------------------------------------
echo ""
echo "🔗 Starting port-forwarding of all services..."

if [ -f "$SCRIPT_DIR/port-forward-all.sh" ]; then
    chmod +x "$SCRIPT_DIR/port-forward-all.sh"
    "$SCRIPT_DIR/port-forward-all.sh"
else
    echo "❌ port-forward-all.sh missing!"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌍 Access URLs:"
echo "   http://<EC2-IP>:3000  (Issuance Backend)"
echo "   http://<EC2-IP>:3001  (Verification Backend)"
echo "   http://<EC2-IP>:3002  (Issuance Frontend)"
echo "   http://<EC2-IP>:3003  (Verification Frontend)"
echo ""
echo "📌 Logs:"
echo "   tail -f port-forward-logs/issuance-service.log"
echo ""
echo "============================================"
echo "🚀 System ready!"
