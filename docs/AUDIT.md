# Biber-Website — Comprehensive Audit Report

_Generated: 2026-03-24_

---

## Anti-Patterns Verdict: PASS

No AI slop tells detected. The design is a purposeful, restrained utility app with:
- A deliberate, thematically appropriate color palette (forest teal for a nature/wildlife app)
- No gradient text, glassmorphism, hero metric cards, or generic font stacks
- System font — neutral and fast
- Functional-first layout: map + stats panel is exactly what the use case demands

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 6 |
| Low | 4 |

**Top 3 issues:**
1. Navigation uses `<button>` instead of `<a href>` — breaks right-click, middle-click, crawlability, and screen reader semantics
2. Huge unoptimized SVG assets (favicon: ~670 KB, logo: ~2.4 MB)
3. Touch targets on small city-state regions (Bremen, Hamburg, Berlin) and form controls are below 44px minimum

**Recommended next steps:** `/harden` → `/optimize` → `/adapt` → `/polish`

---

## Detailed Findings

### Critical Issues

---

**[C1] Navigation links are `<button>` elements, not `<a>` anchors**
- **Location:** `src/components/Footer.tsx:8–21`, `src/components/LegalPage.tsx:42–48`
- **Category:** Accessibility / Semantic HTML
- **Description:** All navigation (Impressum, Datenschutz, ← Zurück) uses `<button onClick={() => navigate(...)}>`
- **Impact:** Screen readers announce these as "button" not "link" — wrong mental model. Right-click → "Open in new tab" is missing. Middle-click doesn't work. Search engines can't crawl these routes. Browser back/forward behavior is inconsistent.
- **WCAG:** 1.3.1 Info and Relationships (A)
- **Recommendation:** Replace with `<a href="/impressum">` etc. The custom `navigate()` hook can remain for SPA behavior: `<a href="/impressum" onClick={(e) => { e.preventDefault(); navigate('/impressum') }}>`
- **Suggested command:** `/harden`

---

**[C2] Oversized SVG assets**
- **Location:** `public/vereinslogo.svg` (~2.4 MB), `public/favicon.svg` (~670 KB)
- **Category:** Performance
- **Description:** The logo SVG is 2.4 MB — likely contains embedded raster data or unoptimized paths. The favicon is 670 KB which is enormous for a 32×32–64×64 icon.
- **Impact:** Dramatically slows first paint, especially on mobile/slow connections. The logo is loaded in the `<Header>` which is above the fold.
- **Recommendation:** Run both through SVGO (`npx svgo --multipass`). If the logo contains embedded bitmaps, export a proper `<img>` fallback. Target: logo < 50 KB, favicon < 5 KB.
- **Suggested command:** `/optimize`

---

### High-Severity Issues

---

**[H1] Hard-coded focus color not respecting design tokens**
- **Location:** `src/components/GermanyMap.tsx:257`
- **Category:** Theming / Accessibility
- **Description:** `stroke: isFocused ? '#3b82f6' : ...` — the focus indicator color is hard-coded hex, not a CSS variable or Tailwind token.
- **Impact:** If the brand color scheme changes, this focus ring won't update. In a future dark-mode enhancement it can't be overridden. Blue `#3b82f6` may also conflict with a custom theme.
- **Recommendation:** Add `--color-focus: #3b82f6` to `:root` in `index.css` and reference `var(--color-focus)`.
- **Suggested command:** `/normalize`

---

**[H2] Dark mode: map quantile colors have no dark variants**
- **Location:** `src/index.css:13–17`
- **Category:** Theming
- **Description:** `--color-land-1` through `--color-land-5` and `--color-land-cooldown` are only defined for light mode. The dark mode `@media` block only overrides default, stroke, and hover colors.
- **Impact:** In dark mode, tier 1 (`#d1ede8`) looks washed out against dark gray backgrounds; tier 5 (`#105244`) nearly disappears against `--color-land-default: #374151`.
- **Recommendation:** Add dark-mode variants that are lighter/more vibrant versions of the quantile palette.
- **Suggested command:** `/colorize` or `/normalize`

---

**[H3] Small touch targets on form controls**
- **Location:** `src/components/GermanyMap.tsx:184–193`
- **Category:** Responsive / Accessibility
- **Description:** Save button (`py-0.5 px-2`) is approximately 22px tall. The "ändern" link has zero padding. Both are below the WCAG 2.5.5 recommended 44×44px touch target.
- **Impact:** Mobile users and users with motor impairments will struggle to tap these controls accurately.
- **WCAG:** 2.5.5 Target Size (AAA), 2.5.8 Target Size Minimum (AA in WCAG 2.2)
- **Recommendation:** Increase to at minimum `py-1.5 px-3` on the save button. Add `px-1 py-1` to the "ändern" inline button.
- **Suggested command:** `/adapt`

---

