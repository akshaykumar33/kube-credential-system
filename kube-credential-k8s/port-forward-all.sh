#!/bin/bash

# Namespace
NAMESPACE="kube-credential"

# Log directory
LOG_DIR="./port-forward-logs"
mkdir -p $LOG_DIR

echo "🚀 Starting port-forwarding for all services (replicas = 1)..."

# --- FRONTENDS (ClusterIP service, stable because 1 replica) ---
# Issuance Frontend
nohup kubectl port-forward -n $NAMESPACE svc/issuance-frontend 3002:80 --address 0.0.0.0 > $LOG_DIR/issuance-frontend.log 2>&1 &
echo "Issuance Frontend: http://<EC2-IP>:3002"

# Verification Frontend
nohup kubectl port-forward -n $NAMESPACE svc/verification-frontend 3003:80 --address 0.0.0.0 > $LOG_DIR/verification-frontend.log 2>&1 &
echo "Verification Frontend: http://<EC2-IP>:3003"

# --- BACKENDS (ClusterIP service, stable because 1 replica) ---
# Issuance Backend
nohup kubectl port-forward -n $NAMESPACE svc/issuance-service 3000:3000 --address 0.0.0.0 > $LOG_DIR/issuance-backend.log 2>&1 &
echo "Issuance Backend:  http://<EC2-IP>:3000"

# Verification Backend
nohup kubectl port-forward -n $NAMESPACE svc/verification-service 3001:3001 --address 0.0.0.0 > $LOG_DIR/verification-backend.log 2>&1 &
echo "Verification Backend:  http://<EC2-IP>:3001"

echo "✅ All services are port-forwarded and running in background."
echo "Logs are available in $LOG_DIR"
echo "example to check error logs: tail -f ./port-forward-logs/issuance-frontend.log"

# Show running jobs
jobs
