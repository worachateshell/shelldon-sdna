# Deployment Guide

This guide provides multiple deployment options for the Wedding Game application.

## Quick Start (Development)

```bash
npm start
```

The application will run on `http://localhost:3000`.

---

## Production Deployment Options

### Option 1: Using the Deploy Script

The simplest way to deploy:

```bash
./deploy.sh
```

This script will:
- Check for required files (`.env`, `credentials.json`)
- Install dependencies
- Start the application

### Option 2: Using PM2 (Recommended for Production)

PM2 is a production process manager for Node.js applications.

**Install PM2:**
```bash
npm install -g pm2
```

**Start the application:**
```bash
pm2 start ecosystem.config.js --env production
```

**Useful PM2 Commands:**
```bash
pm2 status              # Check application status
pm2 logs wedding-game   # View logs
pm2 restart wedding-game # Restart application
pm2 stop wedding-game   # Stop application
pm2 delete wedding-game # Remove from PM2
```

**Auto-start on server reboot:**
```bash
pm2 startup
pm2 save
```

### Option 3: Using Docker (Advanced)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and run:**
```bash
docker build -t wedding-game .
docker run -p 3000:3000 --env-file .env wedding-game
```

---

## Environment Setup

Before deploying, ensure you have:

1. **`.env` file** with all required variables
2. **`credentials.json`** for Google API access
3. **Google Sheet** created and shared with service account
4. **Google Drive Folder** created and shared with service account
5. **LINE Login Channel** configured with correct callback URL

---

## Server Requirements

- **Node.js**: v14 or higher
- **RAM**: Minimum 512MB
- **Disk Space**: Minimum 100MB
- **Network**: Port 3000 accessible (or configure your preferred port)

---

## Reverse Proxy Setup (Nginx)

For production, use a reverse proxy like Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Troubleshooting

**Application won't start:**
- Check if `.env` file exists
- Verify `credentials.json` is present
- Ensure port 3000 is not already in use

**Google API errors:**
- Verify service account has access to Sheet and Drive
- Check if credentials.json is valid
- Ensure APIs are enabled in Google Cloud Console

**LINE Login fails:**
- Verify callback URL matches LINE Developers Console
- Check channel ID and secret in `.env`
