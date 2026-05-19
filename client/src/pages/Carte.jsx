import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import { BienBadge, fCFA } from '../components/UI';

const STATUT_COLORS = { occupe: '#40916c', vacant: '#c4622d', maintenance: '#c9a84c' };

export default function Carte() {
  const [biens, setBiens] = useState([]);

  useEffect(() => { api.get('/biens').then(r => setBiens(r.data)); }, []);

  const withCoords = biens.filter(b => b.latitude && b.longitude);

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Carte interactive</span></div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['occupe','Occupé'],['vacant','Vacant'],['maintenance','Maintenance']].map(([s, label]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: STATUT_COLORS[s] }} />
              {label} ({biens.filter(b => b.statut === s).length})
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-3)' }}>
            📍 {withCoords.length} / {biens.length} biens géolocalisés
          </div>
        </div>

        {/* Carte */}
        <div className="map-container">
          <MapContainer center={[5.345, -4.01]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {withCoords.map(b => (
              <CircleMarker
                key={b.id}
                center={[b.latitude, b.longitude]}
                radius={10}
                pathOptions={{
                  fillColor: STATUT_COLORS[b.statut] || '#888',
                  color: '#fff', weight: 2, fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{b.nom}</div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                      📍 {b.quartier} · {b.type} {b.superficie ? `· ${b.superficie} m²` : ''}
                    </div>
                    {b.description && (
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontStyle: 'italic' }}>
                        {b.description.slice(0, 80)}...
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#1a3d2b' }}>{fCFA(b.loyer)}/mois</span>
                    </div>
                    {b.locataire_nom && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 12, color: '#555' }}>
                        👤 {b.locataire_nom}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          Cliquez sur un marqueur pour voir les détails · Ajoutez les coordonnées GPS lors de la création d'un bien
        </p>
      </div>
    </>
  );
}
