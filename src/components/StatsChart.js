import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * StatsChart renders statistics as Bar or Pie chart based on metadata.chartType
 * Props:
 * - data: object that can be one of:
 *   1) monthly table: { '04-2025': { developer: 1, test: 0, ... }, '05-2025': { ... } }
 *   2) flat map: { developer: 6, test: 1, ... , total?: 9, developer_pct?: '66,67%' }
 * - chartType: 'bar' | 'pie'
 */
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

// helper: exclude keys that end with _pct
const isPctKey = (k) => typeof k === 'string' && k.endsWith('_pct');
const stripPctSuffix = (k) => (typeof k === 'string' && k.endsWith('_pct') ? k.slice(0, -4) : k);
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

// French number formatter for labels
const FR_NUMBER = typeof Intl !== 'undefined'
  ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
  : { format: (n) => String(Math.round((n + Number.EPSILON) * 100) / 100) };

// Custom label renderer for Pie slices (outside labels)
const RADIAN = Math.PI / 180;
const makePieLabelRenderer = (usePercent) => ({ cx, cy, midAngle, outerRadius, name, value, index }) => {
  if (value == null || value === 0) return null;
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? 'start' : 'end';
  const valText = usePercent ? `${FR_NUMBER.format(value)}%` : FR_NUMBER.format(value);
  const sliceColor = COLORS[index % COLORS.length];
  const textColor = usePercent ? sliceColor : '#374151';
  return (
    <text x={x} y={y} fill={textColor} textAnchor={textAnchor} dominantBaseline="central" fontSize={12}>
      {`${name}: ${valText}`}
    </text>
  );
};

function StatsChart({ data, chartType = 'bar', usePercent = false }) {
  if (!data || typeof data !== 'object') {
    return <div>Aucune donnée à afficher</div>;
  }

  // Unwrap possible shapes
  const gdSource =  data;

  // Build a filtered flat map candidate
  let flatMap = null;
  if (usePercent) {
    const pctEntries = Object.entries(gdSource || {})
      .filter(([k]) => isPctKey(k) && stripPctSuffix(k) !== 'total');
    if (pctEntries.length > 0) {
      flatMap = Object.fromEntries(pctEntries.map(([k, v]) => [stripPctSuffix(k), toNumber(v)]));
    }
  } else {
    const flatEntries = Object.entries(gdSource || {})
      .filter(([k]) => !isPctKey(k)); // keep 'total' for non-percent
    if (flatEntries.length > 0) {
      flatMap = Object.fromEntries(flatEntries);
    }
  }

  // Monthly table can be given under data.dataTable or directly on root
  const tableSrc = isPlainObject(data.dataTable) ? data.dataTable : data;
  const tableEntries = Object.entries(tableSrc || {});
  const looksMonthly = tableEntries.length > 0 && tableEntries.every(([, v]) => isPlainObject(v));

  // Prepare monthly rows and categories if monthly table detected
  let monthlyRows = [];
  let monthlyCategories = [];
  if (looksMonthly) {
    monthlyRows = tableEntries.map(([month, values]) => {
      const pairs = Object.entries(values || {})
        .map(([key, val]) => {
          if (usePercent) {
            if (isPctKey(key) && stripPctSuffix(key) !== 'total') {
              return [stripPctSuffix(key), toNumber(val)];
            }
            return null;
          }
          if (!isPctKey(key)) return [key, toNumber(val)]; // include 'total' in non-percent
          return null;
        })
        .filter(Boolean);
      const filtered = Object.fromEntries(pairs);
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

  const yAxisProps = usePercent ? { domain: [0, 100], tickFormatter: (v) => `${v}%` } : {};
  const tooltipFormatter = usePercent ? (value) => `${value}%` : undefined;

  // PIE CHART
  if (chartType === 'pie') {
    // If usePercent, build from percent flat map;
    const source = (flatMap || {});
    const pieKeys = Object.keys(source || {});
    if (pieKeys.length === 0) {
      return <div>Aucune donnée à afficher</div>;
    }
    const pieData = pieKeys.map((k) => ({ name: k, value: toNumber(source[k]) }));

    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={makePieLabelRenderer(usePercent)}
            labelLine
          >
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
          <YAxis {...yAxisProps} />
          <Tooltip formatter={tooltipFormatter} />
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
      .map(([name, value]) => ({ name, value: toNumber(value) }));

    if (rows.length === 0) {
      return <div>Aucune donnée à afficher</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={rows}>
          <XAxis dataKey="name" />
          <YAxis {...yAxisProps} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Bar dataKey="value" fill={COLORS[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <div>Aucune donnée à afficher</div>;
}

export default StatsChart;