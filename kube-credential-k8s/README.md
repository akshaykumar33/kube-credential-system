# 🚀 Kube Credential System - Kubernetes Deployment

**Production-ready Kubernetes deployment for Redis Pub/Sub Credential Management System**

## 📦 Complete Package Contents

### 🏗️ Infrastructure (4 files)
- `namespace.yaml` - Dedicated Kubernetes namespace
- `pvc-*.yaml` - Persistent storage for SQLite databases and Redis
- `configmap.yaml` - Environment configuration and settings

### 🗄️ Data Layer (1 file)  
- `redis.yaml` - Redis deployment with pub/sub, persistence, and health checks

### 🏢 Backend Services (2 files)
- `issuance.yaml` - Credential issuance microservice (2 replicas)
- `verification.yaml` - Credential verification microservice (2 replicas)

### 🌐 Frontend Applications (2 files)
- `issuance-frontend.yaml` - React issuance UI with Vite
- `verification-frontend.yaml` - React verification UI with Vite

### 🔗 External Access (2 files)
- `ingress.yaml` - Nginx ingress controller with hostname routing
- `services-nodeport.yaml` - NodePort services for direct cluster access

### 🛠️ Management Scripts (4 files)
- `deploy.sh` - **Interactive deployment automation**
- `undeploy.sh` - **Clean removal with data preservation options**  
- `status.sh` - **Comprehensive system monitoring and health checks**
- `logs.sh` - **Interactive log viewer for all components**

## 🚀 Quick Start Guide

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured and connected
- Docker images built and pushed to registry

### Step 1: Prepare Docker Images
```bash
# Build your application images
# Build issuance service
cd services/issuance-service
docker build -t akshaykumar33/kube-credential-issuance:latest .

# Build verification service
cd ../verification-service
docker build -t akshaykumar33/kube-credential-verification:latest .

# Build issuance frontend
cd ../../frontend/issuance-app
docker build -t akshaykumar33/kube-credential-issuance-ui:latest .

# Build verification frontend
cd ../verification-app
docker build -t akshaykumar33/kube-credential-verification-ui:latest .


# Push to your registry
docker push akshaykumar33/kube-credential-issuance:latest
docker push akshaykumar33/kube-credential-verification:latest
docker push akshaykumar33/kube-credential-issuance-ui:latest
docker push akshaykumar33/kube-credential-verification-ui:latest
```

### Step 2: Update Image References
Replace `akshaykumar33` with your actual Docker Hub username in all YAML files:
```bash
# Quick replacement (Unix/Linux/Mac)
sed -i 's/akshaykumar33/your-actual-username/g' k8s/*.yaml

# Or manually edit each file
# Update image names in: issuance.yaml, verification.yaml, issuance-frontend.yaml, verification-frontend.yaml
```

### Step 3: Deploy to Kubernetes
```bash
# Make scripts executable
chmod +x *.sh

# Run interactive deployment
cd ../.. && cd kube-credential-k8s
./deploy.sh
```

The deployment script will:
1. ✅ Verify kubectl and cluster connectivity
2. ✅ Create namespace and persistent storage
3. ✅ Deploy Redis with health checks
4. ✅ Deploy backend services with 2 replicas each
5. ✅ Deploy frontend applications
6. ✅ Configure external access (Ingress or NodePort)
7. ✅ Provide access URLs and management commands

## 🌐 Access Your System

### Option A: Ingress (Hostname-based)
Add to your `/etc/hosts` file:
```
<YOUR-CLUSTER-IP> issuance.kube-credential.local
<YOUR-CLUSTER-IP> verification.kube-credential.local
<YOUR-CLUSTER-IP> api.kube-credential.local
```

**Access URLs:**
- Issuance UI: http://issuance.kube-credential.local
- Verification UI: http://verification.kube-credential.local
- Issuance API: http://api.kube-credential.local/issuance/
- Verification API: http://api.kube-credential.local/verification/

### Option B: NodePort (Port-based)
**Access via cluster node IPs:**
- Issuance Service: http://`<NODE-IP>`:30000
- Verification Service: http://`<NODE-IP>`:30001
- Issuance Frontend: http://`<NODE-IP>`:30002
- Verification Frontend: http://`<NODE-IP>`:30003

### Option C: Port Forwarding (Development)
```bash
kubectl port-forward service/issuance-service 3000:3000 -n kube-credential
kubectl port-forward service/verification-service 3001:3001 -n kube-credential
kubectl port-forward service/issuance-frontend 8080:80 -n kube-credential
kubectl port-forward service/verification-frontend 8081:80 -n kube-credential
```

## 🛠️ Management & Monitoring

### System Status
```bash
./status.sh
```
Shows:
- Deployment and pod status
- Service endpoints
- Resource usage
- Recent events
- Quick access commands

### Log Monitoring
```bash
./logs.sh
```
Interactive menu for:
- Individual component logs
- Real-time log following
- All components overview
- Kubernetes events

### Scaling Services
```bash
# Scale issuance service to 5 replicas
kubectl scale deployment/issuance-service --replicas=5 -n kube-credential

# Scale verification service to 3 replicas  
kubectl scale deployment/verification-service --replicas=3 -n kube-credential
```

