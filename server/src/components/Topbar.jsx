import { useState, useEffect } from 'react';

export default function Topbar({ breadcrumb, onToggleSidebar }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <i className="fas fa-bars" />
        </button>
        <div className="topbar-breadcrumb">{breadcrumb}</div>
      </div>
      <div className="topbar-right">
        <div className="live-clock">{time}</div>
        <div className="backend-url-pill">
          <i className="fas fa-plug" />
          <span>localhost:3000</span>
        </div>
      </div>
    </header>
  );
}
