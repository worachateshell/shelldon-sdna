#!/bin/bash

# Cloudflare Tunnel Quick Start Script
# This script helps you start the tunnel quickly

echo "🚀 Wedding Game - Cloudflare Tunnel Starter"
echo "==========================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed!"
    echo ""
    echo "Install it with:"
    echo "  macOS: brew install cloudflare/cloudflare/cloudflared"
    echo "  Linux: wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb"
    exit 1
fi

echo "✅ cloudflared is installed"
echo ""

# Check if config file exists
if [ ! -f "cloudflared-config.yml" ]; then
    echo "⚠️  cloudflared-config.yml not found!"
    echo ""
    echo "Creating a quick-start config for testing..."
    echo ""
    
    # Create a temporary config for quick testing
    cat > cloudflared-config.yml.example << 'EOF'
# Cloudflare Tunnel Configuration
# Rename this file to cloudflared-config.yml and update the values

tunnel: YOUR_TUNNEL_ID
credentials-file: /path/to/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - service: http_status:404
EOF
    
    echo "📝 Example config created: cloudflared-config.yml.example"
    echo ""
    echo "For quick testing without setup, run:"
    echo "  cloudflared tunnel --url http://localhost:3000"
    echo ""
    echo "This will give you a temporary .trycloudflare.com URL"
    echo ""
    read -p "Start quick test tunnel now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌐 Starting quick tunnel..."
        echo "📱 Make sure your app is running on port 3000"
        echo ""
        cloudflared tunnel --url http://localhost:3000
    fi
    exit 0
fi

# Start the tunnel with config
echo "🌐 Starting Cloudflare Tunnel..."
echo "📱 Make sure your app is running on port 3000"
echo ""

cloudflared tunnel --config cloudflared-config.yml run
