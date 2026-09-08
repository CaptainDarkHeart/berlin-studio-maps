# Studio Map Berlin

A free, independent directory of photography studios for hire in Berlin. An interactive map plus per-studio, per-area, and per-feature pages, built as a static Astro site.

Modeled on [studiomaps.io](https://studiomaps.io) (London), adapted for Berlin: German districts instead of London compass zones, EUR pricing, metric floor areas, and a solar calculator recentred on Berlin's latitude (52.52°N) for the live daylight/golden-hour readout.

## What's here

- **`/`** — interactive map (Leaflet + CARTO Voyager tiles) with filters for daylight, blackout, infinity cove, drive-in access, kitchen, makeup, and green room, plus a live daylight/golden-hour bar computed from each studio's coordinates and today's date. Theme (light/dark UI chrome) switches automatically with Berlin's actual sunrise/sunset.
- **`/studios/`** — full A–Z list of studios, grouped by area.
- **`/studios/{slug}/`** — one page per studio: stats, facilities, a build-time monthly sunrise/sunset table, JSON-LD structured data, and an enquiry form (currently opens the visitor's email client; no backend yet).
- **`/areas/{area}/`** — one page per Berlin district (Mitte, Kreuzberg, Neukölln, Prenzlauer Berg, Friedrichshain, Charlottenburg, Wedding, Weissensee, Lichtenberg, Tempelhof, and others as the dataset grows).
- **`/features/{feature}/`** — SEO landing pages for daylight, blackout, drive-in, infinity cove, and kitchen studios.
- **`/blog/`** — a few guide/comparison posts generated from the live studio data.
- **`/about/`**, **`/suggest/`** — project background and a studio-suggestion contact page.

## Data

Studio data lives in [`src/data/studios.json`](src/data/studios.json) (also mirrored to `public/studios.json` for the client-side map fetch — keep both in sync when editing). Every studio is currently marked `"v": 0` (estimated), meaning it was compiled from public listings and has not yet been confirmed directly with the studio. Corrections and new studios: see `/suggest/`.

## Development

```sh
npm install
cp .env.example .env   # then fill in PUBLIC_CARTO_KEY, see below
npm run dev
```

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the static site to `./dist/` |
| `npm run preview` | Preview the production build locally |

## Environment variables

The map needs a [CARTO Basemaps](https://carto.com/basemaps) API key to load tiles without a watermark. Copy `.env.example` to `.env` and set:

```
PUBLIC_CARTO_KEY=your-carto-basemaps-key
```

Get a free key at [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey) (free tier: 5,000,000 tile requests/month). The `PUBLIC_` prefix is required, Astro/Vite only expose env vars to client-side code when prefixed this way, and this key is designed by CARTO to travel in the browser's tile request URLs, so shipping it in the built site is expected. For extra protection, set a domain allowlist for the key in your CARTO dashboard rather than trying to keep it secret in code.

## Stack

- [Astro](https://astro.build) (static output)
- [Leaflet](https://leafletjs.com) + [CARTO](https://carto.com/basemaps) Voyager basemap tiles
- No backend/database — all data is a static JSON file, all pages are pre-rendered at build time
