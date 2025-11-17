import React, { useState } from 'react';
import StatsChart from './StatsChart';
import StatsTable from './StatsTable';
import StatsText from './StatsText';

// Formatters FR pour date et heure complètes
const FR_DATE = typeof Intl !== 'undefined'
  ? new Intl.DateTimeFormat('fr-FR', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' })
  : { format: (d) => d.toLocaleDateString() };

const FR_TIME = typeof Intl !== 'undefined'
  ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
  : { format: (d) => `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` };

// Parsing robuste de différents formats de timestamp
const parseTimestamp = (ts) => {
  if (ts === null || ts === undefined) return null;
  try {
    if (ts instanceof Date) {
      const d = new Date(ts.getTime());
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof ts === 'number') {
      const ms = ts < 1e11 ? ts * 1000 : ts; // secondes ou millisecondes
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof ts === 'string') {
      const s = ts.trim();
      if (!s) return null;
      // chaîne numérique (epoch)
      if (/^\d{10,}$/.test(s)) {
        const num = parseInt(s, 10);
        const ms = num < 1e11 ? num * 1000 : num;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      // ISO ou formats reconnus par Date.parse
      const parsed = Date.parse(s);
      if (!Number.isNaN(parsed)) {
        const d = new Date(parsed);
        return isNaN(d.getTime()) ? null : d;
      }
      // Format FR: DD/MM/YYYY HH:mm[:ss] (ou juste date)
      const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
      if (m) {
        const [, dd, mm, yyyy, HH = '0', MM = '0', SS = '0'] = m;
        const d = new Date(
          Number(yyyy),
          Number(mm) - 1,
          Number(dd),
          Number(HH),
          Number(MM),
          Number(SS)
        );
        return isNaN(d.getTime()) ? null : d;
      }
    }
  } catch (_) {
    // ignore et fallback
  }
  return null;
};

// Formattage: aujourd'hui => HH:mm ; sinon => "DATE à HEURE" (sans secondes). Fallback: chaîne brute.
const isToday = (d) => {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const formatTimestamp = (ts) => {
  const d = parseTimestamp(ts);
  if (!d) return ts ? String(ts) : '';
  if (isToday(d)) {
    return `${FR_TIME.format(d)}`; // HH:mm
  }
  return `${FR_DATE.format(d)} à ${FR_TIME.format(d)}`;
};

const Message = ({ message }) => {
  const type = (message.type || (message.sender === 'user' ? 'USER' : 'BOT')).toUpperCase();
  const senderClass = message.sender || (type === 'USER' ? 'user' : 'bot');
  const contentIsArray = Array.isArray(message?.content);
  const visualItems = contentIsArray ? (message.content || []).filter((it) => it && (it.render === 'chart' || it.render === 'chart_pct' || it.render === 'table')) : [];

  // Local overrides for visual items (per index): { [idx]: { chartType?: 'bar'|'pie'|'table'|'text', usePercent?: boolean } }
  const [overrides, setOverrides] = useState({});

  const setChartType = (idx, chartType) => {
    setOverrides((prev) => ({ ...prev, [idx]: { ...(prev[idx] || {}), chartType } }));
  };
  const togglePercent = (idx) => {
    setOverrides((prev) => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), usePercent: !(prev[idx]?.usePercent ?? (visualItems[idx]?.render === 'chart_pct')) },
    }));
  };

  return (
    <div className={`message ${senderClass}`}>
      <div className="message-content">
        {visualItems.length > 0 ? (
          <>
            {visualItems.map((item, idx) => {
              const dataObj = item.data || item.content || {};
              // Detect if percent keys exist (non-total *_pct) at top-level or inside monthly rows
              const hasPct = (() => {
                if (!dataObj || typeof dataObj !== 'object') return false;
                const scan = (obj) => {
                  const entries = Object.entries(obj || {});
                  if (entries.length === 0) return false;
                  const isMonthly = entries.every(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
                  if (isMonthly) {
                    return entries.some(([, v]) => Object.keys(v || {}).some((k) => typeof k === 'string' && k.endsWith('_pct') && k.slice(0, -4) !== 'total'));
                  }
                  return entries.some(([k]) => typeof k === 'string' && k.endsWith('_pct') && k.slice(0, -4) !== 'total');
                };
                // check root and optional dataTable wrapper
                if (scan(dataObj)) return true;
                if (dataObj && typeof dataObj.dataTable === 'object' && dataObj.dataTable) {
                  return scan(dataObj.dataTable);
                }
                return false;
              })();
              // Detect if data is a 2D matrix (monthly table) either at root or under dataTable
              const isMatrix = (() => {
                const pickTableSrc = (obj) => (obj && typeof obj.dataTable === 'object' && obj.dataTable) ? obj.dataTable : obj;
                const src = pickTableSrc(dataObj);
                if (!src || typeof src !== 'object') return false;
                const entries = Object.entries(src || {});
                return entries.length > 0 && entries.every(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
              })();
              const baseChartType = (() => {
                const raw = String(item.chartType || '').toLowerCase();
                let ct = 'bar';
                if (item.render === 'table' || raw === 'table') ct = 'table';
                else if (raw === 'pie' || raw === 'bar' || raw === 'text') ct = raw;
                // Do not allow pie for matrix data
                if (isMatrix && ct === 'pie') ct = 'bar';
                return ct;
              })();
              let effectiveChartType = String(overrides[idx]?.chartType || baseChartType);
              if (isMatrix && effectiveChartType === 'pie') effectiveChartType = 'bar';
              const baseUsePercent = (item.render === 'chart_pct') && hasPct;
              const effectiveUsePercent = overrides[idx]?.usePercent ?? baseUsePercent;

              const isTableType = effectiveChartType === 'table';
              const isTextType = effectiveChartType === 'text';

              return (
                <div className="message-chart" key={`visual-${idx}`}>
                  {/* Controls to switch visualization */}
                  <div className="chart-controls" role="toolbar" aria-label="Changer le format d'affichage">
                    <button
                      className={`chart-btn ${effectiveChartType === 'bar' ? 'active' : ''}`}
                      title="Barres"
                      onClick={() => setChartType(idx, 'bar')}
                      type="button"
                    >
                      {/* bars icon */}
                      <span aria-hidden>▮▮▮</span>
                    </button>
                    {!isMatrix && (
                      <button
                        className={`chart-btn ${effectiveChartType === 'pie' ? 'active' : ''}`}
                        title="Camembert"
                        onClick={() => setChartType(idx, 'pie')}
                        type="button"
                      >
                        {/* pie icon */}
                        <span aria-hidden>◔</span>
                      </button>
                    )}
                    <button
                      className={`chart-btn ${isTableType ? 'active' : ''}`}
                      title="Tableau"
                      onClick={() => setChartType(idx, 'table')}
                      type="button"
                    >
                      {/* table icon */}
                      <span aria-hidden>▦</span>
                    </button>
                    <button
                      className={`chart-btn ${isTextType ? 'active' : ''}`}
                      title="Texte"
                      onClick={() => setChartType(idx, 'text')}
                      type="button"
                    >
                      {/* text icon */}
                      <span aria-hidden>Aa</span>
                    </button>
                    {hasPct && (
                      <button
                        className={`chart-btn toggle ${effectiveUsePercent ? 'active' : ''}`}
                        title="Afficher en pourcentage"
                        onClick={() => togglePercent(idx)}
                        type="button"
                      >
                        %
                      </button>
                    )}
                  </div>

                  {item.title && (
                    <div className="message-title"><strong>{item.title}</strong></div>
                  )}

                  {/* Render according to effective type */}
                  {!isTableType && !isTextType && (
                    <StatsChart
                      data={item.data || item.content || {}}
                      chartType={effectiveChartType || 'bar'}
                      usePercent={effectiveUsePercent}
                    />
                  )}
                  {isTableType && (
                    <StatsTable
                      data={item.data || item.content || {}}
                      chartType={effectiveChartType}
                      usePercent={effectiveUsePercent}
                    />
                  )}
                  {isTextType && (
                    <StatsText
                      data={item.data || item.content || {}}
                      usePercent={effectiveUsePercent}
                    />
                  )}
                </div>
              );
            })}
            <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
            {message.cypherQuery && (
              <div className="message-details">
                <small>{message.cypherQuery}</small>
                {message.executionTime && <small> | Temps: {message.executionTime}ms</small>}
                {message.dataCount !== undefined && <small> | Résultats: {message.dataCount}</small>}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="message-text">{message.text || String(message.content || '')}</div>
            <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
            {message.cypherQuery && (
              <div className="message-details">
                <small>{message.cypherQuery}</small>
                {message.executionTime && <small> | Temps: {message.executionTime}ms</small>}
                {message.dataCount !== undefined && <small> | Résultats: {message.dataCount}</small>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Message;