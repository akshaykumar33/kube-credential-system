# #!/bin/bash

# # INITIAL SETUP for Kube Credential System
# # Creates namespace, PVCs, ConfigMap, Redis, and backend/frontends.
# # NO ingress, NO nodeport, NO hosts setup, NO prompts.
# # Created by Akshaykumar Patil

# set -e

# echo "🚀 Running initial Kubernetes setup..."
# echo "======================================="

# # Check kubectl
# if ! command -v kubectl &> /dev/null; then
#     echo "❌ kubectl not installed!"
#     exit 1
# fi

# # Check cluster
# if ! kubectl cluster-info &> /dev/null; then
#     echo "❌ Kubernetes cluster not reachable!"
#     exit 1
# fi

# echo "✅ kubectl + Cluster verified"
# echo ""

# # Namespace
# echo "📂 Creating namespace..."
# kubectl apply -f k8s/namespace.yaml

# # PVCs
# echo "💾 Creating Persistent Volume Claims..."
# kubectl apply -f k8s/pvc-redis.yaml
# kubectl apply -f k8s/pvc-issuance.yaml
# kubectl apply -f k8s/pvc-verification.yaml

# # ConfigMap
# echo "📝 Creating ConfigMap..."
# kubectl apply -f k8s/configmap.yaml

# # Redis
# echo "🗄️ Deploying Redis..."
# kubectl apply -f k8s/redis.yaml
# kubectl wait --for=condition=available --timeout=300s deployment/redis -n kube-credential

# # Backend Services
# echo "🏢 Deploying Issuance Service..."
# kubectl apply -f k8s/issuance.yaml

# echo "🔍 Deploying Verification Service..."
# kubectl apply -f k8s/verification.yaml

# kubectl wait --for=condition=available --timeout=300s deployment/issuance-service -n kube-credential
# kubectl wait --for=condition=available --timeout=300s deployment/verification-service -n kube-credential

# # Frontends
# echo "🌐 Deploying Frontends..."
# kubectl apply -f k8s/issuance-frontend.yaml
# kubectl apply -f k8s/verification-frontend.yaml

# kubectl wait --for=condition=available --timeout=300s deployment/issuance-frontend -n kube-credential
# kubectl wait --for=condition=available --timeout=300s deployment/verification-frontend -n kube-credential

# echo ""
# echo "🎉 Initial setup complete!"
# echo "=================================="
# kubectl get pods -n kube-credential -o wide
# kubectl get svc -n kube-credential
#!/bin/bash

# Kube Credential System Deployment Script with Ingress & Host Setup
# Created by Akshaykumar Patil

set -e

echo "🚀 Deploying Kube Credential System to Kubernetes..."
echo "=================================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ kubectl and cluster connection verified"
echo ""

# Apply core manifests in order
echo "📋 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo "💾 Creating persistent volume claims..."
kubectl apply -f k8s/pvc-redis.yaml
kubectl apply -f k8s/pvc-issuance.yaml
kubectl apply -f k8s/pvc-verification.yaml

echo "📦 Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml

# Deploy Redis
echo "🗄️ Deploying Redis..."
kubectl apply -f k8s/redis.yaml

echo "⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=available --timeout=500s deployment/redis -n kube-credential

# Deploy Backend Services
echo "🏢 Deploying Issuance Service..."
kubectl apply -f k8s/issuance.yaml

echo "🔍 Deploying Verification Service..."
kubectl apply -f k8s/verification.yaml

echo "⏳ Waiting for backend services to be ready..."
kubectl wait --for=condition=available --timeout=500s deployment/issuance-service -n kube-credential
kubectl wait --for=condition=available --timeout=500s deployment/verification-service -n kube-credential

# Deploy Frontends
echo "🌐 Deploying Frontend Applications..."
kubectl apply -f k8s/issuance-frontend.yaml
kubectl apply -f k8s/verification-frontend.yaml

echo "⏳ Waiting for frontends to be ready..."
kubectl wait --for=condition=available --timeout=500s deployment/issuance-frontend -n kube-credential
kubectl wait --for=condition=available --timeout=500s deployment/verification-frontend -n kube-credential

# Setup external access
echo ""
echo "🌐 Setting up external access..."
echo "Choose your preferred access method:"
echo "  [I] Ingress (requires ingress controller)"
echo "  [N] NodePort (works on any cluster)"
echo "  [S] Skip (cluster-internal only)"
read -p "Enter your choice [I/N/S]: " access_type

