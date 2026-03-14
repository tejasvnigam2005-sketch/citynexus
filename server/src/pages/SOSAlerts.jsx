function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function SOSAlerts({ alerts, onUpdateStatus }) {
  return (
    <>
      <div className="view-header">
        <h1>SOS Alerts</h1>
        <p>Emergency SOS dispatches triggered from the city platform</p>
      </div>

      {alerts.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-shield-halved" />
          <p>No SOS alerts recorded</p>
        </div>
      )}

      <div className="sos-grid">
        {alerts.map((sos) => {
          const cardClass = sos.status === 'cancelled' ? 'cancelled' :
                            sos.status === 'resolved' ? 'resolved-sos' : '';
          return (
            <div className={`sos-card ${cardClass}`} key={sos._id}>
              <div className="sos-card-header">
                <div className="sos-card-title">
                  <i className="fas fa-exclamation-triangle" />
                  SOS Alert
                </div>
                <span className={`badge badge-${sos.status}`}>{sos.status}</span>
              </div>
              <div className="sos-card-body">
                <div className="sos-meta"><i className="fas fa-map-marker-alt" />{sos.locationText || 'Unknown'}</div>
                {sos.coordinates?.lat && (
                  <div className="sos-meta"><i className="fas fa-crosshairs" />{sos.coordinates.lat}, {sos.coordinates.lng}</div>
                )}
                <div className="sos-meta"><i className="fas fa-clock" />{formatTime(sos.createdAt)}</div>
                {sos.cancelledAt && (
                  <div className="sos-meta"><i className="fas fa-ban" />Cancelled: {formatTime(sos.cancelledAt)}</div>
                )}
              </div>
              {sos.status === 'activated' && (
                <div className="sos-actions">
                  <button className="sos-action-btn resolve" onClick={() => onUpdateStatus(sos._id, 'dispatched')}>
                    <i className="fas fa-truck-medical" /> Dispatch
                  </button>
                  <button className="sos-action-btn resolve" onClick={() => onUpdateStatus(sos._id, 'resolved')}>
                    <i className="fas fa-check" /> Resolve
                  </button>
                </div>
              )}
              {sos.status === 'dispatched' && (
                <div className="sos-actions">
                  <button className="sos-action-btn resolve" onClick={() => onUpdateStatus(sos._id, 'resolved')}>
                    <i className="fas fa-check" /> Mark Resolved
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
