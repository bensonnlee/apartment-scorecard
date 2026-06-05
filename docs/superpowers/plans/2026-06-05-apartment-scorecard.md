# Apartment Scorecard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the single-file `apartment-scorecard.html` reference into a mobile-first Next.js (App Router) + TypeScript + Tailwind v4 app that rates and auto-ranks toured apartments, persisting to `localStorage`.

**Architecture:** One `'use client'` page (`app/page.tsx`) owns all `AppState` (apartments, weights, budget, current editor target) and handles `localStorage` load/save. Pure logic (types, categories, scoring, storage) lives in `lib/` and is unit-tested. Presentation is split into three components — `RankCard`, `Editor`, `Priorities`. Design tokens are Tailwind v4 `@theme` CSS variables; fonts come from `next/font/google`.

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Vitest + jsdom for unit tests.

**Reference:** `apartment-scorecard.html` (repo root) is the visual + behavioral source of truth. Consult it for any styling/behavior detail not spelled out here.

---

## Known decisions (read before starting)

1. **Scoring formula = spec, not reference HTML.** `max` sums `5 × weight` over **rated categories only** (spec lines 66-69). The reference HTML sums over all 6 categories; that is intentionally NOT replicated. Identical for fully-rated apartments; differs for partial ones. Implemented in `lib/scoring.ts`, locked by tests in Task 3.
2. **Three features in spec but absent from reference HTML — must be built:** `rent` (input + card display), `dealbreaker` (toggle; sinks to bottom, dimmed/struck-through, excluded from front-runner), `budget` + over-budget red chip.
3. **Single storage key** `apartment-scorecard:v1` holding one `AppState` JSON object (spec line 46), NOT the reference's two-key (`apartments`/`weights`) scheme.
4. **Check key format** is `` `${catKey}:${itemIndex}` `` with a colon (spec line 33), NOT the reference's `catKey+idx`.
5. **Styling = Tailwind utility classes** referencing `@theme` tokens. Tailwind v4 has no `tailwind.config.js`; tokens live in `app/globals.css`.
6. **Components split** into `components/RankCard.tsx`, `components/Editor.tsx`, `components/Priorities.tsx`.
7. **Deploy is out of scope** — build locally only; the user deploys.

---

## File structure

| File | Responsibility |
|------|----------------|
| `app/layout.tsx` | HTML shell, metadata, viewport, Fraunces + Hanken Grotesk fonts as CSS vars |
| `app/globals.css` | Tailwind import, `@theme` design tokens, body background (dotted grid) |
| `app/page.tsx` | `'use client'` root: owns AppState, localStorage load/save, screen routing, copy-ranking |
| `lib/types.ts` | `CatKey`, `Rating`, `WeightValue`, `Apartment`, `Weights`, `AppState`, `Category` |
| `lib/categories.ts` | `CATEGORIES`, `DEFAULT_WEIGHTS`, `WEIGHT_LABEL` |
| `lib/scoring.ts` | `score`, `ratedCount`, `isOverBudget`, `rankApartments` |
| `lib/storage.ts` | `loadState`, `saveState`, `STORAGE_KEY`, `emptyState` |
| `lib/scoring.test.ts` | Unit tests for scoring/ranking |
| `lib/storage.test.ts` | Unit tests for persistence round-trip |
| `components/RankCard.tsx` | One ranked card (rank, name, rent, n/6, score, bar, chips, over-budget, lead/dealbreaker states) |
| `components/Priorities.tsx` | Weights segmented control + budget input |
| `components/Editor.tsx` | Name/rent inputs, live score, 6 category blocks, notes, dealbreaker toggle, delete/done |
| `vitest.config.ts` | jsdom env + `@/*` alias |

---

## Task 1: Scaffold project + test runner

**Files:**
- Create: entire `create-next-app` scaffold in repo root
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script)

- [ ] **Step 1: Scaffold Next.js into the current directory**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --turbopack
```
Expected: scaffolding completes; `app/`, `package.json`, `next.config.ts`, `tsconfig.json` created. The existing `apartment-scorecard.html`, `apartment-scorecard-spec.md`, and `docs/` are left untouched (no conflicts).

If it refuses due to a non-empty directory conflict, re-run from a temp dir and copy files in — but `.md`/`.html`/`docs` should not conflict.

- [ ] **Step 2: Install test dependencies**

Run:
```bash
npm install -D vitest jsdom
```
Expected: `vitest` and `jsdom` added to devDependencies.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
```

