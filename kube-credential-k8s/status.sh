#!/bin/bash

# Kube Credential System - Status Check Script

echo "📋 Kube Credential System - Kubernetes Status"
echo "=============================================="

# Check namespace
if kubectl get namespace kube-credential &>/dev/null; then
    echo "✅ Namespace: kube-credential exists"
else
    echo "❌ Namespace: kube-credential not found"
    echo "💡 Run './deploy.sh' to deploy the system"
    exit 1
fi

echo ""
echo "🏗️  INFRASTRUCTURE STATUS:"
echo "--------------------------"

# Check PVCs
echo "💾 Persistent Volume Claims:"
kubectl get pvc -n kube-credential 2>/dev/null || echo "   No PVCs found"

echo ""
echo "📦 DEPLOYMENTS:"
echo "---------------"
kubectl get deployments -n kube-credential -o wide 2>/dev/null || echo "   No deployments found"

echo ""
echo "📊 PODS:"
echo "--------"
kubectl get pods -n kube-credential -o wide 2>/dev/null || echo "   No pods found"

echo ""
echo "🌐 SERVICES:"
echo "------------"
kubectl get services -n kube-credential 2>/dev/null || echo "   No services found"

echo ""
echo "🔗 EXTERNAL ACCESS:"
echo "-------------------"

# Check ingress
if kubectl get ingress -n kube-credential &>/dev/null; then
    echo "🔗 Ingress Rules:"
    kubectl get ingress -n kube-credential 2>/dev/null
    echo ""
    echo "📝 To use Ingress, add to /etc/hosts:"
    echo "   <CLUSTER-IP> issuance.kube-credential.local"
    echo "   <CLUSTER-IP> verification.kube-credential.local"
else
    echo "⚠️  No Ingress configured"
fi

# Check NodePort services  
nodeport_services=$(kubectl get service -n kube-credential -o jsonpath='{.items[?(@.spec.type=="NodePort")].metadata.name}' 2>/dev/null)
if [ -n "$nodeport_services" ]; then
    echo ""
    echo "🔗 NodePort Services:"
    kubectl get service -n kube-credential -o wide | grep NodePort
    echo ""
    echo "🌐 Access via NodePort (replace <NODE-IP>):"
    echo "   Issuance Service: http://<NODE-IP>:30000"
    echo "   Verification Service: http://<NODE-IP>:30001" 
    echo "   Issuance Frontend: http://<NODE-IP>:30002"
    echo "   Verification Frontend: http://<NODE-IP>:30003"
else
    echo "⚠️  No NodePort services configured"
fi

echo ""
echo "🔧 RESOURCE USAGE:"
echo "------------------"
kubectl top pods -n kube-credential 2>/dev/null || echo "⚠️  Metrics not available (install metrics-server for resource usage)"

echo ""
echo "📋 RECENT EVENTS:"
echo "-----------------"
kubectl get events -n kube-credential --sort-by='.lastTimestamp' 2>/dev/null | tail -10 || echo "   No recent events"

echo ""
echo "⚡ QUICK ACCESS COMMANDS:"
echo "------------------------"
echo "   Port forward issuance:    kubectl port-forward --address 0.0.0.0 service/issuance-service 3000:3000 -n kube-credential"
echo "   Port forward verification: kubectl port-forward --address 0.0.0.0 service/verification-service 3001:3001 -n kube-credential"
echo "   View issuance logs:        kubectl logs -f deployment/issuance-service -n kube-credential"
echo "   View verification logs:    kubectl logs -f deployment/verification-service -n kube-credential"
echo "   Scale issuance service:    kubectl scale deployment/issuance-service --replicas=3 -n kube-credential"
echo "   Interactive pod shell:     kubectl exec -it deployment/issuance-service -n kube-credential -- sh"

echo ""
echo "🎯 HEALTH CHECK ENDPOINTS:"
echo "--------------------------"
echo "   Issuance Health:      kubectl port-forward service/issuance-service 3000:3000 -n kube-credential"
echo "                         curl http://localhost:3000/health"
echo "   Verification Health:  kubectl port-forward service/verification-service 3001:3001 -n kube-credential"
echo "                         curl http://localhost:3001/health"
