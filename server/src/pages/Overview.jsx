import IncidentMap from '../components/IncidentMap';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function Overview({ data, loading, onNavigate }) {
  const { stats, incidents } = data;
  const recentIncidents = incidents.slice(0, 8);

  // Type breakdown
  const typeCounts = {};
  incidents.forEach(inc => {
    typeCounts[inc.type] = (typeCounts[inc.type] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(typeCounts), 1);
  const typeColors = { traffic: '#3b82f6', crime: '#a855f7', infrastructure: '#f59e0b' };

  const urgentCount = incidents.filter(i => i.urgent).length;

  return (
    <>
      <div className="view-header">
        <h1>Command Overview</h1>
        <p>Live snapshot of all CityNexus systems</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ '--ic': '#e85d04' }}><i className="fas fa-file-alt" /></div>
          <div className="stat-card-body">
            <span className="stat-val">{stats?.totalIncidents ?? '—'}</span>
            <span className="stat-lbl">Total Incidents</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ '--ic': '#dc2626' }}><i className="fas fa-bolt" /></div>
          <div className="stat-card-body">
            <span className="stat-val">{urgentCount}</span>
            <span className="stat-lbl">Urgent Reports</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ '--ic': '#dc2626' }}><i className="fas fa-exclamation-triangle" /></div>
          <div className="stat-card-body">
            <span className="stat-val">{stats?.totalSOS ?? '—'}</span>
            <span className="stat-lbl">SOS Alerts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ '--ic': '#d97706' }}><i className="fas fa-car-burst" /></div>
          <div className="stat-card-body">
            <span className="stat-val">{stats?.totalDetections ?? '—'}</span>
            <span className="stat-lbl">AI Detections</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ '--ic': '#16a34a' }}><i className="fas fa-envelope" /></div>
          <div className="stat-card-body">
            <span className="stat-val">{stats?.totalContacts ?? '—'}</span>
            <span className="stat-lbl">Messages</span>
          </div>
        </div>
      </div>

      {/* Map + Recent list */}
      <div className="overview-grid">
        <div className="panel">
          <div className="panel-header">
            <span><i className="fas fa-map" /> Live Incident Map</span>
            <button className="panel-action" onClick={() => onNavigate('map')}>
              Expand <i className="fas fa-arrow-right" />
            </button>
          </div>
          <IncidentMap incidents={incidents} height="340px" />
          <div className="map-legend">
            <span className="legend-dot red" /><span>Urgent</span>
            <span className="legend-dot yellow" style={{ marginLeft: 16 }} /><span>Normal</span>
            <span className="legend-dot grey" style={{ marginLeft: 16 }} /><span>Resolved</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span><i className="fas fa-clock-rotate-left" /> Recent Reports</span>
            <button className="panel-action" onClick={() => onNavigate('incidents')}>
              View all <i className="fas fa-arrow-right" />
            </button>
          </div>
          <div className="recent-list">
            {loading && <div className="loading-row"><i className="fas fa-spinner fa-spin" /> Loading…</div>}
            {!loading && recentIncidents.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-inbox" />
                <p>No incidents reported yet</p>
              </div>
            )}
            {recentIncidents.map(inc => (
              <div className="recent-item" key={inc._id} onClick={() => onNavigate('incidents')}>
                <div className={`recent-dot ${inc.status === 'resolved' ? 'resolved' : inc.urgent ? 'urgent' : 'normal'}`} />
                <div className="recent-info">
                  <div className="recent-type">{inc.type}</div>
                  <div className="recent-loc">{inc.location}</div>
                </div>
                <div className="recent-time">{formatTime(inc.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="panel" style={{ marginTop: 24 }}>
        <div className="panel-header"><span><i className="fas fa-chart-bar" /> Incident Breakdown by Type</span></div>
        <div className="breakdown-bars">
          {Object.entries(typeCounts).length === 0 && !loading && (
            <div className="empty-state"><i className="fas fa-chart-bar" /><p>No data yet</p></div>
          )}
          {Object.entries(typeCounts).map(([type, count]) => (
            <div className="breakdown-row" key={type}>
              <span className="breakdown-label">{type}</span>
              <div className="breakdown-track">
                <div
                  className="breakdown-fill"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    background: typeColors[type] || '#64748b',
                  }}
                />
              </div>
              <span className="breakdown-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
