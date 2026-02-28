# {{projectName}}

Next.js frontend template for fast stack development.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The frontend will automatically fetch from the backend at `http://localhost:8000/health`.

## Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build for production
- `pnpm start` — Start production server
- `pnpm lint` — Run linter

## Stack

- Next.js 15
- React 19
- TypeScript
- App Router
