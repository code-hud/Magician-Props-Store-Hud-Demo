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
HUD_API_KEY=your_hud_api_key REACT_APP_API_URL=http://localhost:3001 docker-compose up --build
```

Or create a `.env` file in the project root:
```
HUD_API_KEY=your_hud_api_key
REACT_APP_API_URL=http://localhost:3001
```

**Note:** Set `REACT_APP_API_URL` to the public URL of your backend API. Use `http://localhost:3001` for local development or your server's public IP/domain when deploying remotely.

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
| Redpanda (Kafka API) | 19092 | `KAFKA_BROKERS=localhost:19092` |

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
- Randomly selects 0-10 flat products per cycle
- Adds the **Master Illusionist's Vault** bundle (product id `5001`) in ~4% of cycles
- Attempts checkout even with empty carts
- Triggers a realistic "Missing Total Amount" error when cart totals $0
  - This demonstrates how JavaScript falsy values (`0 || undefined` = `null`) can cause database constraint violations
- Sends `traceparent` and `X-Account-Id` headers on every request for Hud distributed tracing
- Helps visualize errors and latency tails in Hud monitoring

### Kafka Order-Events Pipeline (Latency Forensics Demo)

On checkout, the backend publishes an `orders.created` event to Redpanda. An in-process consumer computes **order insights** by expanding bundle products into their component props.

| Traffic | Consumer latency | Logs |
|---------|------------------|------|
| Flat products (~96% of orders) | 500–700 ms | `processed order ok` |
| Vault bundle (~4% of orders) | 20–40 s | `processed order ok` (no error) |

**Root cause (intentional):** `expandBundle` in `backend/src/events/order-insights.service.ts` issues one DB query per graph node and recurses into nested bundles with **no memoization**. The Vault's component graph is a diamond DAG — shared sub-kits are re-expanded along every path, producing O(2^depth) redundant queries. Flat orders never hit it; only product `5001`'s graph shape triggers the tail.

**Why Hud is the payoff:** Throughput, p99, and application logs all look healthy. Hud function-level timing shows `expandBundle` consuming ~99% of wall-time on slow sessions, with replayable args revealing the pathological call count for product `5001`.

#### Walkthrough

1. Start the stack with Hud connected:
   ```bash
   HUD_API_KEY=your_key REACT_APP_API_URL=http://localhost:3001 make up
   ```

2. Watch consumer logs for the latency split:
   ```bash
   make logs-backend
   ```
   Most lines finish in `<1000ms`; occasional Vault orders log `20000ms`–`40000ms`.

3. In Hud, query the slowest backend consumer sessions and inspect function-level timing — `expandBundle` dominates.

4. Pull forensics on a slow session: args show `productId: 5001` with an abnormally high `expandBundleCallCount`.

5. Fix (agentic resolution): add memoization or batch-load to `expandBundle` in `order-insights.service.ts` — the tail collapses back into the 500–700 ms band.

**Disable Kafka locally:** unset `KAFKA_BROKERS` — producer and consumer no-op without error.

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
│   │   ├── events/       # Kafka producer + order-insights consumer
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
