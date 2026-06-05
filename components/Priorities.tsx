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
