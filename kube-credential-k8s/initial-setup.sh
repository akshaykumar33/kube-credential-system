#!/bin/bash

# INITIAL SETUP for Kube Credential System
# Creates namespace, PVCs, ConfigMap, Redis, and backend/frontends.
# NO ingress, NO nodeport, NO hosts setup, NO prompts.
# Created by Akshaykumar Patil

set -e

echo "🚀 Running initial Kubernetes setup..."
echo "======================================="

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not installed!"
    exit 1
fi

# Check cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster not reachable!"
    exit 1
fi

echo "✅ kubectl + Cluster verified"
echo ""

# Namespace
echo "📂 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# PVCs
echo "💾 Creating Persistent Volume Claims..."
kubectl apply -f k8s/pvc-redis.yaml
kubectl apply -f k8s/pvc-issuance.yaml
kubectl apply -f k8s/pvc-verification.yaml

# ConfigMap
echo "📝 Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml

# Redis
echo "🗄️ Deploying Redis..."
kubectl apply -f k8s/redis.yaml
kubectl wait --for=condition=available --timeout=300s deployment/redis -n kube-credential

# Backend Services
echo "🏢 Deploying Issuance Service..."
kubectl apply -f k8s/issuance.yaml

echo "🔍 Deploying Verification Service..."
kubectl apply -f k8s/verification.yaml

kubectl wait --for=condition=available --timeout=300s deployment/issuance-service -n kube-credential
kubectl wait --for=condition=available --timeout=300s deployment/verification-service -n kube-credential

# Frontends
echo "🌐 Deploying Frontends..."
kubectl apply -f k8s/issuance-frontend.yaml
kubectl apply -f k8s/verification-frontend.yaml

kubectl wait --for=condition=available --timeout=300s deployment/issuance-frontend -n kube-credential
kubectl wait --for=condition=available --timeout=300s deployment/verification-frontend -n kube-credential

echo ""
echo "🎉 Initial setup complete!"
echo "=================================="
kubectl get pods -n kube-credential -o wide
kubectl get svc -n kube-credential