case $access_type in
    [Ii]* )
        echo "Checking for existing ingress controller installation..."
        installed=$(kubectl get pods -n ingress-nginx 2>/dev/null | grep -c 'nginx')
        if [ "$installed" -eq 0 ]; then
            echo "Ingress controller not found. Installing nginx ingress controller..."
            kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.7.0/deploy/static/provider/cloud/deploy.yaml
        else
            echo "Ingress controller already installed."
        fi

        echo "Waiting for ingress controller to become ready..."
        kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=500s

        # Apply your ingress resource
        kubectl apply -f k8s/ingress.yaml

        echo ""
        echo "✅ Ingress deployed!"

        # Add hosts entries block
        CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
        echo ""
        echo "------------------------------------------------------------------------"
        echo "📝 Add the following entries to your hosts file (/etc/hosts or equivalent):"
        echo ""
        echo "$CLUSTER_IP issuance.kube-credential.local"
        echo "$CLUSTER_IP verification.kube-credential.local"
        echo "$CLUSTER_IP api.kube-credential.local"
        echo "------------------------------------------------------------------------"
        echo ""

        if [[ "$OSTYPE" == "linux-gnu"* || "$OSTYPE" == "darwin"* ]]; then
            read -p "Would you like to append these entries to your /etc/hosts now? (requires sudo) [y/N]: " append_hosts
            if [[ $append_hosts =~ ^[Yy]$ ]]; then
                sudo sh -c "grep -q 'issuance.kube-credential.local' /etc/hosts || echo '$CLUSTER_IP issuance.kube-credential.local verification.kube-credential.local api.kube-credential.local' >> /etc/hosts"
                echo "✅ Entries appended to /etc/hosts"
            else
                echo "⚠️ Skipped adding to /etc/hosts. Please add manually."
            fi
        elif [[ "$OSTYPE" == "msys" ]]; then
            echo "⚠️ On Windows, please add the following lines to C:\\Windows\\System32\\drivers\\etc\\hosts file manually:"
            echo "$CLUSTER_IP issuance.kube-credential.local"
            echo "$CLUSTER_IP verification.kube-credential.local"
            echo "$CLUSTER_IP api.kube-credential.local"
        else
            echo "⚠️ Please add the following to your hosts file manually:"
            echo "$CLUSTER_IP issuance.kube-credential.local"
            echo "$CLUSTER_IP verification.kube-credential.local"
            echo "$CLUSTER_IP api.kube-credential.local"
        fi

        echo ""
        echo "🌐 Access URLs:"
        echo "   http://issuance.kube-credential.local"
        echo "   http://verification.kube-credential.local"
        echo "   http://api.kube-credential.local"
        ;;

    [Nn]* )
        echo "Deploying NodePort services..."
        kubectl apply -f k8s/services-nodeport.yaml
        echo ""
        echo "✅ NodePort services deployed."
        echo "Access URLs (replace <NODE-IP> with your cluster node IP):"
        echo "  http://<NODE-IP>:30000 (Issuance Service)"
        echo "  http://<NODE-IP>:30001 (Verification Service)"
        echo "  http://<NODE-IP>:30002 (Issuance Frontend)"
        echo "  http://<NODE-IP>:30003 (Verification Frontend)"
        ;;

    [Ss]* )
        echo "Skipping external access. Services are only accessible inside the cluster."
        echo "You can connect via port forwarding:"
        echo "  kubectl port-forward service/issuance-service 3000:3000 -n kube-credential"
        echo "  kubectl port-forward service/verification-service 3001:3001 -n kube-credential"
        ;;

    * )
        echo "Invalid choice, skipping external access configuration."
        ;;
esac

echo ""
echo "Deployment complete!"
echo "===================="
kubectl get pods -n kube-credential -o wide
echo ""
kubectl get services -n kube-credential
echo ""
echo "Useful commands:"
echo "  ./status.sh         # System status"
echo "  ./logs.sh           # Logs viewer"
echo "  kubectl scale deployment/issuance-service --replicas=3 -n kube-credential"
echo "  kubectl port-forward service/issuance-service 3000:3000 -n kube-credential"
echo "  ./undeploy.sh       # Cleanup"