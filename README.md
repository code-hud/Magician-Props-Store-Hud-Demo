# 🎩 Magician Props Store - Hud Demo

A full-featured e-commerce store for magician props showcasing Hud SDK integration with real-world error scenarios. Built with React, NestJS, and PostgreSQL.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Hud API key (for monitoring)

### Setup with Hud Monitoring

1. Clone the repository:
```bash
cd magician-props-store-hud-demo
```

2. Start the application with Hud monitoring:
```bash
HUD_API_KEY=your_hud_api_key docker-compose up --build
```

Or create a `.env` file in the project root:
```
HUD_API_KEY=your_hud_api_key
```

Then run:
```bash
docker-compose up --build
```

3. Open your browser to `http://localhost:3000`

## Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | postgres://postgres:postgres@localhost:5432/magician_props_store |

## Features

### Frontend
- Product listing with search and filtering
- Shopping cart with add/remove items
- Checkout with prefilled customer details
- Error banners that auto-dismiss after 10 seconds

### Backend
- RESTful API for products, cart, and orders
- Rate limiting on checkout (30-second limit per session)
- Hud SDK integration for monitoring
- Comprehensive error handling with Hud tracking

### Load Testing
The project includes an automated load tester (`load-tester` service) that:
- Simulates realistic user behavior (browsing, adding items, checkout)
- Randomly selects 0-10 products per cycle
- Attempts checkout even with empty carts
- Triggers a realistic "Missing Total Amount" error when cart totals $0
  - This demonstrates how JavaScript falsy values (`0 || undefined` = `null`) can cause database constraint violations
- Helps visualize errors in Hud monitoring

## Architecture

- **Frontend**: React with Context API for state management
- **Backend**: NestJS with TypeORM and PostgreSQL
- **Monitoring**: Hud SDK initialized with environment-based API key
- **HTTP Client**: Axios for inter-service communication
- **Database**: PostgreSQL with automatic initialization

## Project Structure

```
├── backend/              # NestJS API
│   ├── src/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   └── database/
│   ├── hud-init.js       # Hud SDK initialization
│   └── Dockerfile
├── frontend/             # React application
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   └── Dockerfile
├── docker/
│   ├── postgres/         # Database initialization
│   └── load-tester/      # Automated load testing service
├── docker-compose.yml
└── README.md
```

## Monitoring with Hud

The application is fully instrumented with the Hud SDK. All API endpoints, database queries, and errors are captured and visible in your Hud dashboard. The load tester's "Missing Total Amount" errors appear as constraint violations.

## License

MIT
