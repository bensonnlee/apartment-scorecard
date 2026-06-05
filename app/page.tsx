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

  // Auto-dismiss toast after 2.5 seconds.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [toast]);

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