- [ ] **Step 4: Add `test` script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 5: Verify the dev server boots**

Run:
```bash
npm run build
```
Expected: build succeeds (compiles the default scaffold). This confirms the toolchain before any custom code.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js app + vitest"
```

---

## Task 2: Types and category data

**Files:**
- Create: `lib/types.ts`
- Create: `lib/categories.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export type CatKey =
  | 'location'
  | 'interior'
  | 'building'
  | 'cost'
  | 'practical'
  | 'vibe';

export type Rating = 1 | 2 | 3 | 4 | 5;
export type WeightValue = 1 | 2 | 3;

export interface Apartment {
  id: string;
  name: string;
  rent?: number;
  scores: Partial<Record<CatKey, Rating>>;
  checks: Record<string, boolean>; // key = `${CatKey}:${itemIndex}`
  dealbreaker?: boolean;
  notes: string;
}

export type Weights = Record<CatKey, WeightValue>;

export interface AppState {
  apartments: Apartment[];
  weights: Weights;
  budget?: number;
}

export interface Category {
  key: CatKey;
  icon: string;
  name: string;
  items: string[];
}
```

- [ ] **Step 2: Create `lib/categories.ts`** (content copied verbatim from spec / reference — do not invent items)

```ts
import type { Category, Weights, WeightValue } from './types';

export const CATEGORIES: Category[] = [
  {
    key: 'location',
    icon: '📍',
    name: 'Location',
    items: [
      'Commute / drive time',
      'Neighborhood feel & safety',
      'Walk to groceries / gym',
      'Street noise',
      'Parking on/off-site',
    ],
  },
  {
    key: 'interior',
    icon: '🛋',
    name: 'Interior & Unit',
    items: [
      'Layout & flow',
      'Natural light',
      'Kitchen condition',
      'Bathroom & water pressure',
      'Closets / storage',
      'AC & heating',
      'Floors / walls / paint',
    ],
  },
  {
    key: 'building',
    icon: '🏢',
    name: 'Building & Amenities',
    items: [
      'Gym / fitness',
      'In-unit laundry',
      'Secure entry',
      'Elevator / stairs',
      'Trash & recycling',
      'Maintenance responsiveness',
    ],
  },
  {
    key: 'cost',
    icon: '💵',
    name: 'Cost & Value',
    items: [
      'Rent vs budget',
      'Utilities included?',
      'Deposit & fees',
      'Parking / pet fees',
      'Value for the money',
    ],
  },
  {
    key: 'practical',
    icon: '📋',
    name: 'Practical & Lease',
    items: [
      'Lease length & terms',
      'Management vibe',
      'Cell signal / wifi',
      'Pet / guest policy',
      'Move-in timing',
    ],
  },
  {
    key: 'vibe',
    icon: '✨',
    name: 'Gut Check',
    items: [
      'Could I picture living here',
      'First impression',
      'Light & airiness',
      'Would I be excited to come home',
    ],
  },
];

export const DEFAULT_WEIGHTS: Weights = {
  location: 3,
  interior: 3,
  building: 2,
  cost: 3,
  practical: 2,
  vibe: 2,
};

export const WEIGHT_LABEL: Record<WeightValue, string> = {
  1: 'Low',
  2: 'Med',
  3: 'High',
};
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/categories.ts
git commit -m "feat: add data model types and category data"
```

---

## Task 3: Scoring + ranking logic (TDD)

**Files:**
- Test: `lib/scoring.test.ts`
- Create: `lib/scoring.ts`

- [ ] **Step 1: Write the failing test**

`lib/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { score, ratedCount, isOverBudget, rankApartments } from './scoring';
import { DEFAULT_WEIGHTS } from './categories';
import type { Apartment } from './types';

function make(overrides: Partial<Apartment> = {}): Apartment {
  return { id: 'x', name: '', scores: {}, checks: {}, notes: '', ...overrides };
}

