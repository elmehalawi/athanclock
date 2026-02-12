# Athan Clock

A privacy-first prayer times progressive web app. Everything is calculated on your device — nothing ever leaves the client.

## Features

- **Accurate prayer times** — calculated client-side using the [adhan](https://github.com/batoulapps/adhan-js) library
- **City search** — fuzzy search across 25,000+ cities using bundled GeoNames data
- **Geolocation** — "Use My Location" button for quick setup via reverse geocoding
- **Prayer notifications** — browser notifications at prayer times (no push server)
- **Offline support** — works fully offline after first load via Service Worker
- **Dark/light mode** — respects your system preference
- **Configurable** — choose calculation method and madhab (Shafi/Hanafi)

## Privacy

Athan Clock is designed with an uncompromising privacy stance:

- **No backend** — the app is entirely static HTML, CSS, and JavaScript
- **No API calls** — prayer times are calculated client-side, not fetched from a server
- **No tracking** — no analytics, no cookies, no fingerprinting
- **Bundled city database** — the 25K city database (from GeoNames) ships with the app. City lookups never leave your device
- **Geolocation stays local** — if you use "Use My Location", the coordinates are only used locally for reverse geocoding against the bundled database
- **Content Security Policy** — CSP headers block all external connections
- **Service Worker firewall** — the SW blocks any network request not in the cache, acting as a network firewall even against injected scripts
- **Permissions-Policy** — disables unused browser APIs (camera, microphone, payment, USB, etc.)
- **No external resources** — no external fonts, scripts, images, or iframes
- **localStorage only** — your city and settings are stored in localStorage, never transmitted
- **Fully open source** — every line of code is auditable

## Tech Stack

- [Svelte](https://svelte.dev/) + [Vite](https://vitejs.dev/) — build tooling
- [adhan](https://github.com/batoulapps/adhan-js) — prayer time calculation
- [Fuse.js](https://fusejs.io/) — fuzzy search
- [GeoNames](https://www.geonames.org/) — city database (cities15000)
- Service Worker — offline caching + network firewall
- Web Notifications API — prayer alerts

## Development

```bash
# Install dependencies
npm install

# Process city data (one-time, requires internet)
node scripts/prepare-cities.js

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## City Data

The city database is sourced from [GeoNames cities15000](https://download.geonames.org/export/dump/) (cities with population > 15,000). The `scripts/prepare-cities.js` script downloads, processes, and outputs a compact JSON file with only the fields needed: name, coordinates, country code, timezone, and population. The file is sorted by population for better search relevance.

## License

MIT
