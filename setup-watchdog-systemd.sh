#!/bin/bash
set -e

echo "=============================================="
echo "🔧 Installing Port-Forward Watchdog as systemd"
echo "=============================================="

SERVICE_NAME="kube-port-forward"
SCRIPT_PATH="/home/ubuntu/kube-credential-system/kube-credential-k8s/port-forward-watchdog.sh"

# Ensure script exists
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "❌ ERROR: watchdog script not found at: $SCRIPT_PATH"
  exit 1
fi

# Create systemd service
sudo bash -c "cat >/etc/systemd/system/$SERVICE_NAME.service" <<EOF
[Unit]
Description=Kubernetes Port Forward Watchdog
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/kube-credential-system/kube-credential-k8s
ExecStart=/bin/bash $SCRIPT_PATH
Restart=always
RestartSec=3
StandardOutput=append:/var/log/$SERVICE_NAME.log
StandardError=append:/var/log/$SERVICE_NAME.err

[Install]
WantedBy=multi-user.target
EOF

echo "📦 Reloading systemd..."
sudo systemctl daemon-reload

echo "🚀 Starting service..."
sudo systemctl start $SERVICE_NAME.service

echo "📌 Enabling service to start on reboot..."
sudo systemctl enable $SERVICE_NAME.service

echo "=============================================="
echo "✅ Watchdog is now managed by systemd"
echo "=============================================="
echo "🔍 Status: sudo systemctl status $SERVICE_NAME"
echo "📜 Logs:   sudo journalctl -fu $SERVICE_NAME"
echo "🔄 Restart manually: sudo systemctl restart $SERVICE_NAME"