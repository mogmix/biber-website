# TODO — Issue 12: Production Deploy + Handover

Human-in-the-loop checklist. Work through these steps in order.

---

## 1. Deploy to Cloudflare Pages

- [x] Push `main` branch and confirm Cloudflare Pages auto-deploy succeeds
- [x] Verify the Pages preview URL loads without errors

## 2. Custom Domain

- [ ] Add the `.de` domain in the Cloudflare Pages project settings
- [ ] Create a `CNAME` record pointing to the Pages URL (or enable Cloudflare proxy)
- [ ] Confirm DNS propagation and that the custom domain resolves

## 3. HTTPS

- [ ] Verify HTTPS is enforced (Cloudflare Pages enables this by default)
- [ ] Check browser console for mixed-content warnings — fix any `http://` asset references

## 4. Smoke Test

- [ ] Submit at least one sighting on the production URL
- [ ] Confirm the sighting appears on the map and in the statistics panel

## 5. Secure Turso Credentials

- [ ] Add `DATABASE_URL` and `AUTH_TOKEN` to a shared password manager
- [x] Confirm neither secret is committed to the repo (`git grep DATABASE_URL`, `git grep AUTH_TOKEN`)

## 6. README

- [ ] Write `README.md` covering:
  - What the project is
  - How to run it locally (`npm install` / `npm run dev`)
  - How to redeploy (push to `main`)
  - How the admin can query Turso directly (CLI or Turso Studio)
