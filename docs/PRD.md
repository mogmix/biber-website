# Product Requirements Document (PRD)
## Beaver Sighting Tracker — MVP v1.0

**Verein:** Biber Lieber e.V., Berlin
**Version:** 1.0 — MVP (revised)
**Datum:** 22. März 2026
**Autor:** Morgan Tranter

---

## 1. Purpose & Context

Biber Lieber e.V. is a Berlin-based volunteer association of ~10 members dedicated to the observation and conservation of beavers (*Castor fiber*). The association needs a lightweight, members-only web portal centred on one core feature:

- **Beaver Counter** — an interactive map of Germany's 16 Bundesländer where members report beaver sightings, with basic statistics.

A curated news feed ("Biber-News") is planned for **v1.1** and is explicitly out of scope for this release.

This PRD defines the **minimum viable product (v1.0)**. The guiding philosophy is radical simplicity: 10 users, no budget for infrastructure, maximum utility with minimal engineering surface.

---

## 2. Goals & Success Criteria

| Goal | Metric |
|---|---|
| Crowdsourced sighting data across Germany | ≥ 20 sightings recorded in the first 3 months |
| Near-zero operating cost | Hosting costs ≤ €3/month (domain only) |
| Maintainable without a developer | Any member can redeploy via a simple push to the repo |

---

## 3. Users

There is one user type: **Member**. There are approximately 10 members. All members have equal permissions. One member acts informally as **Admin** (can moderate content by editing data directly).

There is **no authentication system**. Access control is handled by not publicising the URL. If a lightweight gate is desired later, a single shared passphrase stored in a cookie can be added with minimal effort.

---

## 4. Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Vite + React + Tailwind CSS | — |
| Headless UI primitives | Radix UI (tooltip, dropdown only) | — |
| Database | Turso (managed SQLite, EU region, free tier) | Free |
| Hosting / CDN | Cloudflare Pages (Frankfurt) | Free |
| Domain | Existing or new `.de` domain | ~€1/mo amortised |
| **Total** | | **~€1–3/month** |

### Key architecture decisions

- **SPA, not SSR.** No SEO needed; the portal is private. Vite produces a static bundle served from Cloudflare's edge.
- **Turso (libSQL/SQLite)** over Postgres. Perfect fit for low-write, low-user workloads. Free tier allows 9 GB storage and 500 M row reads/month — orders of magnitude beyond what 10 members will produce.
- **SVG map, not a mapping library.** The Bundesland map is a static SVG with 16 `<path>` elements, styled and made interactive in React. No Leaflet, no Mapbox, no tile server.
- **No Cloudflare Worker needed for v1.0.** The RSS ingestion worker is deferred to v1.1 along with the news feed. The API layer (see Section 7) runs as a Cloudflare Pages Function or a lightweight Worker with Hono/itty-router.

---

## 5. Features — In Scope (MVP)

### 5.1 Beaver Counter (Sighting Map)

An interactive map of Germany at the Bundesland level for reporting and visualising beaver sightings.

| ID | Requirement | Notes |
|---|---|---|
| M-01 | SVG map of 16 Bundesländer, each a clickable region | Public-domain SVG, embedded in React |
| M-02 | Hover state: region highlights + tooltip shows name and current-year sighting count | Radix Tooltip or CSS-only on mobile |
| M-03 | Click on a Bundesland → submits a sighting | Writes: Bundesland, timestamp, browser_id |
| M-04 | Rate limit: max 1 sighting per browser per 3 hours | Enforced server-side (Turso timestamp check on `browser_id` alone) + client `localStorage` for instant UI feedback. On rate-limit hit, the map continues to display the normal green choropleth; the user learns they are blocked via the hover tooltip, which shows the remaining cooldown. No full-map disable or red overlay. |
| M-05 | Choropleth colouring: regions shaded by sighting density (light → dark green) | Recalculated on page load from current-year data |
| M-06 | Statistics panel below the map: bar chart of sightings per Bundesland (current year) | Lightweight chart — CSS-only bars or a minimal library (e.g. `chart.js` subset via CDN if needed) |
| M-07 | Year filter dropdown to switch statistics between years | Only years with data are shown |

