# Bazaar Radar

A static MVP prototype for an India-first local opportunity discovery workspace.

## Local Development

This project is Next.js-compatible for Vercel deployment.

Install dependencies:

```sh
npm install
```

Run locally:

```sh
npm run dev
```

Build locally:

```sh
npm run build
```

## Deploy To Vercel

This project now supports the Next.js framework preset.

### Option 1: Vercel CLI

```sh
npm i -g vercel
vercel
```

When prompted:

- Framework preset: `Vite`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Output directory: leave empty / Vercel default

For production:

```sh
vercel --prod
```

### Option 2: Vercel Dashboard

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Select `Next.js` as the framework preset.
4. Use `npm run build` as the build command.
5. Leave output directory blank.
6. Deploy.

Included deployment files:

- `vercel.json` - static routing and headers.
- `next.config.js` - Next.js config.
- `pages/index.js` - Next route shell for the home page.
- `pages/pitch-coach.js` - Next route shell for the pitch coach page.
- `scripts/sync-next-public.js` - copies static app assets into `public/` before build.
- `package.json` - Next.js scripts and dependencies.
- `.vercelignore` - keeps local docs/agent files out of deployment.

## What Is Included

- Left-side filters for city, locality, sector, radius, budget, risk, and footfall.
- Center ranked opportunity cards loaded from local JSON.
- Right-side business plan panel with Snapshot, Unit Economics, Projections,
  Marketing Plan, and Risks tabs.
- Earlyness score with breakdown and evidence chips.
- Street Pulse timeline interaction.
- Browser print action for PDF-friendly export.
- Support chatbot placeholder dock with prompt chips.

## Files

- `index.html` - app shell
- `styles.css` - responsive UI and print styles
- `app.js` - filtering, ranking, plan tabs, timeline interactions
- `data/opportunities.json` - seed opportunity data