describe('score', () => {
  it('returns 0 when nothing is rated', () => {
    expect(score(make(), DEFAULT_WEIGHTS)).toBe(0);
  });

  it('returns 100 when all categories are rated 5', () => {
    const apt = make({
      scores: { location: 5, interior: 5, building: 5, cost: 5, practical: 5, vibe: 5 },
    });
    expect(score(apt, DEFAULT_WEIGHTS)).toBe(100);
  });

  it('divides by rated-category max only (spec formula)', () => {
    // location rated 4, weight 3 => got 12, max 15 => 80
    expect(score(make({ scores: { location: 4 } }), DEFAULT_WEIGHTS)).toBe(80);
  });

  it('weights multiple rated categories correctly', () => {
    // location 3 (w3)=9, interior 4 (w3)=12 => got 21, max 30 => 70
    const apt = make({ scores: { location: 3, interior: 4 } });
    expect(score(apt, DEFAULT_WEIGHTS)).toBe(70);
  });
});

describe('ratedCount', () => {
  it('counts categories that have a score', () => {
    expect(ratedCount(make({ scores: { location: 1, vibe: 5 } }))).toBe(2);
    expect(ratedCount(make())).toBe(0);
  });
});

describe('isOverBudget', () => {
  it('is true when rent exceeds budget', () => {
    expect(isOverBudget(make({ rent: 2000 }), 1500)).toBe(true);
  });
  it('is false when rent is within budget', () => {
    expect(isOverBudget(make({ rent: 1400 }), 1500)).toBe(false);
  });
  it('is false when budget or rent is missing', () => {
    expect(isOverBudget(make({ rent: 2000 }), undefined)).toBe(false);
    expect(isOverBudget(make(), 1500)).toBe(false);
  });
});