### 5.2 Global / UX

| ID | Requirement | Notes |
|---|---|---|
| G-01 | Responsive, mobile-first layout (breakpoints: mobile ≤ 640 px, desktop > 640 px) | Target 70 % smartphone usage |
| G-02 | Single-view layout; no tab navigation needed for v1.0 | Navigation will be added in v1.1 when the news feed is introduced |
| G-03 | Dark/light mode following system preference | Tailwind `dark:` utilities |
| G-04 | German-language UI | All labels, buttons, tooltips in German |
| G-05 | Vereinslogo in header; colour scheme derived from provided brand assets | Logo + hex values supplied by the Verein |
| G-06 | Impressum & Datenschutz pages (static content provided by the Verein, rendered as routes) | Legal compliance |
| G-07 | WCAG 2.1 AA: sufficient contrast, keyboard-navigable map, focus indicators | Tested with axe or Lighthouse |

---

## 6. Features — Explicitly Out of Scope (MVP)

The following items are **deferred to v1.1 or later** to keep the MVP lean:

| Feature | Target | Reason for deferral |
|---|---|---|
| **Biber-News feed (RSS aggregation + manual submission + upvoting)** | **v1.1** | **Descoped to focus v1.0 entirely on the sighting map** |
| **RSS ingestion Cloudflare Worker** | **v1.1** | **Only needed for the news feed** |
| Authentication & role-based access | v2+ | 10 trusted members; not needed now |
| Comment system under news items | v2+ | Members already communicate via group chat (Signal/WhatsApp) |
| Full-text search | v2+ | Browser Ctrl+F / Cmd+F is adequate at current volume |
| Tagging / region filter on news | v2+ | Low volume makes filtering unnecessary |
| Email or push notifications / digest | v2+ | 10 members can check the site directly |
| CSV export of sighting data | v2+ | Admin can query Turso directly via CLI or dashboard |
| Photo upload with sightings | v2+ | Adds file storage, moderation complexity |
| Dedicated admin UI | v2+ | Sources managed via config in repo; no user management needed |

---

## 7. Data Model

### Tables

```
sightings
─────────
id            TEXT PRIMARY KEY (ULID or nanoid)
bundesland    TEXT NOT NULL   -- e.g. "BE", "BY", "NW" (ISO 3166-2:DE)
browser_id    TEXT NOT NULL   -- random UUID, persisted in localStorage
reported_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### Tables deferred to v1.1

```
feed_items      -- news feed entries (RSS + manual submissions)
upvotes_log     -- per-item vote deduplication
```

### Notes on identity

- There is no `users` table. Identity is a random `browser_id` generated on first visit and persisted in `localStorage`.
- This is intentionally weak identity. It's sufficient for rate-limiting among trusted people. It is **not** a security boundary.

---

## 8. API Surface

The frontend communicates with a thin API layer deployed as a Cloudflare Pages Function or a lightweight Worker (Hono or itty-router). Reads/writes to Turso over HTTP.

### Endpoints

```
GET    /api/sightings?year=2026         → sightings aggregated by Bundesland
POST   /api/sightings                   → report a sighting (bundesland, nickname, browser_id)
         → 429 if rate-limited (response includes retry_after_seconds)