### Manual Operations
```bash
# Check pod status
kubectl get pods -n kube-credential -o wide

# View service endpoints
kubectl get services -n kube-credential

# Check persistent volumes
kubectl get pvc -n kube-credential

# View ingress rules
kubectl get ingress -n kube-credential

# Execute shell in pod
kubectl exec -it deployment/issuance-service -n kube-credential -- sh

# View resource usage
kubectl top pods -n kube-credential
```

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Ingress/       │  │    NodePort     │              │
│  │  LoadBalancer   │  │   Services      │              │
│  └─────────┬───────┘  └─────────┬───────┘              │
│            │                    │                      │
│            └────────┬───────────┘                      │
│                     │                                  │
│  ┌─────────────────┐│┌─────────────────┐               │
│  │ Issuance UI     │││ Verification UI │               │
│  │ (React Pod)     │││ (React Pod)     │               │
│  └─────────────────┘│└─────────────────┘               │
│            │         │         │                       │
│  ┌─────────────────┐│┌─────────────────┐               │
│  │ Issuance Svc    │││ Verification Svc│               │
│  │ (2 Pods)        │││ (2 Pods)        │               │
│  └─────────────────┘│└─────────────────┘               │
│            │         │         │                       │
│            └─────────┼─────────┘                       │
│                      │                                 │
│            ┌─────────────────┐                         │
│            │ Redis Pub/Sub   │                         │
│            │ (1 Pod + PVC)   │                         │
│            └─────────────────┘                         │
│                      │                                 │
│            ┌─────────────────┐                         │
│            │ Persistent      │                         │
│            │ Volumes         │                         │
│            │ (SQLite + Redis)│                         │
│            └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## ⚡ Production Features

### High Availability
- **Multi-replica deployments** (2 replicas per service)
- **Health checks** with liveness and readiness probes
- **Automatic restarts** on failure
- **Rolling updates** with zero downtime

### Persistent Storage  
- **SQLite databases** preserved across pod restarts
- **Redis data persistence** with append-only file
- **Configurable storage classes** for different environments

### Resource Management
- **CPU and memory limits** configured for all pods
- **Resource requests** for proper scheduling
- **Horizontal Pod Autoscaling** ready (HPA compatible)

### Networking & Security
- **Service-to-service** communication via DNS
- **Network policies** ready for micro-segmentation
- **CORS configuration** for frontend-backend communication

### Monitoring & Observability
- **Built-in health endpoints** (/health)
- **Kubernetes events** tracking
- **Resource usage** monitoring (with metrics-server)
- **Structured logging** for all components

## 🔧 Customization Options

### Storage Configuration
Edit PVC files to change storage size or class:
```yaml
spec:
  resources:
    requests:
      storage: 10Gi  # Increase size
  storageClassName: ssd  # Change storage class
```

### Resource Limits
Adjust in deployment files:
```yaml
resources:
  limits:
    memory: "1Gi"
    cpu: "1000m" 
  requests:
    memory: "512Mi"
    cpu: "500m"
```

### Environment Variables
Modify configmap.yaml or add directly to deployments:
```yaml
env:
- name: CUSTOM_VAR
  value: "custom-value"
```

### Scaling Configuration
Update replica counts in deployment files:
```yaml
spec:
  replicas: 5  # Scale to 5 replicas
```

## 🧹 Cleanup

### Safe Removal (Preserve Data)
```bash
./undeploy.sh
# Choose 'N' when asked about persistent data
```

### Complete Removal (Delete Everything)
```bash
./undeploy.sh  
# Choose 'Y' to delete persistent data
```

### Manual Cleanup
```bash
# Delete specific components
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/issuance.yaml
kubectl delete -f k8s/verification.yaml

# Delete namespace (removes everything)
kubectl delete namespace kube-credential
```

## 🎯 Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n kube-credential
kubectl logs <pod-name> -n kube-credential
```

**Storage issues:**
```bash
kubectl get pvc -n kube-credential
kubectl describe pvc <pvc-name> -n kube-credential
```

**Network connectivity:**
```bash
kubectl exec -it deployment/issuance-service -n kube-credential -- nslookup redis
```

**Image pull errors:**
- Verify image names are correct
- Ensure images are pushed to registry
- Check image pull secrets if using private registry

### Health Checks
```bash
# Test service health
kubectl port-forward service/issuance-service 3000:3000 -n kube-credential
curl http://localhost:3000/health

kubectl port-forward service/verification-service 3001:3001 -n kube-credential  
curl http://localhost:3001/health
```

---

## 📊 System Specifications

- **Kubernetes Version**: 1.20+
- **Storage**: Persistent Volumes with dynamic provisioning
- **Networking**: ClusterIP, NodePort, and Ingress support
- **Security**: RBAC ready, network policies compatible
- **Monitoring**: Prometheus/Grafana compatible
- **Scaling**: Horizontal Pod Autoscaler ready

**Created by Akshaykumar Patil** - Production Kubernetes deployment for Redis Pub/Sub Credential Management System

---

🎉 **Your credential system is now enterprise-ready on Kubernetes!**