describe('rankApartments', () => {
  it('sorts by score descending', () => {
    const a = make({ id: 'a', scores: { location: 5 } }); // 100
    const b = make({ id: 'b', scores: { location: 3 } }); // 60
    const result = rankApartments([b, a], DEFAULT_WEIGHTS);
    expect(result.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('sinks dealbreakers to the bottom regardless of score', () => {
    const a = make({ id: 'a', scores: { location: 3 } }); // 60
    const db = make({ id: 'db', scores: { location: 5 }, dealbreaker: true }); // 100 but sunk
    const result = rankApartments([db, a], DEFAULT_WEIGHTS);
    expect(result.map((x) => x.id)).toEqual(['a', 'db']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `scoring.ts` does not exist / functions not defined.

- [ ] **Step 3: Write minimal implementation**

`lib/scoring.ts`:
```ts
import type { Apartment, Weights } from './types';
import { CATEGORIES } from './categories';

export function score(apt: Apartment, weights: Weights): number {
  let got = 0;
  let max = 0;
  for (const c of CATEGORIES) {
    const rating = apt.scores[c.key];
    if (rating) {
      const w = weights[c.key];
      got += rating * w;
      max += 5 * w;
    }
  }
  return max > 0 ? Math.round((got / max) * 100) : 0;
}

export function ratedCount(apt: Apartment): number {
  return CATEGORIES.filter((c) => apt.scores[c.key]).length;
}

export function isOverBudget(apt: Apartment, budget?: number): boolean {
  return typeof budget === 'number' && typeof apt.rent === 'number' && apt.rent > budget;
}

export function rankApartments(apartments: Apartment[], weights: Weights): Apartment[] {
  return [...apartments].sort((a, b) => {
    const aDeal = a.dealbreaker ? 1 : 0;
    const bDeal = b.dealbreaker ? 1 : 0;
    if (aDeal !== bDeal) return aDeal - bDeal; // non-dealbreakers first
    return score(b, weights) - score(a, weights);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all scoring tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/scoring.ts lib/scoring.test.ts
git commit -m "feat: add weighted scoring and ranking with dealbreaker sink"
```

---

## Task 4: Storage layer (TDD)

**Files:**
- Test: `lib/storage.test.ts`
- Create: `lib/storage.ts`

- [ ] **Step 1: Write the failing test**

`lib/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, saveState, STORAGE_KEY } from './storage';
import { DEFAULT_WEIGHTS } from './categories';
import type { AppState } from './types';

beforeEach(() => {
  window.localStorage.clear();
});

describe('storage', () => {
  it('returns empty defaults when nothing is stored', () => {
    const state = loadState();
    expect(state.apartments).toEqual([]);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
    expect(state.budget).toBeUndefined();
  });

  it('round-trips a saved state', () => {
    const state: AppState = {
      apartments: [{ id: 'a', name: 'Oak St', scores: { location: 4 }, checks: {}, notes: 'nice' }],
      weights: { ...DEFAULT_WEIGHTS, cost: 1 },
      budget: 1800,
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('merges stored weights over defaults for forward-compat', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ apartments: [], weights: { location: 1 } }));
    const state = loadState();
    expect(state.weights.location).toBe(1);
    expect(state.weights.interior).toBe(DEFAULT_WEIGHTS.interior);
  });

  it('falls back to defaults on corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid');
    const state = loadState();
    expect(state.apartments).toEqual([]);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `storage.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

`lib/storage.ts`:
```ts
import type { AppState } from './types';
import { DEFAULT_WEIGHTS } from './categories';

export const STORAGE_KEY = 'apartment-scorecard:v1';

export function emptyState(): AppState {
  return { apartments: [], weights: { ...DEFAULT_WEIGHTS } };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      apartments: parsed.apartments ?? [],
      weights: { ...DEFAULT_WEIGHTS, ...(parsed.weights ?? {}) },
      budget: parsed.budget,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy-mode errors
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all storage tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts lib/storage.test.ts
git commit -m "feat: add localStorage AppState persistence"
```

---

## Task 5: Design tokens, fonts, and layout

**Files:**
- Modify: `app/layout.tsx` (full replacement)
- Modify: `app/globals.css` (full replacement)

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '900'],
  variable: '--font-fraunces',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
});

export const metadata: Metadata = {
  title: 'Apartment Scorecard',
  description: 'Rate and rank apartments as you tour them.',
};

export const viewport: Viewport = {
  themeColor: '#F2ECE0',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `app/globals.css`**

```css
@import 'tailwindcss';

@theme {
  --color-paper: #f2ece0;
  --color-paper-2: #eae1d1;
  --color-card: #fbf7ef;
  --color-ink: #211d17;
  --color-ink-soft: #5a5346;
  --color-line: #d9ceb9;
  --color-clay: #c15a38;
  --color-clay-deep: #9c4023;
  --color-sage: #5c6b52;
  --color-gold: #b98a2e;

  --font-display: var(--font-fraunces), serif;
  --font-body: var(--font-hanken), sans-serif;
}

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-body);
  line-height: 1.45;
  background-image: radial-gradient(circle at 1px 1px, rgba(33, 29, 23, 0.05) 1px, transparent 0);
  background-size: 22px 22px;
}
```

Note: Tailwind v4 generates utilities from `@theme` tokens — `bg-paper`, `bg-card`, `text-ink`, `text-ink-soft`, `border-line`, `bg-clay`, `bg-sage`, `bg-gold`, `font-display`, `font-body`, etc. all become available.

- [ ] **Step 3: Verify build (fonts + CSS compile)**

Run:
```bash
npm run build
```
Expected: build succeeds. (The default `page.tsx` still renders; it is replaced in Task 9.)

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add paper/architectural design tokens and fonts"
```

---

## Task 6: RankCard component

**Files:**
- Create: `components/RankCard.tsx`

- [ ] **Step 1: Create `components/RankCard.tsx`**

```tsx
import type { Apartment, Weights } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { score, ratedCount, isOverBudget } from '@/lib/scoring';

interface Props {
  apartment: Apartment;
  weights: Weights;
  budget?: number;
  rank: number; // 1-based
  isLead: boolean;
  onOpen: (id: string) => void;
}

export function RankCard({ apartment, weights, budget, rank, isLead, onOpen }: Props) {
  const s = score(apartment, weights);
  const rated = ratedCount(apartment);
  const over = isOverBudget(apartment, budget);
  const dealbreaker = !!apartment.dealbreaker;

  const ratedCats = CATEGORIES.filter((c) => apartment.scores[c.key]);

  return (
    <button
      type="button"
      onClick={() => onOpen(apartment.id)}
      className={[
        'relative w-full overflow-hidden rounded-2xl border-[1.5px] bg-card px-4 pb-3.5 pt-4 text-left mt-3 transition-transform active:scale-[0.99]',
        isLead
          ? 'border-gold shadow-[0_6px_22px_rgba(185,138,46,0.22)]'
          : 'border-line shadow-[0_4px_14px_rgba(33,29,23,0.10)]',
        dealbreaker ? 'opacity-60' : '',
      ].join(' ')}
    >
      {isLead && <span className="absolute left-0 top-0 bottom-0 w-[5px] bg-gold" />}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={[
              'flex-none grid place-items-center w-[30px] h-[30px] rounded-full border-[1.5px] font-display text-[13px] font-semibold',
              isLead ? 'bg-gold border-gold text-white' : 'border-line text-ink-soft',
            ].join(' ')}
          >
            {rank}
          </span>
          <div>
            <div
              className={[
                'font-display text-xl font-semibold leading-tight tracking-tight',
                dealbreaker ? 'line-through' : '',
              ].join(' ')}
            >
              {apartment.name || 'Untitled place'}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-soft">
              {typeof apartment.rent === 'number' && <span>${apartment.rent.toLocaleString()}/mo · </span>}
              {rated}/{CATEGORIES.length} rated
              {isLead ? ' · 🏆 front-runner' : ''}
              {dealbreaker ? ' · deal-breaker' : ''}
            </div>
            {over && (
              <span className="mt-1.5 inline-block rounded-md bg-clay px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-white">
                over budget
              </span>
            )}
          </div>
        </div>
        <div className="flex-none text-right">
          <div className="font-display text-3xl font-black leading-none tracking-tight">{s}</div>
          <div className="text-[11px] uppercase tracking-wider text-ink-soft">score</div>
        </div>
      </div>

      <div className="mt-3 h-[7px] overflow-hidden rounded-md bg-paper-2">
        <span
          className={[
            'block h-full rounded-md',
            isLead
              ? 'bg-gradient-to-r from-gold to-[#9c6f1e]'
              : 'bg-gradient-to-r from-clay to-clay-deep',
          ].join(' ')}
          style={{ width: `${s}%` }}
        />
      </div>

      {ratedCats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ratedCats.map((c) => (
            <span
              key={c.key}
              className="rounded-md bg-paper-2 px-1.5 py-0.5 text-[10.5px] tracking-wide text-ink-soft"
            >
              {c.icon} <b className="font-bold text-ink">{apartment.scores[c.key]}</b>
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/RankCard.tsx
git commit -m "feat: add RankCard with lead, dealbreaker, over-budget states"
```

---

## Task 7: Priorities component

**Files:**
- Create: `components/Priorities.tsx`

- [ ] **Step 1: Create `components/Priorities.tsx`**

```tsx
import type { CatKey, Weights, WeightValue } from '@/lib/types';
import { CATEGORIES, WEIGHT_LABEL } from '@/lib/categories';

interface Props {
  weights: Weights;
  budget?: number;
  onWeightChange: (key: CatKey, value: WeightValue) => void;
  onBudgetChange: (budget: number | undefined) => void;
}

export function Priorities({ weights, budget, onWeightChange, onBudgetChange }: Props) {
  return (
    <div className="mt-3.5 rounded-2xl border-[1.5px] border-line bg-card p-4">
      <h3 className="font-display text-lg font-semibold">What matters most to you?</h3>
      <p className="mb-3.5 text-[12.5px] text-ink-soft">
        Set how heavily each category counts. This re-ranks every place instantly.
      </p>

      {CATEGORIES.map((c, i) => (
        <div
          key={c.key}
          className={[
            'flex items-center justify-between gap-2.5 py-2.5',
            i === 0 ? '' : 'border-t border-line',
          ].join(' ')}
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            {c.icon} {c.name}
          </div>
          <div className="flex overflow-hidden rounded-lg border-[1.5px] border-line">
            {([1, 2, 3] as WeightValue[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onWeightChange(c.key, v)}
                className={[
                  'border-r-[1.5px] border-line px-3 py-1.5 text-xs last:border-r-0',
                  weights[c.key] === v ? 'bg-sage text-white' : 'bg-card text-ink-soft',
                ].join(' ')}
              >
                {WEIGHT_LABEL[v]}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-3 border-t border-line pt-3">
        <label className="flex items-center justify-between gap-2.5">
          <span className="text-sm font-semibold">💵 Monthly budget</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1800"
            value={budget ?? ''}
            onChange={(e) => {
              const v = e.target.value.trim();
              onBudgetChange(v === '' ? undefined : Number(v));
            }}
            className="w-28 rounded-lg border-[1.5px] border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-clay"
          />
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/Priorities.tsx
git commit -m "feat: add Priorities weights + budget panel"
```

---

## Task 8: Editor component

**Files:**
- Create: `components/Editor.tsx`

- [ ] **Step 1: Create `components/Editor.tsx`**

```tsx
import type { Apartment, CatKey, Rating, Weights } from '@/lib/types';
import { CATEGORIES, WEIGHT_LABEL } from '@/lib/categories';
import { score, ratedCount, isOverBudget } from '@/lib/scoring';

interface Props {
  apartment: Apartment;
  weights: Weights;
  budget?: number;
  onChange: (apartment: Apartment) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function Editor({ apartment, weights, budget, onChange, onDelete, onClose }: Props) {
  const rated = ratedCount(apartment);
  const over = isOverBudget(apartment, budget);

  function setScore(key: CatKey, value: Rating) {
    const scores = { ...apartment.scores };
    if (scores[key] === value) delete scores[key];
    else scores[key] = value;
    onChange({ ...apartment, scores });
  }

  function toggleCheck(key: CatKey, idx: number) {
    const checkKey = `${key}:${idx}`;
    const checks = { ...apartment.checks, [checkKey]: !apartment.checks[checkKey] };
    onChange({ ...apartment, checks });
  }

  return (
    <div className="animate-[fade_0.2s_ease]">
      <div className="mb-3.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border-[1.5px] border-line bg-card px-3 py-2.5 text-sm text-ink"
        >
          ‹ Back
        </button>
      </div>

      <input
        value={apartment.name}
        onChange={(e) => onChange({ ...apartment, name: e.target.value })}
        placeholder="Address or nickname…"
        className="w-full border-b-2 border-line bg-transparent px-0.5 py-1.5 font-display text-[26px] font-semibold tracking-tight text-ink outline-none placeholder:italic placeholder:text-[#bdb29c] focus:border-clay"
      />

      <label className="mt-3 flex items-center gap-2.5 text-sm text-ink-soft">
        <span className="font-semibold">Rent $/mo</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="optional"
          value={apartment.rent ?? ''}
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange({ ...apartment, rent: v === '' ? undefined : Number(v) });
          }}
          className="w-32 rounded-lg border-[1.5px] border-line bg-card px-3 py-1.5 text-ink outline-none focus:border-clay"
        />
        {over && (
          <span className="rounded-md bg-clay px-2 py-0.5 text-[10.5px] font-semibold text-white">
            over budget
          </span>
        )}
      </label>

      <div className="my-3.5 flex items-baseline justify-between rounded-2xl bg-ink px-4.5 py-3.5 text-paper">
        <span className="text-[11px] uppercase tracking-[0.22em] opacity-70">Live Score</span>
        <span className="font-display text-[34px] font-black tracking-tight">
          {rated ? score(apartment, weights) : '—'}
        </span>
      </div>

      {CATEGORIES.map((c) => (
        <div key={c.key} className="mt-3 rounded-2xl border-[1.5px] border-line bg-card px-3.5 pb-3.5 pt-3.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              {c.icon} {c.name}
            </div>
            <div className="rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              Weight: {WEIGHT_LABEL[weights[c.key]]}
            </div>
          </div>

          <div className="my-3 flex flex-wrap gap-1.5">
            {c.items.map((item, idx) => {
              const done = !!apartment.checks[`${c.key}:${idx}`];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleCheck(c.key, idx)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-lg border-[1.5px] px-2 py-1 text-xs transition-colors',
                    done
                      ? 'border-sage bg-sage/10 text-sage'
                      : 'border-line bg-paper text-ink-soft',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid h-3.5 w-3.5 flex-none place-items-center rounded border-[1.5px] text-[10px]',
                      done ? 'border-sage bg-sage text-white' : 'border-line text-transparent',
                    ].join(' ')}
                  >
                    ✓
                  </span>
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between gap-2.5">
            {([1, 2, 3, 4, 5] as Rating[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setScore(c.key, v)}
                className={[
                  'aspect-square max-w-[46px] flex-1 rounded-xl border-[1.5px] font-display text-base font-semibold transition-transform active:scale-90',
                  apartment.scores[c.key] === v
                    ? 'border-clay-deep bg-clay text-white shadow-[0_4px_10px_rgba(193,90,56,0.3)]'
                    : 'border-line bg-paper-2 text-ink-soft',
                ].join(' ')}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-ink-soft">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      ))}

      <div className="mx-0.5 mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
        Notes / gut feeling
      </div>
      <textarea
        value={apartment.notes}
        onChange={(e) => onChange({ ...apartment, notes: e.target.value })}
        placeholder="Smell, neighbors, weird vibes, what the landlord said, parking situation…"
        className="mt-3 min-h-[74px] w-full resize-y rounded-2xl border-[1.5px] border-line bg-card px-3.5 py-3 text-sm text-ink outline-none focus:border-clay"
      />

      <label className="mt-3 flex items-center justify-between gap-2.5 rounded-2xl border-[1.5px] border-line bg-card px-3.5 py-3">
        <span className="text-sm font-semibold">🚫 Deal-breaker (sinks to bottom)</span>
        <input
          type="checkbox"
          checked={!!apartment.dealbreaker}
          onChange={(e) => onChange({ ...apartment, dealbreaker: e.target.checked })}
          className="h-5 w-5 accent-clay"
        />
      </label>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onDelete(apartment.id)}
          className="rounded-xl border-[1.5px] border-line bg-transparent px-4 py-2.5 text-sm text-clay-deep"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 justify-center rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-paper"
        >
          Done
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the `fade` keyframe to `app/globals.css`**

Append to `app/globals.css`:
```css
@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Editor.tsx app/globals.css
git commit -m "feat: add Editor with categories, rent, notes, dealbreaker"
```

---

## Task 9: Wire it together in `app/page.tsx`

**Files:**
- Modify: `app/page.tsx` (full replacement)

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Apartment, AppState, CatKey, WeightValue } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { rankApartments, score, ratedCount } from '@/lib/scoring';
import { loadState, saveState, emptyState } from '@/lib/storage';
import { RankCard } from '@/components/RankCard';
import { Priorities } from '@/components/Priorities';
import { Editor } from '@/components/Editor';

export default function Home() {
  const [state, setState] = useState<AppState>(emptyState);
  const [mounted, setMounted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showPriorities, setShowPriorities] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  // Persist on every change, but only after the initial load.
  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  function updateApartment(updated: Apartment) {
    setState((s) => ({
      ...s,
      apartments: s.apartments.map((a) => (a.id === updated.id ? updated : a)),
    }));
  }

  function addApartment() {
    const apt: Apartment = {
      id: crypto.randomUUID(),
      name: '',
      scores: {},
      checks: {},
      notes: '',
    };
    setState((s) => ({ ...s, apartments: [...s.apartments, apt] }));
    setEditId(apt.id);
  }

  function deleteApartment(id: string) {
    if (!window.confirm('Delete this place?')) return;
    setState((s) => ({ ...s, apartments: s.apartments.filter((a) => a.id !== id) }));
    setEditId(null);
  }

  function setWeight(key: CatKey, value: WeightValue) {
    setState((s) => ({ ...s, weights: { ...s.weights, [key]: value } }));
  }

  function setBudget(budget: number | undefined) {
    setState((s) => ({ ...s, budget }));
  }

  function copySummary() {
    if (state.apartments.length === 0) {
      setToast('Add some places first.');
      return;
    }
    const sorted = rankApartments(state.apartments, state.weights);
    let t = 'APARTMENT RANKING\n\n';
    sorted.forEach((a, i) => {
      t += `${i + 1}. ${a.name || 'Untitled'} — ${score(a, state.weights)}/100`;
      t += a.dealbreaker ? ' (deal-breaker)\n' : '\n';
      if (typeof a.rent === 'number') t += `   Rent: $${a.rent}/mo\n`;
      CATEGORIES.forEach((c) => {
        if (a.scores[c.key]) t += `   ${c.icon} ${c.name}: ${a.scores[c.key]}/5\n`;
      });
      if (a.notes) t += `   📝 ${a.notes}\n`;
      t += '\n';
    });
    navigator.clipboard
      .writeText(t)
      .then(() => setToast('Ranking copied to clipboard.'))
      .catch(() => setToast('Could not copy automatically.'));
  }

  // Avoid hydration mismatch: render nothing data-driven until mounted.
  const editing = mounted ? state.apartments.find((a) => a.id === editId) ?? null : null;
  const ranked = mounted ? rankApartments(state.apartments, state.weights) : [];

  return (
    <div className="mx-auto max-w-[560px] px-4.5 pb-20 pt-6">
      {editing ? (
        <Editor
          apartment={editing}
          weights={state.weights}
          budget={state.budget}
          onChange={updateApartment}
          onDelete={deleteApartment}
          onClose={() => setEditId(null)}
        />
      ) : (
        <>
          <header className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-clay">
              Apartment Hunt
            </div>
            <h1 className="my-1 font-display text-[40px] font-black leading-[0.98] tracking-tight">
              The <em className="font-normal not-italic italic text-clay">Scorecard</em>
            </h1>
            <p className="max-w-[42ch] text-sm text-ink-soft">
              Rate each place as you tour it. Weighted totals rank them automatically — highest
              score wins the day.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addApartment}
                className="rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-paper transition-transform active:scale-95"
              >
                + Add a place
              </button>
              <button
                type="button"
                onClick={() => setShowPriorities((v) => !v)}
                className="rounded-xl border-[1.5px] border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-ink"
              >
                ⚖ Priorities
              </button>
              <button
                type="button"
                onClick={copySummary}
                className="rounded-xl border-[1.5px] border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-ink"
              >
                ⧉ Copy ranking
              </button>
            </div>
          </header>

          {showPriorities && (
            <Priorities
              weights={state.weights}
              budget={state.budget}
              onWeightChange={setWeight}
              onBudgetChange={setBudget}
            />
          )}

          {toast && <div className="mt-3 text-center text-[12.5px] text-ink-soft">{toast}</div>}

          {mounted && ranked.length === 0 ? (
            <div className="mt-2 rounded-2xl border-[1.5px] border-dashed border-line px-5 py-10 text-center text-ink-soft">
              <div className="mb-1.5 font-display text-[21px] italic text-ink">No places yet</div>
              Add the first apartment you&apos;re touring and start scoring.
            </div>
          ) : (
            ranked.map((apt, i) => (
              <RankCard
                key={apt.id}
                apartment={apt}
                weights={state.weights}
                budget={state.budget}
                rank={i + 1}
                isLead={i === 0 && !apt.dealbreaker && ratedCount(apt) > 0}
                onOpen={setEditId}
              />
            ))
          )}

          <div className="mt-6 text-center text-[11.5px] leading-relaxed text-ink-soft">
            Saved automatically on this device · scores update live as you rate
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Clear the toast when navigating (optional polish)**

Add inside `addApartment`, `copySummary` is fine as-is. To auto-dismiss the toast, append this effect after the persistence effect:
```tsx
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [toast]);
```

- [ ] **Step 3: Typecheck + build**

Run:
```bash
npx tsc --noEmit && npm run build
```
Expected: no type errors; production build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire home screen, persistence, copy ranking"
```

---

## Task 10: Full verification against acceptance criteria

**Files:** none (manual verification + final commit)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all scoring + storage tests PASS.

- [ ] **Step 2: Production build sanity**

Run: `npm run build`
Expected: succeeds with no type/lint errors.

- [ ] **Step 3: Manual smoke test in the browser**

Run: `npm run dev`, open the URL on a narrow viewport (DevTools device toolbar / phone). Verify each acceptance criterion:

- [ ] Loads on mobile width, matches the reference aesthetic, **no horizontal scroll**.
- [ ] Add a place → editor opens. Set name, rent, ratings, toggle check chips, notes, dealbreaker.
- [ ] Reload the page → name, rent, ratings, checks, notes, dealbreaker all persist.
- [ ] Score matches the spec formula: e.g. only Location rated 4 (weight High/3) → **80**.
- [ ] Home ranks places high→low; changing a weight in Priorities **re-ranks instantly**.
- [ ] A deal-breaker place sinks to the bottom, dimmed + struck-through, not the 🏆 front-runner.
- [ ] Set a budget below a place's rent → red "over budget" chip on its card and in the editor.
- [ ] "Copy ranking" puts a readable ranked summary on the clipboard.
- [ ] Empty state shows when all places are deleted.

- [ ] **Step 4: Fix any issues found, then final commit**

```bash
git add -A
git commit -m "test: verify acceptance criteria pass"
```

---

## Self-review notes (for the implementer)

- **Spec coverage:** Home/ranking (Task 9), Editor (Task 8), Priorities (Task 7), Copy ranking (Task 9), Dealbreaker handling (Tasks 3/6/9), Budget flag (Tasks 3/6/7/8/9), data model (Task 2), scoring (Task 3), persistence (Task 4), design (Tasks 5-8) — all mapped.
- **Scoring deviation from reference HTML is deliberate** (see Known decisions #1). If the user later wants the reference's all-categories denominator, change `score()` to add `max += 5 * w` for every category unconditionally and update the Task 3 tests.
- **Hydration safety:** state starts as `emptyState()` on server; real data and ranked list only render after `mounted` is true (Task 9), satisfying spec lines 18-20.
