# Cloudflare Tunnel Deployment Guide

This guide will help you deploy your Wedding Game application using Cloudflare Tunnel.

## Prerequisites

- Cloudflare account (free tier is fine)
- A domain added to Cloudflare (or use a free `.trycloudflare.com` subdomain)
- Server to run the application (VPS, local machine, or cloud VM)

## Step 1: Install Cloudflare Tunnel (cloudflared)

### macOS
```bash
brew install cloudflare/cloudflare/cloudflared
```

### Linux
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Windows
Download from: https://github.com/cloudflare/cloudflared/releases

## Step 2: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Log in to your Cloudflare account and select your domain.

## Step 3: Create a Tunnel

```bash
cloudflared tunnel create wedding-game
```

This will create a tunnel and generate a credentials file. **Save the Tunnel ID** shown in the output.

## Step 4: Create Tunnel Configuration

Create a file named `cloudflared-config.yml` in your project directory:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /path/to/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

**Replace:**
- `YOUR_TUNNEL_ID` with the ID from Step 3
- `/path/to/.cloudflared/YOUR_TUNNEL_ID.json` with the actual path to your credentials file
- `your-domain.com` with your actual domain

## Step 5: Configure DNS

```bash
cloudflared tunnel route dns wedding-game your-domain.com
```

This creates a CNAME record in Cloudflare DNS pointing to your tunnel.

## Step 6: Start Your Application

```bash
npm start
```

## Step 7: Start the Tunnel

In a new terminal:

```bash
cloudflared tunnel --config cloudflared-config.yml run wedding-game
```

## Step 8: Run as a Service (Optional)

To keep the tunnel running permanently:

```bash
cloudflared service install
```

## Quick Start Script

For convenience, use the provided `start-tunnel.sh` script:

```bash
./start-tunnel.sh
```

---

## Testing with Free Subdomain (No Domain Required)

If you don't have a domain, you can test with a free `.trycloudflare.com` subdomain:

```bash
cloudflared tunnel --url http://localhost:3000
```

This will give you a temporary URL like `https://random-words.trycloudflare.com`

---

## Troubleshooting

**Tunnel won't start:**
- Check if port 3000 is already in use
- Verify your credentials file path in `cloudflared-config.yml`

**Application not accessible:**
- Ensure your Node.js app is running on port 3000
- Check firewall settings

**LINE Login fails:**
- Update your LINE callback URL to use your new domain
- Update `.env` file with the new `LINE_CALLBACK_URL`

---

## Stopping the Tunnel

```bash
# If running in terminal
Ctrl+C

# If running as a service
cloudflared service uninstall
```

---

## Next Steps

1. Update your LINE Login callback URL in LINE Developers Console
2. Update `.env` with your new domain
3. Test all features (registration, payment, lucky draw)
