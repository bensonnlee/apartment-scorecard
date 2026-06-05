# Build Spec — Apartment Scorecard (hosted web app)

## Goal
Build a mobile-first single-page web app for touring apartments. While walking each
unit I rate it across weighted categories; the app auto-ranks every place I've toured
so I can pick the highest score. Host on Vercel so I can open the same URL on any device.

**Best starting point:** I'm attaching `apartment-scorecard.html` — a complete, working
single-file version of this app. Treat it as the reference implementation. Port its UI,
categories, scoring math, and behavior faithfully into the stack below. Everything in
this spec matches that file; use the spec to resolve any ambiguity.

## Stack
- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Fully client-side** — no backend, no API routes, no auth, no database
- **Persistence:** browser `localStorage` (per device)
- **Deploy:** Vercel (GitHub import or `vercel` CLI)
- Because storage is client-only, guard every `localStorage` access behind `useEffect`
  / a `typeof window !== 'undefined'` check so Next.js doesn't throw hydration errors.
  Initialize state empty on the server, then hydrate from `localStorage` on mount.
- (A Vite + React SPA is an equally acceptable alternative if you'd rather skip SSR
  entirely. Either deploys to Vercel trivially. Pick Next.js unless there's a reason not to.)

## Data model
```ts
type CatKey = 'location' | 'interior' | 'building' | 'cost' | 'practical' | 'vibe';

interface Apartment {
  id: string;            // e.g. crypto.randomUUID()
  name: string;          // address or nickname
  rent?: number;         // optional monthly rent (number)
  scores: Partial<Record<CatKey, 1 | 2 | 3 | 4 | 5>>;
  checks: Record<string, boolean>;   // key = `${catKey}:${itemIndex}`
  dealbreaker?: boolean;
  notes: string;
}

type Weights = Record<CatKey, 1 | 2 | 3>; // 1 = Low, 2 = Med, 3 = High

interface AppState {
  apartments: Apartment[];
  weights: Weights;
  budget?: number;       // optional monthly rent budget
}
```
Persist `AppState` to `localStorage` under a single key (e.g. `apartment-scorecard:v1`)
on every change. Load it once on mount.

## Categories (exact content — do not invent)
Each category has an icon, a name, a list of "check items" (reminders to tick off while
touring), and a 1–5 rating.

1. **📍 Location** — Commute / drive time · Neighborhood feel & safety · Walk to groceries / gym · Street noise · Parking on/off-site
2. **🛋 Interior & Unit** — Layout & flow · Natural light · Kitchen condition · Bathroom & water pressure · Closets / storage · AC & heating · Floors / walls / paint
3. **🏢 Building & Amenities** — Gym / fitness · In-unit laundry · Secure entry · Elevator / stairs · Trash & recycling · Maintenance responsiveness
4. **💵 Cost & Value** — Rent vs budget · Utilities included? · Deposit & fees · Parking / pet fees · Value for the money
5. **📋 Practical & Lease** — Lease length & terms · Management vibe · Cell signal / wifi · Pet / guest policy · Move-in timing
6. **✨ Gut Check** — Could I picture living here · First impression · Light & airiness · Would I be excited to come home

**Default weights:** location 3, interior 3, building 2, cost 3, practical 2, vibe 2.

## Scoring
A 0–100 percentage so apartments are directly comparable:

```
ratedCats = categories where a 1–5 score exists
got = Σ (score_c × weight_c)        for c in ratedCats
max = Σ (5 × weight_c)              for c in ratedCats
score = max > 0 ? round(got / max × 100) : 0
```
Also surface completeness as `ratedCats.length / 6` on each card so a half-filled
place is obviously incomplete. Check-item toggles are memory aids only — they do **not**
affect the score.

## Screens & features
**1. Home / ranking (default screen)**
- Header + buttons: "Add a place", "Priorities" (weights), "Copy ranking".
- Cards for every apartment, sorted high→low by score.
- Each card: rank number, name, rent (if set), "n/6 rated", big score number, a progress
  bar, and small chips showing per-category scores.
- The #1 non-dealbreaker card is highlighted as the front-runner (gold accent / 🏆).
- Empty state when no places exist.

**2. Editor (tap a card, or "Add a place")**
- Name input (address/nickname) + optional rent input.
- A live score that updates as you rate.
- For each of the 6 categories: the check-item chips (tap to toggle a checkmark) and a
  row of large 1–5 buttons (tap to set; tap again to clear).
- Notes textarea (gut feeling, smells, what the landlord said, etc.).
- A "Deal-breaker" toggle.
- Delete and Done buttons.

**3. Priorities panel (weights)**
- Low / Med / High segmented control per category. Changing a weight re-ranks instantly.

**4. Copy ranking**
- Copies a plain-text ranked summary (place, score, per-category scores, notes) to the
  clipboard via `navigator.clipboard`.

**5. Deal-breaker handling**
- Dealbreaker places drop to the bottom, shown struck-through/dimmed, and are excluded
  from the #1 front-runner highlight.

**6. Budget flag**
- Optional budget setting (in Priorities panel). Any apartment with `rent > budget`
  shows a red "over budget" chip on its card and in the editor.

## Design direction
Mobile-first, one-handed use, large tap targets. Warm "architectural / paper" aesthetic —
not generic AI styling. Match the attached HTML. Tokens:
- Fonts: **Fraunces** (display/headings, Google Fonts) + **Hanken Grotesk** (body).
- Colors: paper `#F2ECE0`, card `#FBF7EF`, ink `#211D17`, soft ink `#5A5346`,
  hairline `#D9CEB9`, clay accent `#C15A38` / `#9C4023`, gold (leader) `#B98A2E`,
  sage (checks) `#5C6B52`.
- Subtle dotted-grid background, soft shadows, rounded 11–16px corners.
- Selected 1–5 buttons fill clay; ticked check chips turn sage; score bars use a
  clay→deep-clay gradient (gold gradient for the front-runner).

## Deployment
1. `npx create-next-app@latest apartment-scorecard --typescript --tailwind --app`
2. Implement the app (all logic client-side; mark the main component `'use client'`).
3. `git init`, push to a GitHub repo.
4. Import the repo at vercel.com → deploy. (Or `npm i -g vercel && vercel`.)
5. Confirm it loads and persists on a phone via the deployed URL.

## Acceptance criteria
- [ ] Loads on mobile, looks like the reference HTML, no horizontal scroll.
- [ ] Can add/edit/delete apartments; ratings, checks, notes, rent all persist across reloads.
- [ ] Weighted score computes per the formula and matches the reference for the same inputs.
- [ ] Home screen ranks places live; changing weights re-ranks instantly.
- [ ] Deal-breakers sink to the bottom; over-budget rents are flagged.
- [ ] "Copy ranking" puts a readable summary on the clipboard.
- [ ] Deploys cleanly to Vercel and works from the public URL on any device.

## Optional upgrade (only if I ask): cross-device sync
The above is per-device (localStorage). If I later want the same data on phone + laptop,
swap the storage layer for **Supabase**: one `apartments` table + a `settings` row,
anon key in env vars, and a thin client wrapper that mirrors the current load/save API so
the rest of the UI is unchanged. Keep this out of scope unless explicitly requested.
