#!/bin/bash

# Namespace
NAMESPACE="kube-credential"

# Forward Issuance Frontend (port 3002)
nohup kubectl port-forward -n $NAMESPACE svc/issuance-frontend 3002:80 --address 0.0.0.0 >/dev/null 2>&1 &

# Forward Issuance Backend (port 3000)
nohup kubectl port-forward -n $NAMESPACE svc/issuance-service 3000:3000 --address 0.0.0.0 >/dev/null 2>&1 &

# Forward Verification Frontend (port 3003)
nohup kubectl port-forward -n $NAMESPACE svc/verification-frontend 3003:80 --address 0.0.0.0 >/dev/null 2>&1 &

# Forward Verification Backend (port 3001)
nohup kubectl port-forward -n $NAMESPACE svc/verification-service 3001:3001 --address 0.0.0.0 >/dev/null 2>&1 &

echo "✅ All services are port-forwarded:"
echo "Issuance Frontend: http://<EC2-IP>:3002"
echo "Issuance Backend:  http://<EC2-IP>:3000"
echo "Verification Frontend: http://<EC2-IP>:3003"
echo "Verification Backend:  http://<EC2-IP>:3001"

# Show all background jobs
jobs