**[H4] City-state SVG regions may be untappable on mobile**
- **Location:** `src/components/GermanyMap.tsx`, `src/data/bundeslaender.ts`
- **Category:** Responsive / Accessibility
- **Description:** Bremen, Hamburg, Berlin, and Saarland are small regions in the 500×600 SVG. On a 375px-wide phone, these render at roughly 15–25px across — far below 44px touch target.
- **Impact:** Mobile users cannot reliably report sightings in small city-states.
- **WCAG:** 2.5.5 Target Size
- **Recommendation:** Add invisible padding paths or a secondary mechanism (e.g. tapping the region in the stats list), or enlarge hit areas with transparent sibling paths.
- **Suggested command:** `/adapt`

---

**[H5] No loading state for API data**
- **Location:** `src/App.tsx:22–31`
- **Category:** UX / Performance
- **Description:** On load, `counts` is an empty `Map` — the map shows all states as gray with zero count. There's no spinner, skeleton, or indication that data is being fetched.
- **Impact:** Users cannot tell if the app is working or if there are simply no sightings yet. On slow connections, this empty state persists for seconds.
- **Recommendation:** Add `isLoading` state to `MapView`, show a subtle loading indicator (spinner or skeleton bars in StatsPanel) until the first data response arrives.
- **Suggested command:** `/harden`

---

### Medium-Severity Issues

---

**[M1] `dangerouslySetInnerHTML` with unescaped regex substitution**
- **Location:** `src/components/LegalPage.tsx:24`
- **Category:** Security / Code Quality
- **Description:** `line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')` produces HTML injected via `dangerouslySetInnerHTML`. Since the content is static `.md?raw` imports there's no runtime XSS risk — but if the content source ever changes (CMS, user input), this becomes a real vulnerability.
- **Impact:** Low risk now, but brittle. A future dev might not notice the pattern.
- **Recommendation:** Use a proper markdown parser (`marked` or `micromark`) with HTML sanitization, or add an HTML-escape step before the substitution.
- **Suggested command:** `/harden`

---

**[M2] `setInterval` runs unconditionally every second**
- **Location:** `src/components/GermanyMap.tsx:48–51`
- **Category:** Performance
- **Description:** `setInterval(() => setNow(Date.now()), 1000)` fires every second for the entire lifecycle of the component — even when there's no active cooldown and no tooltip displaying a countdown.
- **Impact:** Forces a re-render of GermanyMap every second regardless. Wastes CPU and battery on lower-powered devices.
- **Recommendation:** Only start the interval when `cooldownUntil > Date.now()`. Clear it immediately once `globalCooldownSeconds` reaches 0.
- **Suggested command:** `/optimize`

---

**[M3] Progress bar animates `width` instead of `transform: scaleX`**
- **Location:** `src/components/StatsPanel.tsx:49`
- **Category:** Performance
- **Description:** `transition-[width] duration-300` animates the `width` property, which triggers layout recalculation on every frame.
- **Impact:** Suboptimal rendering performance — `transform: scaleX()` is GPU-composited and avoids layout recalculation.
- **Recommendation:** Set `width: 100%` + `transform-origin: left` + `transform: scaleX(fraction)` with `transition-transform`.
- **Suggested command:** `/optimize`

---

**[M4] `App.css` is entirely unused dead code**
- **Location:** `src/App.css`
- **Category:** Performance / Code Quality
- **Description:** This 184-line file appears to be leftover from the Vite scaffold template (classes like `.counter`, `.hero`, `#center`, `#next-steps`). None of these classes appear in any component.
- **Impact:** Adds to bundle. Confuses future developers.
- **Recommendation:** Delete `src/App.css` and remove its import from `src/main.tsx`.
- **Suggested command:** `/distill`

---

**[M5] Generic `alt` text on logo image**
- **Location:** `src/components/Header.tsx:9`
- **Category:** Accessibility
- **Description:** `alt="Vereinslogo"` describes the asset type, not its content.
- **Impact:** Screen reader users hear "Vereinslogo image" with no context about whose logo it is.
- **WCAG:** 1.1.1 Non-text Content (A)
- **Recommendation:** Change to `alt="Biber Lieber e.V. Logo"` or `alt=""` if purely decorative.
- **Suggested command:** `/harden`

---

**[M6] Legal pages missing skip-to-main-content link**
- **Location:** `src/components/LegalPage.tsx`
- **Category:** Accessibility
- **Description:** `MapView` has a skip link (`<a href="#main-content">`) but `LegalPage` does not. The header is rendered on both views.
- **Impact:** Keyboard users on legal pages must tab through the entire header before reaching content.
- **WCAG:** 2.4.1 Bypass Blocks (A)
- **Recommendation:** Add the same skip-link pattern to `LegalPage` — the `<main>` element just needs an `id="main-content"`.
- **Suggested command:** `/harden`

