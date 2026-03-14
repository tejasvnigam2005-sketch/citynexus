function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function Contacts({ contacts }) {
  return (
    <>
      <div className="view-header">
        <h1>Contact Messages</h1>
        <p>Messages submitted via the CityNexus contact form</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span><i className="fas fa-inbox" /> Inbox</span>
          <span className="record-count">{contacts.length} messages</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 && (
                <tr><td colSpan="6" className="loading-cell">No messages received yet</td></tr>
              )}
              {contacts.map((msg, i) => (
                <tr key={msg._id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{msg.name}</td>
                  <td style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{msg.email}</td>
                  <td><span className="type-badge type-infrastructure">{msg.subject}</span></td>
                  <td className="desc-cell">{msg.message}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{formatTime(msg.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
