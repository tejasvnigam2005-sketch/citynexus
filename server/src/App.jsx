import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Overview from './pages/Overview';
import MapView from './pages/MapView';
import Incidents from './pages/Incidents';
import SOSAlerts from './pages/SOSAlerts';
import Contacts from './pages/Contacts';
import Toast from './components/Toast';
import api from './hooks/useApi';

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [data, setData] = useState({
    stats: null,
    incidents: [],
    sos: [],
    contacts: [],
    health: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, statsRes, incidentsRes, sosRes, contactsRes] = await Promise.allSettled([
        api.getHealth(),
        api.getStats(),
        api.getIncidents(),
        api.getSOSAlerts(),
        api.getContacts(),
      ]);

      setData({
        health: healthRes.status === 'fulfilled' ? healthRes.value : null,
        stats: statsRes.status === 'fulfilled' ? statsRes.value.stats : null,
        incidents: incidentsRes.status === 'fulfilled' ? (incidentsRes.value.incidents || []) : [],
        sos: sosRes.status === 'fulfilled' ? (sosRes.value.alerts || []) : [],
        contacts: contactsRes.status === 'fulfilled' ? (contactsRes.value.messages || []) : [],
      });
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('Failed to connect to backend', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      const res = await api.updateIncidentStatus(id, status);
      if (res.success) {
        showToast(`Incident status updated to "${status}"`);
        fetchAllData();
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleUpdateSOSStatus = async (id, status) => {
    try {
      const res = await api.updateSOSStatus(id, status);
      if (res.success) {
        showToast(`SOS alert ${status}`);
        fetchAllData();
      }
    } catch {
      showToast('Failed to update SOS', 'error');
    }
  };

  const viewLabels = {
    overview: 'Overview',
    map: 'Incident Map',
    incidents: 'Reports',
    sos: 'SOS Alerts',
    contacts: 'Messages',
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => { setActiveView(view); setSidebarOpen(false); }}
        incidentCount={data.incidents.length}
        sosCount={data.sos.filter(s => s.status === 'activated').length}
        isOpen={sidebarOpen}
        dbStatus={data.health?.database}
        lastUpdate={lastUpdate}
        onRefresh={fetchAllData}
        loading={loading}
      />

      <main className="main-panel">
        <Topbar
          breadcrumb={viewLabels[activeView]}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="view-container">
          {activeView === 'overview' && (
            <Overview
              data={data}
              loading={loading}
              onNavigate={setActiveView}
            />
          )}
          {activeView === 'map' && (
            <MapView incidents={data.incidents} />
          )}
          {activeView === 'incidents' && (
            <Incidents
              incidents={data.incidents}
              onUpdateStatus={handleUpdateIncidentStatus}
            />
          )}
          {activeView === 'sos' && (
            <SOSAlerts
              alerts={data.sos}
              onUpdateStatus={handleUpdateSOSStatus}
            />
          )}
          {activeView === 'contacts' && (
            <Contacts contacts={data.contacts} />
          )}
        </div>
      </main>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

export default App;
