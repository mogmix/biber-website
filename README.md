# Biber Website

A beaver sighting tracker for the Verein. Members report sightings by clicking on a map of Germany's 16 Bundesländer. Sightings are stored in a database and shown as a colour-coded map and bar chart, filterable by year.

Built with React + Vite on the frontend, a Cloudflare Worker for the API, and Turso (managed SQLite) as the database.

---

## Running locally

You'll need Node.js and the Turso credentials (ask the admin).

```bash
npm install
```

Create a `.dev.vars` file in the project root:

```
DATABASE_URL=libsql://...
AUTH_TOKEN=...
```

Then start the dev server:

```bash
npm run dev
```

---

## Deploying

Push to `main`. Cloudflare Pages picks it up automatically and deploys within a minute or two.

---

## Querying the database

Install the [Turso CLI](https://docs.turso.tech/cli/installation), then:

```bash
turso db shell <db-name>
```

Useful queries:

```sql
-- Most recent sightings
SELECT * FROM sightings ORDER BY reported_at DESC LIMIT 20;

-- Count by Bundesland for a given year
SELECT bundesland, COUNT(*) AS total
FROM sightings
WHERE strftime('%Y', reported_at) = '2026'
GROUP BY bundesland
ORDER BY total DESC;
```
