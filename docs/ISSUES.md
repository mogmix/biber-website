# Issues

Work through these in order. Check off each item when done.

---

## Immediate

- [ ] **[C1] Fix navigation: replace `<button>` with `<a href>`**
  Footer links (Impressum, Datenschutz) and LegalPage back button should be anchor elements.
  `src/components/Footer.tsx`, `src/components/LegalPage.tsx`

- [ ] **[L1] Fill in legal placeholder text**
  `[Organisationsname]`, `[Adresse]`, `[E-Mail]` etc. in impressum.md and datenschutz.md.
  `src/content/impressum.md`, `src/content/datenschutz.md`

---

## Short-term

- [ ] **[C2] Optimize SVG assets**
  Run `npx svgo --multipass` on vereinslogo.svg (~2.4 MB → target < 50 KB) and favicon.svg (~670 KB → target < 5 KB).
  `public/vereinslogo.svg`, `public/favicon.svg`

- [ ] **[H2] Add dark mode variants for map quantile colors**
  `--color-land-1` through `--color-land-5` and `--color-land-cooldown` have no dark mode overrides.
  `src/index.css`

- [ ] **[H3] Increase touch target size on form controls**
  Save button (~22px tall) and "ändern" link (no padding) are below 44px minimum.
  `src/components/GermanyMap.tsx:184–193`

- [x] **[H5] Add loading state for API data**
  Map shows empty gray on load with no indication data is being fetched. Add `isLoading` state and skeleton/spinner.
  `src/App.tsx`

---

## Medium-term

- [x] **[M2] Conditionally run the countdown interval**
  `setInterval` fires every second unconditionally. Only start it when cooldown is active; clear it when it reaches 0.
  `src/components/GermanyMap.tsx:48–51`

- [ ] **[M3] Animate progress bars with `scaleX` instead of `width`**
  `transition-[width]` triggers layout recalculation. Use `transform: scaleX()` + `transition-transform`.
  `src/components/StatsPanel.tsx:49`

- [x] **[M4] Delete unused `App.css`**
  Leftover Vite scaffold template — 184 lines, none of it used. Delete file and remove import.
  `src/App.css`, `src/main.tsx`

- [x] **[M5] Fix logo `alt` text**
  `alt="Vereinslogo"` → `alt="Biber Lieber e.V. Logo"`.
  `src/components/Header.tsx:9`

- [ ] **[M6] Add skip-to-main-content link on legal pages**
  `MapView` has one; `LegalPage` doesn't. Add `id="main-content"` to `<main>` and the skip link.
  `src/components/LegalPage.tsx`

- [x] **[L2] Use brand color on save button**
  `bg-green-600` is inconsistent with `--brand-primary` teal used everywhere else.
  `src/components/GermanyMap.tsx:189`

- [x] **[L3] Add error boundaries around `GermanyMap` and `StatsPanel`**
  Any runtime error currently blanks the entire app. Add a boundary with a fallback UI.
  `src/App.tsx`

---

## Long-term

- [ ] **[H1] Extract focus color into a CSS variable**
  Hard-coded `#3b82f6` focus stroke in GermanyMap should be `var(--color-focus)` defined in index.css.
  `src/components/GermanyMap.tsx:257`, `src/index.css`

- [ ] **[H4] Improve touch targets for small city-state regions**
  Bremen, Hamburg, Berlin, Saarland render too small to tap reliably on mobile. Options: invisible hit-area paths, or allow tapping from the stats list.
  `src/components/GermanyMap.tsx`, `src/data/bundeslaender.ts`

- [ ] **[M1] Replace custom markdown parser with a proper library**
  `dangerouslySetInnerHTML` + hand-rolled regex is safe now but fragile. Replace with `marked` + DOMPurify or `micromark`.
  `src/components/LegalPage.tsx:9–34`
