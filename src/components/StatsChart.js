import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * StatsChart renders statistics as Bar or Pie chart based on metadata.chartType
 * Props:
 * - data: object where keys are months (e.g., "04-2025") and value is per-category counts
 *         plus optional key "globalDistribution" for pie chart
 * - chartType: 'bar' | 'pie'
 */
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

// helper: exclude keys that end with _pct
const isPctKey = (k) => typeof k === 'string' && k.endsWith('_pct');

function StatsChart({ data, chartType = 'bar' }) {
  if (!data || typeof data !== 'object') {
    return <div>Aucune donnée à afficher</div>;
  }

  // Build monthly rows excluding globalDistribution and keys that end with _pct
  const columnEntries = Object.entries(data || {})
      .filter(([k]) => k !== 'globalDistribution')
      .map(([month, values]) => {
        if (!values || typeof values !== 'object') return { month };
        const filtered = Object.entries(values)
            .filter(([key]) => !isPctKey(key))
            .reduce((acc, [key, val]) => {
              acc[key] = val;
              return acc;
            }, {});
        return { month, ...filtered };
      });

  // Build category set from monthly rows, excluding 'month' and _pct keys (already removed)
  const categorySet = new Set();
  columnEntries.forEach((row) => {
    Object.keys(row).forEach((k) => {
      if (k !== 'month') categorySet.add(k);
    });
  });

  // Include keys from globalDistribution but exclude *_pct and 'total' if you prefer
  const gd = (data && typeof data === 'object' && data.globalDistribution && typeof data.globalDistribution === 'object') ? data.globalDistribution : {};
  Object.keys(gd || {})
      .filter((k) => !isPctKey(k))
      .forEach((k) => categorySet.add(k));

  const categories = Array.from(categorySet).filter((c) => c !== 'month');

  if (columnEntries.length === 0 && categories.length === 0) {
    return <div>Aucune donnée à afficher</div>;
  }

  if (chartType === 'pie') {
    const pieData = categories.map((k) => ({ name: k, value: Number(gd[k] || 0) }));

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

  return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={columnEntries}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {categories.map((key, idx) => (
              <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
  );
}

export default StatsChart;