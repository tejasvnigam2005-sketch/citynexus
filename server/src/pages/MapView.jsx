import { useState, useMemo } from 'react';
import IncidentMap from '../components/IncidentMap';

export default function MapView({ incidents }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return incidents;
    if (filter === 'urgent') return incidents.filter(i => i.urgent);
    if (filter === 'resolved') return incidents.filter(i => i.status === 'resolved');
    return incidents.filter(i => i.type === filter);
  }, [incidents, filter]);

  const filters = ['all', 'urgent', 'traffic', 'crime', 'infrastructure', 'resolved'];

  return (
    <>
      <div className="view-header">
        <h1>Incident Heatmap</h1>
        <p>All reported incidents — red = urgent, yellow = normal, grey = resolved</p>
      </div>

      <div className="map-toolbar">
        <div className="filter-group">
          <label>Filter:</label>
          {filters.map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <IncidentMap incidents={filtered} height="calc(100vh - 280px)" showFit />

      <div className="map-legend full-legend">
        <span className="legend-dot red" /><span>Urgent / Serious</span>
        <span className="legend-dot yellow" /><span>Normal</span>
        <span className="legend-dot grey" /><span>Resolved</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', opacity: 0.5 }}>
          {filtered.length} incidents
        </span>
      </div>
    </>
  );
}
