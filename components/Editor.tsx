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
