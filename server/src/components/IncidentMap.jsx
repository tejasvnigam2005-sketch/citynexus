import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitBounds({ incidents }) {
  const map = useMap();
  useEffect(() => {
    const coords = incidents
      .filter(i => i.coordinates?.lat && i.coordinates?.lng)
      .map(i => [i.coordinates.lat, i.coordinates.lng]);
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 14 });
    }
  }, [incidents, map]);
  return null;
}

function getColor(incident) {
  if (incident.status === 'resolved') return '#64748b';
  if (incident.urgent) return '#ef4444';
  return '#f59e0b';
}

function getRadius(incident) {
  if (incident.urgent) return 14;
  return 10;
}

export default function IncidentMap({ incidents, height = '340px', showFit = false }) {
  const validIncidents = incidents.filter(i => i.coordinates?.lat && i.coordinates?.lng);

  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={12}
      style={{ height, width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; CARTO"
      />
      {showFit && <FitBounds incidents={validIncidents} />}
      {validIncidents.map((inc) => (
        <CircleMarker
          key={inc._id}
          center={[inc.coordinates.lat, inc.coordinates.lng]}
          radius={getRadius(inc)}
          pathOptions={{
            fillColor: getColor(inc),
            fillOpacity: 0.6,
            color: getColor(inc),
            weight: 2,
            opacity: 0.9,
          }}
        >
          <Popup>
            <h4 style={{ textTransform: 'capitalize', margin: '0 0 4px' }}>
              {inc.type} Incident
            </h4>
            <p style={{ margin: '2px 0' }}>{inc.description}</p>
            <p style={{ margin: '2px 0', opacity: 0.6, fontSize: '0.75rem' }}>
              📍 {inc.location}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '100px',
                background: inc.urgent ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color: inc.urgent ? '#ef4444' : '#f59e0b',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {inc.urgent ? '⚠ URGENT' : inc.status || 'pending'}
              </span>
            </p>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
