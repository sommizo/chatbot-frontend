import React from 'react';

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isPctKey = (k) => typeof k === 'string' && k.endsWith('_pct');
const stripPctSuffix = (k) => (typeof k === 'string' && k.endsWith('_pct') ? k.slice(0, -4) : k);

const toNumber = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace('%', '').replace(',', '.').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const FR_NUMBER = typeof Intl !== 'undefined'
  ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
  : { format: (n) => String(Math.round((n + Number.EPSILON) * 100) / 100) };

function formatValueForText(v, usePercent) {
  // Keep user-provided % when present; otherwise format.
  if (usePercent) {
    if (typeof v === 'string' && v.includes('%')) return v.replace('.', ',');
    const n = toNumber(v);
    return n == null ? '' : `${FR_NUMBER.format(n)}%`;
    }
  const n = toNumber(v);
  if (n == null) return typeof v === 'string' ? v : '';
  return FR_NUMBER.format(n);
}

/**
 * StatsText renders the same data as StatsChart/StatsTable, but as compact text.
 * - Monthly matrix: one line per catégorie => "cat: 04-2025=0 · 05-2025=1 · 06-2025=9"
 * - Flat map: one line per clé => "cat: valeur"
 * Percent rule: exclude totals only in percent mode.
 */
export default function StatsText({ data, usePercent = false }) {
  if (!isPlainObject(data)) return <div className="stats-text">Aucune donnée à afficher</div>;

  const entries = Object.entries(data);
  const looksMonthly = entries.length > 0 && entries.every(([, v]) => isPlainObject(v));

  if (looksMonthly) {
    const months = entries.map(([m]) => m);
    const categorySet = new Set();
    entries.forEach(([, row]) => {
      Object.keys(row || {}).forEach((k) => {
        if (usePercent) {
          if (isPctKey(k) && stripPctSuffix(k) !== 'total') categorySet.add(stripPctSuffix(k));
        } else {
          if (!isPctKey(k)) categorySet.add(k); // include total in non-percent
        }
      });
    });
    const categories = Array.from(categorySet);
    if (categories.length === 0) return <div className="stats-text">Aucune donnée à afficher</div>;

    const lines = categories.map((cat) => {
      const parts = months.map((m) => {
        const key = usePercent ? `${cat}_pct` : cat;
        const val = (data[m] || {})[key];
        return `${m}=${formatValueForText(val, usePercent)}`;
      });
      return `${cat}: ${parts.join(' · ')}`;
    });

    return (
      <div className="stats-text">
        <pre>{lines.join('\n')}</pre>
      </div>
    );
  }

  // Flat map
  const flat = (usePercent
    ? entries.filter(([k]) => isPctKey(k) && stripPctSuffix(k) !== 'total').map(([k, v]) => [stripPctSuffix(k), v])
    : entries.filter(([k]) => !isPctKey(k))
  );
  if (flat.length === 0) return <div className="stats-text">Aucune donnée à afficher</div>;

  const lines = flat.map(([k, v]) => `${k}: ${formatValueForText(v, usePercent)}`);
  return (
    <div className="stats-text">
      <pre>{lines.join('\n')}</pre>
    </div>
  );
}
