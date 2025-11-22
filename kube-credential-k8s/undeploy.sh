#!/bin/bash

# Kube Credential System - Kubernetes Cleanup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/k8s"

echo "🧹 Removing Kube Credential System from Kubernetes..."
echo "===================================================="

# Delete external access first
echo "🗑️  Removing external access configurations..."
kubectl delete -f "$K8S_DIR/ingress.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/services-nodeport.yaml" --ignore-not-found=true

# Delete applications
echo "🗑️  Removing frontend applications..."
kubectl delete -f "$K8S_DIR/issuance-frontend.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/verification-frontend.yaml" --ignore-not-found=true

echo "🗑️  Removing backend services..."
kubectl delete -f "$K8S_DIR/issuance.yaml" --ignore-not-found=true
kubectl delete -f "$K8S_DIR/verification.yaml" --ignore-not-found=true

echo "🗑️  Removing Redis..."
kubectl delete -f "$K8S_DIR/redis.yaml" --ignore-not-found=true

echo "🗑️  Removing configuration..."
kubectl delete -f "$K8S_DIR/configmap.yaml" --ignore-not-found=true

echo ""
echo "⚠️  WARNING: The next step will delete all persistent data!"
echo "This includes all SQLite databases and Redis data."
echo "This action cannot be undone!"
echo ""
read -p "Do you want to delete persistent data? [y/N]: " delete_data

case $delete_data in
    [Yy]* )
        echo "🗑️  Removing persistent volume claims and data..."
        kubectl delete -f "$K8S_DIR/pvc-redis.yaml" --ignore-not-found=true
        kubectl delete -f "$K8S_DIR/pvc-issuance.yaml" --ignore-not-found=true
        kubectl delete -f "$K8S_DIR/pvc-verification.yaml" --ignore-not-found=true
        echo "💥 All persistent data deleted!"
        ;;
    * )
        echo "✅ Persistent data preserved"
        echo "📝 PVCs still exist and can be reused on next deployment"
        ;;
esac

echo "🗑️  Removing namespace..."
kubectl delete -f "$K8S_DIR/namespace.yaml" --ignore-not-found=true

echo ""
echo "✅ Cleanup completed!"
echo "📋 Checking for remaining resources..."
kubectl get all -n kube-credential 2>/dev/null || echo "   🎉 Namespace removed completely"

echo ""
echo "🧹 Kube Credential System successfully removed from Kubernetes!"
