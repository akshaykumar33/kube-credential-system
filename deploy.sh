#!/bin/bash
echo "🚀 Deploying Kube Credential System (Vite Edition)"
echo "Building all services..."

# Build images
echo "📦 Building Docker images..."
docker-compose build

echo "🌟 Starting services..."
docker-compose up -d

echo "✅ Deployment complete!"
echo ""
echo "🌐 Access Points:"
echo "- Issuance Service: http://localhost:3000"
echo "- Verification Service: http://localhost:3001"
echo "- Issuance Frontend (Vite): http://localhost:3002"
echo "- Verification Frontend (Vite): http://localhost:3003"
echo ""
echo "⚡ Powered by Vite for lightning-fast development!"
