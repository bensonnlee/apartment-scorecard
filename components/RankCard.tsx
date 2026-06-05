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
