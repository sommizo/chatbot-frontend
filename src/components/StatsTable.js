import React from 'react';

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isPctKey = (k) => typeof k === 'string' && k.endsWith('_pct');
const stripPctSuffix = (k) => (typeof k === 'string' && k.endsWith('_pct') ? k.slice(0, -4) : k);
const includeKey = (k, usePercent) => !isPctKey(k) && (!usePercent || k !== 'total');
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace('%', '').replace(',', '.').trim());
    return Number.isFinite(n) ? n : v;
  }
  return v ?? '';
};

/**
 * StatsTable renders a 2D matrix where columns are months and rows are categories.
 * Expected data shape:
 * {
 *   '04-2025': { developer: 0, test: 0, total: 0 },
 *   '05-2025': { developer: 1, test: 0, total: 1 },
 *   ...
 * }
 * Rules:
 * - In percent mode (usePercent = true): use keys ending with *_pct, excluding total_pct.
 * - In non-percent mode: use raw keys (including 'total' if present).
 */
export default function StatsTable({ data, usePercent = false /*, chartType */ }) {
  if (!isPlainObject(data)) {
    return <div>Aucune donnée à afficher</div>;
  }

  const tableEntries = Object.entries(data);
  const looksMonthly = tableEntries.length > 0 && tableEntries.every(([, v]) => isPlainObject(v));

  if (!looksMonthly) {
    // Fallback: render simple two-column table for a flat map
    const entries = Object.entries(data);
    const flat = (usePercent
      ? entries
          .filter(([k]) => isPctKey(k) && stripPctSuffix(k) !== 'total')
          .map(([k, v]) => [stripPctSuffix(k), toNumber(v)])
      : entries
          .filter(([k]) => !isPctKey(k))
          .map(([k, v]) => [k, toNumber(v)])
    );
    if (flat.length === 0) return <div>Aucune donnée à afficher</div>;

    return (
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {flat.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Build columns (months) preserving input order
  const months = tableEntries.map(([month]) => month);

  // Build rows (categories) as union of keys across months
  const categorySet = new Set();
  tableEntries.forEach(([, values]) => {
    Object.keys(values || {}).forEach((k) => {
      if (usePercent) {
        if (isPctKey(k) && stripPctSuffix(k) !== 'total') categorySet.add(stripPctSuffix(k));
      } else {
        if (!isPctKey(k)) categorySet.add(k); // include 'total' in non-percent
      }
    });
  });
  const categories = Array.from(categorySet);

  if (categories.length === 0) return <div>Aucune donnée à afficher</div>;

  return (
    <div className="stats-table-container">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Catégorie</th>
            {months.map((m) => (
              <th key={m}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat}>
              <td>{cat}</td>
              {months.map((m) => (
                <td key={`${m}-${cat}`}>
                  {toNumber(usePercent ? (data[m]?.[`${cat}_pct`] ?? '') : (data[m]?.[cat] ?? ''))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
