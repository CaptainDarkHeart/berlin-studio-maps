# Berlin Studio Map

A free, independent directory of photography studios for hire in Berlin. An interactive map plus per-studio, per-area, and per-feature pages, built as a static Astro site.

Live at **[berlinstudiomap.com](https://berlinstudiomap.com)** (also reachable at [berlinstudiomaps.com](https://berlinstudiomaps.com) and their `www.` variants).

Modeled on [studiomaps.io](https://studiomaps.io) (London), adapted for Berlin: German districts instead of London compass zones, EUR pricing, metric floor areas, and a solar calculator recentred on Berlin's latitude (52.52°N) for the live daylight/golden-hour readout.

## What's here

- **`/`** — interactive map (Leaflet + CARTO Voyager tiles) with filters for daylight, blackout, infinity cove, drive-in access, kitchen, makeup, and green room, plus a live daylight/golden-hour bar computed from each studio's coordinates and today's date. Theme (light/dark UI chrome) switches automatically with Berlin's actual sunrise/sunset.
- **`/studios/`** — full A–Z list of studios, grouped by area.
- **`/studios/{slug}/`** — one page per studio: stats, facilities, a build-time monthly sunrise/sunset table, JSON-LD structured data, and an enquiry form (currently opens the visitor's email client; no backend yet).
- **`/areas/{area}/`** — one page per Berlin district represented in the current dataset.
- **`/features/{feature}/`** — SEO landing pages for daylight, blackout, drive-in, infinity cove, and kitchen studios.
- **`/blog/`** — a few guide/comparison posts generated from the live studio data.
- **`/about/`**, **`/suggest/`** — project background and a studio-suggestion contact page.

## Data

Studio data lives in [`src/data/studios.json`](src/data/studios.json) and is mirrored to `public/studios.json` for the client-side map fetch. **Keep both files in sync when editing** (`cp src/data/studios.json public/studios.json`), the homepage reads the `public/` copy at runtime, while every other page reads `src/data/` at build time. If they drift, the map and the rest of the site will disagree on what's listed.

Every studio currently in the dataset has been reviewed and confirmed (`"v": 1`), not left as a rough estimate. Corrections and new studios: see `/suggest/`, or email `hello@berlinstudiomaps.com` (forwards to Dan via Cloudflare Email Routing, see below).

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

## Deployment

Hosted on a [Cloudflare Worker](https://workers.cloudflare.com) (`berlin-studio-maps`, config in [`wrangler.jsonc`](wrangler.jsonc)) serving the static `dist/` output. Deployment is fully automatic via **Cloudflare Workers Builds**: the Worker is connected directly to this GitHub repo, and every push to `main` triggers a clone, `npm run build`, and `npx wrangler deploy`, live in well under a minute. There is no GitHub Actions workflow and no manual deploy step.

The `PUBLIC_CARTO_KEY` build secret is set on the Cloudflare side (Workers Builds trigger's environment variables), separately from the local `.env` file.

Custom domains (`berlinstudiomaps.com`, `berlinstudiomap.com`, and their `www.` variants) are configured as `routes` in `wrangler.jsonc`, each with its own Cloudflare zone. `workers_dev` is explicitly kept on, so the `*.workers.dev` fallback URL keeps working alongside the custom domains (Cloudflare disables it by default the moment a custom domain route exists, unless you opt back in).

Fallback: [berlin-studio-maps.dantaylormedia.workers.dev](https://berlin-studio-maps.dantaylormedia.workers.dev)

## Email

`hello@berlinstudiomaps.com` is not a hosted mailbox. It's a [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) rule that forwards mail to a real inbox, set up entirely through the Cloudflare API once DNS for the domain was on Cloudflare (MX records added automatically). No mail server, no third-party inbox provider.

## Stack

- [Astro](https://astro.build) (static output)
- [Leaflet](https://leafletjs.com) + [CARTO](https://carto.com/basemaps) Voyager basemap tiles
- [Cloudflare Workers](https://workers.cloudflare.com) (hosting, git-connected CI/CD) + [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) (contact address)
- No backend/database — all data is a static JSON file, all pages are pre-rendered at build time
