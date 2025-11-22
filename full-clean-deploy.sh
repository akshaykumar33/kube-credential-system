#!/bin/bash
set -e

echo "=============================================="
echo "🧹 Starting system cleanup and watchdog reset"
echo "=============================================="

# Base directory
BASE_DIR="$HOME/kube-credential-system"
K8S_DIR="$BASE_DIR/kube-credential-k8s"

# 1️⃣ Clean APT cache
echo "📦 Cleaning APT cache..."
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y

# 2️⃣ Stop and disable watchdog systemd service
SERVICE_NAME="kube-port-forward"
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "🛑 Stopping $SERVICE_NAME..."
    sudo systemctl stop "$SERVICE_NAME"
fi
if systemctl is-enabled --quiet "$SERVICE_NAME"; then
    echo "🚫 Disabling $SERVICE_NAME..."
    sudo systemctl disable "$SERVICE_NAME"
fi
if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
    echo "🗑️ Removing systemd service file..."
    sudo rm -f "/etc/systemd/system/$SERVICE_NAME.service"
fi
sudo systemctl daemon-reload

# 3️⃣ Clear logs
echo "🗑️ Truncating logs..."
sudo truncate -s 0 /var/log/*.log || true
sudo truncate -s 0 /var/log/syslog || true
sudo truncate -s 0 /var/log/kern.log || true
sudo truncate -s 0 /var/log/auth.log || true
sudo truncate -s 0 /var/log/kube-port-forward.log || true
sudo truncate -s 0 /var/log/kube-port-forward.err || true
sudo truncate -s 0 /var/log/sysstat/* || true
sudo journalctl --vacuum-size=50M || true

# 4️⃣ Remove old backups and port-forward logs
echo "🗑️ Removing old backups and port-forward logs..."
rm -rf "$BASE_DIR/.old-backups"
rm -rf "$K8S_DIR/port-forward-logs"

# 5️⃣ Remove previous deploy log
DEPLOY_LOG="$BASE_DIR/full-clean-deploy.log"
if [ -f "$DEPLOY_LOG" ]; then
    echo "🗑️ Removing old deploy log..."
    rm -f "$DEPLOY_LOG"
else
    echo "❌ $DEPLOY_LOG not found!"
fi

echo ""
echo "=============================================="
echo "🚀 Running deployment process"
echo "=============================================="

DEPLOY_SCRIPT="$K8S_DIR/deploy.sh"
if [ -f "$DEPLOY_SCRIPT" ]; then
    chmod +x "$DEPLOY_SCRIPT"
    "$DEPLOY_SCRIPT"
else
    echo "❌ deploy.sh not found at $DEPLOY_SCRIPT!"
    exit 1
fi

echo ""
echo "=============================================="
echo "🔄 Setting up watchdog systemd service"
echo "=============================================="

WATCHDOG_SETUP="$BASE_DIR/setup-watchdog-systemd.sh"
if [ -f "$WATCHDOG_SETUP" ]; then
    chmod +x "$WATCHDOG_SETUP"
    "$WATCHDOG_SETUP"
else
    echo "❌ setup-watchdog-systemd.sh not found at $WATCHDOG_SETUP!"
    exit 1
fi

echo ""
echo "=============================================="
echo "🎉 Cleanup + Deploy + Watchdog restart complete"
echo "=============================================="
