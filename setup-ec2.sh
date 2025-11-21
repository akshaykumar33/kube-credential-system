#!/bin/bash
set -e

echo "==============================================="
echo "🚀 Kube Credential Environment Setup Starting..."
echo "==============================================="

# Update system
echo "📦 Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker (official repo)
echo "🐳 Installing Docker..."
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y

sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install kubectl
echo "🔧 Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s \
https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Install Minikube
echo "📦 Installing Minikube..."
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

# Detect memory
TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_MB=$((TOTAL_MEM / 1024))

if [ $TOTAL_MB -gt 7000 ]; then
    MK_MEM=4096
elif [ $TOTAL_MB -gt 5000 ]; then
    MK_MEM=3072
else
    MK_MEM=2048
fi

echo "🧠 Auto-selecting Minikube memory: ${MK_MEM}MB"

echo "🚀 Starting Minikube..."
minikube start --driver=docker --memory=${MK_MEM} --cpus=2

echo "==============================================="
echo "✅ Setup Completed Successfully!"
echo "➡️ RUN: newgrp docker OR logout/login before using Docker."
echo "==============================================="