---

### Low-Severity Issues

---

**[L1] Legal content has unfilled `[placeholder]` values**
- **Location:** `src/content/impressum.md`, `src/content/datenschutz.md`
- **Category:** Content / Legal
- **Description:** Both legal pages contain template placeholder text in square brackets (e.g. `[Organisationsname]`, `[Adresse]`, `[E-Mail]`).
- **Impact:** Missing legal information. In Germany, an incomplete Impressum is a compliance risk.
- **Recommendation:** Fill in actual contact/registration details before launching publicly.
- **Suggested command:** `/clarify`

---

**[L2] Save button uses `bg-green-600` instead of brand color**
- **Location:** `src/components/GermanyMap.tsx:189`
- **Category:** Theming / Consistency
- **Description:** The "Speichern" button is `bg-green-600 hover:bg-green-700` while the rest of the UI uses `--brand-primary` teal (`#105244`). Mixed color language.
- **Impact:** Minor visual inconsistency — the primary action doesn't match the brand palette.
- **Recommendation:** Use `style={{ backgroundColor: 'var(--brand-primary)' }}` with hover darkening, matching the header.
- **Suggested command:** `/normalize`

---

**[L3] No error boundary around critical components**
- **Location:** `src/App.tsx`
- **Category:** Resilience
- **Description:** No React error boundaries. If `GermanyMap` throws (e.g. a malformed API response passed to the quantile function), the entire app unmounts silently with a blank screen.
- **Impact:** Total blank screen on any runtime error.
- **Recommendation:** Wrap `<GermanyMap>` and `<StatsPanel>` in an error boundary with a fallback UI.
- **Suggested command:** `/harden`

---

**[L4] Favicon is 670 KB**
- **Location:** `public/favicon.svg`
- **Category:** Performance
- **Description:** A favicon that renders at 16–64px does not need to be 670 KB. Downloaded on every page load.
- **Impact:** Wastes ~670 KB of bandwidth per session.
- **Recommendation:** Optimize with SVGO or replace with an ICO/PNG favicon at the appropriate resolution. Target: < 5 KB.
- **Suggested command:** `/optimize`

---

## Patterns & Systemic Issues

1. **Buttons used as navigation links** — appears in Footer (×2) and LegalPage back button (×1). Fix all three with `/harden`.
2. **Small touch targets** — both SVG map regions and form controls are sub-44px. Needs a mobile-first pass with `/adapt`.
3. **No dark mode for data visualization colors** — quantile colors 1–5 and cooldown color are all light-mode only. One `@media (prefers-color-scheme: dark)` block in `index.css` fixes all at once.

---

## Positive Findings

- **Excellent keyboard navigation on the SVG map** — focus ring via stroke color change, `Enter`/`Space` interaction, ARIA labels with live count and cooldown state.
- **`role="status"` live region** for cooldown is correctly implemented — screen reader users get updates without focus change.
- **Optimistic UI updates with rollback** — clean pattern with correct revert on 429 and network errors.
- **Touch interaction pattern** (tap-once to select, tap-again to confirm) — smart disambiguation for touch on map regions.
- **Quantile-based color tiers** — avoids linear scaling washing out low-count states next to high-count ones.
- **`tabular-nums` on count numbers** in StatsPanel — prevents layout shift as numbers change.
- **Design token usage** for map colors and brand colors — the tokens that exist are used consistently.

---

## Recommendations by Priority

| Priority | Action |
|----------|--------|
| **Immediate** | Fill legal `[placeholder]` text (L1) — legal compliance risk |
| **Immediate** | Fix navigation `<button>` → `<a href>` (C1) — semantics + crawlability |
| **Short-term** | Optimize SVG assets (C2, L4) — major perf win |
| **Short-term** | Fix form touch targets (H3) + add loading state (H5) |
| **Short-term** | Add dark mode quantile colors (H2) |
| **Medium-term** | Skip link on LegalPage (M6), alt text fix (M5), error boundaries (L3) |
| **Medium-term** | Interval optimization (M2), `scaleX` animation (M3), delete App.css (M4) |
| **Long-term** | Handle small SVG city-state touch areas (H4) |

---

## Suggested Commands for Fixes

| Command | Issues Addressed |
|---------|-----------------|
| `/harden` | C1 (nav links), H5 (loading state), M1 (dangerouslySetInnerHTML), M5 (alt text), M6 (skip link), L3 (error boundaries) |
| `/optimize` | C2 (SVG asset size), M2 (interval), M3 (width animation), L4 (favicon) |
| `/adapt` | H3 (form touch targets), H4 (SVG region touch areas) |
| `/normalize` | H1 (focus color token), L2 (save button color) |
| `/colorize` | H2 (dark mode quantile colors) |
| `/distill` | M4 (unused App.css) |
| `/clarify` | L1 (legal placeholder text) |
