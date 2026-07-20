# HACDNA

Premium web app for analyzing **Hacash HACD diamond** rarity with a transparent, frequency-based scoring engine.

> **Default data source is Hacash mainnet** via the public fullnode RPC
> (`http://nodeapi.hacash.org`). Single-diamond analysis is always live.
> Rankings use a growing **local index** (`data/mainnet-index.json`) seeded from mainnet.

## Features

- **Search** by HACD name, number, or ID (+ manual trait entry)
- **Analysis page**: score 0–100, percentile, category, trait cards, strengths/weaknesses, confidence
- **Compare** 2–5 diamonds with radar chart
- **Rankings** with filters, top 10 / 100 / 1%, pagination
- **Methodology** documentation
- **Adapter architecture**: swap Mock → Explorer → Node without UI changes
- **Prisma schema** ready for PostgreSQL indexing
- **Vitest** coverage for the scoring engine

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Recharts
- Prisma schema (optional Postgres)
- Vitest

## Quick start

```bash
cd hacd-rarity-analyzer
pnpm install
cp .env.example .env   # defaults to mainnet
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Try live diamonds: `INMHKM`, `#1`, `#1000`, `#133367`.

### Mainnet sync

```bash
# offline seed (recommended once after install)
pnpm seed:mainnet

# or while the app is running: expand local index
curl -X POST http://localhost:3000/api/sync -H "Content-Type: application/json" -d "{\"mode\":\"expand\"}"

# status
curl http://localhost:3000/api/sync
```

Optional: run your own fullnode and set:

```env
HACASH_NODE_RPC_URL=http://127.0.0.1:8081
```

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `pnpm dev`     | Dev server               |
| `pnpm build`   | Production build         |
| `pnpm start`   | Start production server  |
| `pnpm test`    | Run scoring unit tests   |
| `pnpm lint`    | ESLint                   |

## API

| Method | Path                         | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/hacd/:id`              | Diamond metadata         |
| GET    | `/api/hacd/:id/rarity`       | Full rarity analysis     |
| GET    | `/api/hacd/:id/traits`       | Traits only              |
| GET    | `/api/hacd/compare?ids=A,B`  | Compare 2–5 diamonds     |
| GET    | `/api/rankings`              | Filtered rankings        |
| GET    | `/api/statistics`            | Dataset stats            |
| POST   | `/api/recalculate-rarity`    | Rebuild score cache      |
| POST   | `/api/hacd/manual`           | Manual trait analysis    |

## Scoring model

Default weights (`src/lib/config/rarity.ts`):

| Component   | Weight |
|-------------|--------|
| Gene        | 35%    |
| Color       | 20%    |
| Pattern     | 15%    |
| Name        | 10%    |
| Minting     | 10%    |
| Historical  | 5%     |
| Market      | 5%     |

- `trait rarity ≈ -log10(frequency)` → normalized 0–100
- Unavailable traits redistribute weight
- Categories: Common → Legendary (configurable thresholds)
- **Confidence** reflects completeness, sample size, sync age, demo mode

## Architecture

```
src/lib/
  config/rarity.ts      # weights & categories
  scoring/              # engine + pattern analysis
  providers/            # Mock | Explorer | Node adapters
  data/mock-diamonds.ts # demo set (~45)
  types/hacd.ts
prisma/schema.prisma    # production tables
```

### Switch providers

```env
HACD_DATA_PROVIDER=mainnet          # default: nodeapi.hacash.org
NEXT_PUBLIC_HACD_DATA_PROVIDER=mainnet
HACASH_NODE_RPC_URL=http://nodeapi.hacash.org

# HACD_DATA_PROVIDER=mock           # offline demo set
# HACD_DATA_PROVIDER=explorer
```

Live path:

- `src/lib/hacash/client.ts`: fullnode RPC
- `src/lib/hacash/hip5.ts`: visual_gene to shape/color/style
- `src/lib/hacash/mapper.ts`: node JSON to domain model
- `src/lib/providers/mainnet-provider.ts`: cache + analysis

Optional: wire Prisma models for long-term index persistence.

## Project layout

```
src/app/                 # pages + API routes
src/components/          # UI
src/lib/                 # domain logic
prisma/schema.prisma
```

## Disclaimer

Rarity scores are analytical estimates. They are **not** financial advice and do not guarantee market prices. Always verify critical traits on official Hacash explorers.

## License

MIT
