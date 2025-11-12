import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * StatsChart renders statistics as Bar or Pie chart based on metadata.chartType
 * Props:
 * - data: object that can be one of:
 *   1) monthly table: { '04-2025': { developer: 1, test: 0, ... }, '05-2025': { ... } }
 *   2) flat map: { developer: 6, test: 1, ... , total?: 9, developer_pct?: '66,67%' }
 *   3) { globalDistribution: { ...flat map... } }
 * - chartType: 'bar' | 'pie'
 */
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

// helper: exclude keys that end with _pct
const isPctKey = (k) => typeof k === 'string' && k.endsWith('_pct');
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // replace comma with dot and strip percent sign if present
    const cleaned = v.replace('%', '').replace(',', '.').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

function StatsChart({ data, chartType = 'bar' }) {
  if (!data || typeof data !== 'object') {
    return <div>Aucune donnée à afficher</div>;
  }

  // Unwrap possible shapes
  const hasGD = isPlainObject(data.globalDistribution);
  const gdSource = hasGD ? data.globalDistribution : data;

  // Build a filtered flat map candidate (ignore *_pct, total, and reserved keys)
  const flatCandidates = Object.entries(gdSource || {})
    .filter(([k]) => k !== 'globalDistribution' && !isPctKey(k) && k !== 'total');
  const isFlatMap = flatCandidates.length > 0 && flatCandidates.every(([, v]) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''));
  const flatMap = isFlatMap ? Object.fromEntries(flatCandidates) : null;

  // Monthly table can be given under data.dataTable or directly on root
  const tableSrc = isPlainObject(data.dataTable) ? data.dataTable : data;
  const tableEntries = Object.entries(tableSrc || {}).filter(([k]) => k !== 'globalDistribution');
  const looksMonthly = tableEntries.length > 0 && tableEntries.every(([, v]) => isPlainObject(v));

  // Prepare monthly rows and categories if monthly table detected
  let monthlyRows = [];
  let monthlyCategories = [];
  if (looksMonthly) {
    monthlyRows = tableEntries.map(([month, values]) => {
      const filtered = Object.entries(values || {})
        .filter(([key]) => !isPctKey(key) && key !== 'total')
        .reduce((acc, [key, val]) => {
          acc[key] = toNumber(val);
          return acc;
        }, {});
      return { month, ...filtered };
    });

    const categorySet = new Set();
    monthlyRows.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== 'month') categorySet.add(k);
      });
    });
    monthlyCategories = Array.from(categorySet);
  }

  // PIE CHART
  if (chartType === 'pie') {
    // Prefer globalDistribution if provided; otherwise, use flat map
    const source = hasGD ? data.globalDistribution : (flatMap || {});
    const pieKeys = Object.keys(source || {}).filter((k) => !isPctKey(k) && k !== 'total');
    if (pieKeys.length === 0) {
      return <div>Aucune donnée à afficher</div>;
    }
    const pieData = pieKeys.map((k) => ({ name: k, value: toNumber(source[k]) }));

    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {pieData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // BAR CHART
  if (looksMonthly && monthlyRows.length > 0 && monthlyCategories.length > 0) {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={monthlyRows}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {monthlyCategories.map((key, idx) => (
            <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Flat map as single-series bar chart
  if (flatMap) {
    const rows = Object.entries(flatMap)
      .filter(([k]) => !isPctKey(k) && k !== 'total')
      .map(([name, value]) => ({ name, value: toNumber(value) }));

    if (rows.length === 0) {
      return <div>Aucune donnée à afficher</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={rows}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill={COLORS[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <div>Aucune donnée à afficher</div>;
}

export default StatsChart;