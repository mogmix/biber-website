# Open Issues

---

## ISSUE-001 — Remove nickname feature entirely

**Status:** Open
**Priority:** Medium

### Background

The app currently prompts users to enter a "Spitzname" (nickname) before submitting a sighting. This is stored in `localStorage` and sent to the API. The decision has been made to remove this feature entirely.

### What needs to change

| Layer | File | Change |
|---|---|---|
| Frontend UI | `src/components/GermanyMap.tsx:198–238` | Remove nickname bar, `showNicknamePrompt` state, `nicknameInput` state, `handleNicknameSave()`, all nickname references |
| Hook | `src/hooks/useIdentity.ts` | Remove `nickname` and `setNickname` from the hook (keep `browserId`) |
| API | `src/worker.ts:78–116` | Remove `nickname` from request body validation and `INSERT` statement |
| DB schema | `src/worker.ts:32` | Decide: drop the `nickname TEXT NOT NULL` column, or keep it and stop populating it (see open question below) |
| Submit payload | `src/components/GermanyMap.tsx:111` | Remove `nickname` from `JSON.stringify(...)` |
| Privacy policy | `src/content/datenschutz.md:19` | Remove mention of „einen von Ihnen gewählten Spitznamen" from the data collection section |
| PRD | `docs/PRD.md:71,119,132` | Remove nickname from data model, M-03 requirement, and identity description |

### Open question

**DB column:** Is there live production data with nicknames already stored? If yes, dropping the column is destructive. Options:
- **Drop the column** — clean break, loses historical nicknames
- **Keep the column, stop populating it** — safe migration, column goes nullable over time

Decide before implementing the `worker.ts` change.
