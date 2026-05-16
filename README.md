# API Consumer Dashboard

A SaaS platform for developers to manage, monitor, and track third-party API keys from one place.

## Project Structure

```
project/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
cd server
npm install
cp .env.example .env   # Fill in your MongoDB URI and JWT secret
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Environment Variables (server/.env)

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/api-dashboard
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## Features (Current)
- [x] User signup / login with JWT auth
- [x] Protected routes
- [x] Dashboard with stat cards (dummy data)

## Roadmap
- [ ] Add & manage API keys
- [ ] Usage monitoring (requests, tokens, cost)
- [ ] Usage limits & alerts
- [ ] Request logs
- [ ] API key health checks
- [ ] Real-time stats
