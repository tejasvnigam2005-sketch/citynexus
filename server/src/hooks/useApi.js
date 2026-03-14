// Central API hook — all backend calls go through here
const API_BASE = 'http://localhost:3000';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    return res.json();
  },

  async getIncidents() {
    const res = await fetch(`${API_BASE}/api/incidents`);
    return res.json();
  },

  async updateIncidentStatus(id, status) {
    const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getSOSAlerts() {
    const res = await fetch(`${API_BASE}/api/sos`);
    return res.json();
  },

  async updateSOSStatus(id, status) {
    const res = await fetch(`${API_BASE}/api/sos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getDetections() {
    const res = await fetch(`${API_BASE}/api/detections`);
    return res.json();
  },

  async getContacts() {
    // Contact messages endpoint — we need to add a GET route for this
    const res = await fetch(`${API_BASE}/api/contacts`);
    return res.json();
  },
};

export default api;
