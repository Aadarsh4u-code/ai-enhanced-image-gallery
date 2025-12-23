# Docker Setup Guide

## Overview
This project has been containerized with Docker for both frontend and backend services. The setup includes:
- **Frontend**: React + Vite running on port 5173
- **Backend**: Express.js running on port 3001
- **Network**: Both services communicate via a Docker bridge network

## Prerequisites
- Docker (version 20.10+)
- Docker Compose (version 2.0+)


## Quick Start - Run Both Services

### Using Docker Compose (Recommended)
```bash
# Build and start both services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Building Individual Images

### Build Frontend Image
```bash
docker build -t ai-gallery-frontend:latest .
```

### Build Backend Image
```bash
docker build -t ai-gallery-backend:latest ./server
```

## Running Individual Containers

### Run Backend
```bash
docker run -d \
  --name ai-gallery-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  ai-gallery-backend:latest
```

### Run Frontend (requires backend running)
```bash
docker run -d \
  --name ai-gallery-frontend \
  -p 5173:5173 \
  -e VITE_API_URL=http://localhost:3001 \
  ai-gallery-frontend:latest
```

## Accessing the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Environment Variables

### Backend (.env in server directory)
```
NODE_ENV=production
PORT=3001
```

### Frontend (if needed)
```
VITE_API_URL=http://localhost:3001
```

## Docker Compose Services

### Service: backend
- **Image**: Built from `server/Dockerfile`
- **Port**: 3001
- **Health Check**: GET /health (30s interval)
- **Restart Policy**: unless-stopped

### Service: frontend
- **Image**: Built from root `Dockerfile`
- **Port**: 5173
- **Depends On**: backend (healthy)
- **Restart Policy**: unless-stopped

## Useful Commands

### View running containers
```bash
docker-compose ps
```

### View logs
```bash
docker-compose logs backend    # Backend logs
docker-compose logs frontend   # Frontend logs
docker-compose logs -f         # Follow all logs
```

### Stop specific service
```bash
docker-compose stop backend
docker-compose stop frontend
```

### Restart services
```bash
docker-compose restart
docker-compose restart backend
```

### Remove containers
```bash
docker-compose down
```

### Rebuild images
```bash
docker-compose build
docker-compose build --no-cache
```

## Troubleshooting

### Port already in use
```bash
# Change ports in docker-compose.yml
# Or kill existing process:
lsof -ti:3001 | xargs kill -9  # Kill process on port 3001
lsof -ti:5173 | xargs kill -9  # Kill process on port 5173
```

### Backend not responding
```bash
# Check backend logs
docker-compose logs backend

# Check health
curl http://localhost:3001/health
```

### Frontend can't reach backend
- Ensure backend is running first
- Check that both are on the same network
- Verify the API URL in frontend configuration

### Clear everything and start fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```
