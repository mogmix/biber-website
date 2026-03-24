# Issues

---

## [M-04] Rate-limit UX: show cooldown in tooltip only, no map overlay

**Status:** Open

### Context

When a user hits the 3-hour rate limit, the map should **not** be visually disabled or overlaid with red/error styling. The green choropleth heatmap should remain fully visible and normal.

### Change

- Remove any full-map disable state, red overlay, or disabled cursor on rate-limit hit.
- The user discovers they are blocked **only through the hover tooltip**, which shows the remaining cooldown (e.g. *„Nächste Sichtung in 2 h 14 min möglich"*).
- Client-side `localStorage` check still prevents the POST from firing.

### Acceptance Criteria

- [ ] Choropleth colouring is unchanged after a rate-limited submission attempt.
- [ ] No red overlay, disabled cursor, or map-wide error banner is shown.
- [ ] Hovering any Bundesland while rate-limited shows the remaining cooldown in the tooltip.
- [ ] After the cooldown expires the tooltip returns to the normal sighting count + submit prompt.
