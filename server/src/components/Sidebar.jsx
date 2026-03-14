export default function Sidebar({
  activeView, onNavigate, incidentCount, sosCount,
  isOpen, dbStatus, lastUpdate, onRefresh, loading
}) {
  const navItems = [
    { id: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { id: 'map', icon: 'fa-map', label: 'Incident Map', badge: incidentCount },
    { id: 'incidents', icon: 'fa-file-alt', label: 'Reports' },
    { id: 'sos', icon: 'fa-exclamation-triangle', label: 'SOS Alerts', badge: sosCount, badgeDanger: true },
    { id: 'contacts', icon: 'fa-envelope', label: 'Messages' },
  ];

  const dbDotClass = dbStatus === 'connected' ? 'connected' : dbStatus ? 'error' : '';
  const dbLabel = dbStatus === 'connected' ? 'MongoDB Connected' :
                  dbStatus === 'connecting' ? 'Connecting…' : 'Disconnected';

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-mark"><i className="fas fa-server" /></div>
          <div>
            <span className="logo-title">City<span className="accent">Nexus</span></span>
            <span className="logo-sub">Server Dashboard</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeView === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <i className={`fas ${item.icon}`} />
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className={`nav-badge${item.badgeDanger ? ' danger' : ''}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className={`status-dot ${dbDotClass}`} />
          <span>{dbLabel}</span>
        </div>
        <div className="refresh-row">
          <button
            className={`refresh-btn${loading ? ' spinning' : ''}`}
            onClick={onRefresh}
          >
            <i className="fas fa-rotate-right" /> Refresh
          </button>
          <span className="last-update">
            {lastUpdate ? lastUpdate.toLocaleTimeString('en-GB', { hour12: false }) : '—'}
          </span>
        </div>
      </div>
    </aside>
  );
}
