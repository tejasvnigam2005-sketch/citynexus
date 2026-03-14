import { useState } from 'react';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function Incidents({ incidents, onUpdateStatus }) {
  const [modal, setModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const openModal = (inc) => {
    setModal(inc);
    setNewStatus(inc.status);
  };

  const handleSave = () => {
    if (modal && newStatus) {
      onUpdateStatus(modal._id, newStatus);
      setModal(null);
    }
  };

  return (
    <>
      <div className="view-header">
        <h1>Incident Reports</h1>
        <p>All reports submitted through the CityNexus incident form</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span><i className="fas fa-table" /> All Reports</span>
          <span className="record-count">{incidents.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Location</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Filed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 && (
                <tr><td colSpan="8" className="loading-cell">No incidents reported yet</td></tr>
              )}
              {incidents.map((inc, idx) => (
                <tr key={inc._id}>
                  <td>{idx + 1}</td>
                  <td><span className={`type-badge type-${inc.type}`}>{inc.type}</span></td>
                  <td>{inc.location}</td>
                  <td className="desc-cell">{inc.description}</td>
                  <td><span className={`badge ${inc.urgent ? 'badge-urgent' : 'badge-normal'}`}>{inc.urgent ? 'URGENT' : 'NORMAL'}</span></td>
                  <td><span className={`badge badge-${inc.status}`}>{inc.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{formatTime(inc.createdAt)}</td>
                  <td><button className="action-btn" onClick={() => openModal(inc)}>Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Incident Details</h2>
              <button className="modal-close" onClick={() => setModal(null)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="modal-detail">
                <div className="modal-row"><span className="modal-label">Type</span><span className="modal-value" style={{ textTransform: 'capitalize' }}>{modal.type}</span></div>
                <div className="modal-row"><span className="modal-label">Location</span><span className="modal-value">{modal.location}</span></div>
                <div className="modal-row"><span className="modal-label">Description</span><span className="modal-value">{modal.description}</span></div>
                <div className="modal-row"><span className="modal-label">Severity</span><span className="modal-value">{modal.urgent ? '⚠ URGENT' : 'Normal'}</span></div>
                <div className="modal-row"><span className="modal-label">Status</span><span className="modal-value"><span className={`badge badge-${modal.status}`}>{modal.status}</span></span></div>
                <div className="modal-row"><span className="modal-label">Filed At</span><span className="modal-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{formatTime(modal.createdAt)}</span></div>
                {modal.coordinates?.lat && (
                  <div className="modal-row"><span className="modal-label">GPS</span><span className="modal-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{modal.coordinates.lat}, {modal.coordinates.lng}</span></div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 8 }}>Status:</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved</option>
              </select>
              <button className="btn-save" onClick={handleSave}>Save</button>
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