```

All endpoints are unauthenticated. Rate limiting on `POST /api/sightings` is enforced by checking the most recent sighting for the same `browser_id` within the past 3 hours, regardless of Bundesland. Any successful submission blocks the entire map for that browser for 3 hours.

### Endpoints deferred to v1.1

```
GET    /api/feed?sort=new|popular       → list feed items
POST   /api/feed                        → submit a new link
POST   /api/feed/:id/upvote             → upvote
```

---

## 9. SVG Map Specification

- Base asset: a public-domain SVG of German Bundesländer (e.g. from Wikimedia Commons), cleaned and optimised.
- Each `<path>` or `<g>` element carries a `data-land` attribute with the ISO 3166-2:DE code (e.g. `BE`, `BY`, `NW`).
- Styling via Tailwind + CSS custom properties:
  - Default fill: `--color-land-default` (neutral grey).
  - Hover fill: `--color-land-hover`.
  - Choropleth fills: 5-step green ramp from `--color-land-1` (lightest) to `--color-land-5` (darkest), assigned based on quantile breaks of sighting counts.
- Touch handling: on mobile, first tap highlights + shows tooltip; second tap submits sighting. This avoids accidental submissions.
- Keyboard accessibility: regions are focusable (`tabindex="0"`), Enter key triggers sighting submission, arrow keys move between regions.

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Initial load < 2 s on 4G; map interactions < 100 ms (SVG, no tile loading) |
| Browser support | Latest 2 versions of Chrome, Firefox, Safari, Edge |
| Accessibility | WCAG 2.1 Level AA (contrast, keyboard nav, focus management) |
| Privacy | No analytics, no cookies beyond the functional `localStorage` items (browser_id, nickname, theme preference). No personal data is collected. DSGVO-compliant by design — there is nothing to process |
| Data residency | All data stored in EU (Cloudflare Frankfurt, Turso EU region) |
| Resilience | Static SPA remains functional even if the API is temporarily unreachable (map renders with cached or empty data) |

---

## 11. Project Timeline

| Week | Phase | Deliverables |
|---|---|---|
| 1 | Setup & Design | Repo scaffolded (Vite + Tailwind + Cloudflare config), wireframes for Map view, SVG map asset cleaned, data model finalised, Turso DB provisioned |
| 2–3 | Beaver Counter | SVG map component (hover, click, mobile tap, keyboard nav), sighting API with rate-limiting, choropleth colouring, stats bar chart with year filter |
| 4 | Polish & Launch | Responsive QA (phone + desktop), accessibility audit (Lighthouse + manual keyboard test), Impressum/Datenschutz pages, deploy to production, brief README / handover doc |

**Total: ~4 weeks** (reduced from 6 weeks by deferring the news feed).

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Turso free tier is deprecated or limited | Low | Medium | Data volume is tiny; migration to another SQLite host (Fly.io, Cloudflare D1) is straightforward |
| `localStorage`-based identity is lost (cleared browser, new device) | High | Low | Acceptable at this scale. User just picks a new nickname |
| SVG map rendering issues on older mobile browsers | Low | Medium | Test early on real devices in week 1. The SVG is simple enough to be universally supported |
| Scope creep toward v1.1/v2 features during build | Medium | Medium | This PRD is the scope contract. Any feature not listed in Section 5 requires a conscious decision to revise the PRD first |

---

## 13. Future Considerations

### v1.1 — Biber-News Feed

The following was originally in scope for v1.0 and is the immediate next release:

- Curated, Hacker News–style feed of beaver-related links aggregated from RSS feeds and manually submitted by members.
- Cloudflare Scheduled Worker (cron every 30 min) for RSS ingestion.
- Upvoting (one per browser via `localStorage`).
- Sort toggle: "Neu" (chronological) / "Beliebt" (by votes).
- RSS source list managed via `sources.json` in the repo.
- Tab/nav added to switch between "Karte" and "News" views.

### v2+

- **Authentication** (magic link via Supabase Auth or similar) if membership grows beyond ~30.
- **Comment threads** on news items.
- **Region tagging** and filtering on the news feed.
- **Sighting notes and photo upload** (Cloudflare R2 for object storage).
- **Email digest** (weekly summary via Resend or similar).
- **CSV/JSON export** of sighting data for the Verein's annual report.
- **PWA support** (offline reading, push notifications).

---

*This document is the single source of truth for the MVP scope. Changes require explicit revision with a date stamp.*
