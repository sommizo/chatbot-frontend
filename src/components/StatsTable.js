import React from 'react';

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isPctKey = (k) => typeof k === 'string' && k.endsWith('_pct');
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
 * Any keys ending with _pct and the key 'total' are ignored.
 */
export default function StatsTable({ data /*, chartType */ }) {
  if (!isPlainObject(data)) {
    return <div>Aucune donnée à afficher</div>;
  }

  const tableEntries = Object.entries(data).filter(([k]) => k !== 'globalDistribution');
  const looksMonthly = tableEntries.length > 0 && tableEntries.every(([, v]) => isPlainObject(v));

  if (!looksMonthly) {
    // Fallback: render simple two-column table for a flat map
    const flat = Object.entries(data)
      .filter(([k]) => !isPctKey(k) && k !== 'total')
      .map(([k, v]) => [k, toNumber(v)]);
    if (flat.length === 0) return <div>Aucune donnée à afficher</div>;

    return (
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
    );
  }

  // Build columns (months) preserving input order
  const months = tableEntries.map(([month]) => month);

  // Build rows (categories) as union of keys across months, filtering out *_pct and total
  const categorySet = new Set();
  tableEntries.forEach(([, values]) => {
    Object.keys(values || {}).forEach((k) => {
      if (!isPctKey(k) && k !== 'total') categorySet.add(k);
    });
  });
  const categories = Array.from(categorySet);

  if (categories.length === 0) return <div>Aucune donnée à afficher</div>;

  return (
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
              <td key={`${m}-${cat}`}>{toNumber(data[m]?.[cat] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
