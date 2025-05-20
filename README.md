# Token Indexer (EVM ERC-20)

> High-performance micro-service that **discovers, tracks and stores ERC-20
> contracts** across multiple EVM-compatible chains (Ethereum, BNB Smart Chain,
> Polygon PoS, Arbitrum One, Optimism Mainnet …) on a **MongoDB** backend.

---

## Features
* **Chain-agnostic** — works with any EVM RPC; chains configured in `.env`.
* **Pluggable sources** — merges data from CoinGecko (`/all.json` by *asset_platform_id*), 
  custom JSON feeds.
* **Change detection** — SHA-256 snapshot per chain ⇒ upserts only new / mutated
  tokens.
* **Exactly-once scheduling** — powered by BullMQ + Redis repeat-jobs.
* **Typed codebase** — Node 18 + TypeScript 5, strict mode.
* **Docker-first** — single `compose` stack (Mongo ✚ Redis ✚ service).

---

## Architecture

| Component | Responsibility |
|-----------|----------------|
| **Scheduler** | Adds a repeat-job per `chainId` every 10 min (`cron: */10 * * * *`). |
| **Worker** | Downloads token lists → hydrates on-chain data via `ethers.js` → merges & upserts Mongo. |
| **MongoDB** | Stores collection **`tokens`** with unique composite index `{ chainId, address }`. |
| **Redis** | BullMQ queue, snapshot hashes, rate-limit counters. |
| **Logger (pino)** | JSON logs in prod, pretty in dev. |

Data flow ⬇️  

`Sources (HTTP/RPC)` → **Parser** → *diff* → **Mongo** (upsert) → **Metrics/logs**

---

## Technology stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | **TypeScript 5** | Strict types, enums for `chainId`, simple IDE refs. |
| RPC | **ethers.js v6** | Tree-shakable, EIP-proxies, built-in batching. |
| HTTP | **axios** | Promise-based, interceptors for retry/back-off. |
| DB | **mongoose 7** | Elegant models, middleware, transactions. |
| Job queue | **BullMQ + Redis** | Exactly-once repeat jobs, per-chain concurrency. |
| Scheduler | BullMQ repeat (no external cron) | One unified queue, easy scale-out. |
| Container | Docker & Compose v2 | One-command bootstrap everywhere. |

---

## Database model

```js
// src/models/token.model.ts
{
  _id: ObjectId,
  chainId: Number,        // 1, 56, 137 …
  address: String,        // checksum 0x…
  symbol: String,
  name: String,
  decimals: Number,
  logoURI: String?,       // optional
  source: [String],       // e.g. ['coingecko','trustwallet']
  updatedAt: Date
}

```
---

## Indexes (mongosh)

```js
db.tokens.createIndex({ chainId: 1, address: 1 }, { unique: true });
db.tokens.createIndex({ symbol: 1 });

```
---

## Environment variables

| Variable           | Example                                  | Purpose             |
| ------------------ | ---------------------------------------- | ------------------- |
| `MONGO_URI`        | `mongodb://mongo:27017/tokenindexer`     | Connection string.  |
| `REDIS_URL`        | `redis://redis:6379`                     | BullMQ / snapshots. |
| `RPC_URL_ETH`      | `https://eth-mainnet.alchemy.com/v2/KEY` | Per-chain RPC.      |
| `RPC_URL_BSC`      | `https://bsc-dataseed.binance.org`       | –                   |
| `RPC_URL_POLYGON`  | …                                        | –                   |
| `RPC_URL_ARBITRUM` | …                                        | –                   |
| `RPC_URL_OPTIMISM` | …                                        | –                   |
| `LOG_LEVEL`        | `info`                                   | pino level.         |

---

Mongo 7 vs Mongo 4.4
Mongo 5+ requires a CPU with AVX. If your server / VM lacks AVX,
set mongo:4.4 in docker-compose.yml.

## Quick start with Docker

```bash
git clone https://github.com/alexmb15/token-indexer.git
cd token-indexer
cp .env.example .env    # fill RPC_URL_*

docker compose up -d --build
docker compose logs -f token-indexer
```

---

## Expected log:

```css
[info] Mongo connected
[info] Scheduler started
[info] CoinGecko list processed { chainId: 1, insertedOrUpdated: 5120 }

```
---

## Local development

```bash
pnpm install           # or yarn / npm ci
pnpm dev               # ts-node-dev + hot reload

# Mongo & Redis via Docker

docker compose up -d mongo redis

```
---
