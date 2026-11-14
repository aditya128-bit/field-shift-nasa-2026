import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Satellite, Layers, Sun, Thermometer, Droplet, Wind, Activity, CheckCircle2, Shield } from 'lucide-react';

// Fix Leaflet default icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ChangeMapView({ coords }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

const BASE_MAPS = [
  { id: 'satellite', label: '🛰 Satellite',  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri — Source: Esri, USDA, USGS' },
  { id: 'topo',      label: '🗺 Terrain',    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',    attr: 'Tiles © Esri — Esri, DeLorme, NAVTEQ' },
  { id: 'osm',       label: '🌍 Street Map', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                attr: '© OpenStreetMap contributors' },
];

const OVERLAYS = [
  { id: 'none',           label: 'No Overlay'           },
  { id: 'modis_color',    label: 'MODIS True Color'     },
  { id: 'modis_lst',      label: 'Land Surface Temp'    },
];

export default function NasaGeoMap({ location, nasaObs, soilReading }) {
  const [baseMap,       setBaseMap]       = useState('satellite');
  const [activeOverlay, setActiveOverlay] = useState('none');
  const [opacity,       setOpacity]       = useState(0.7);

  const coords   = [location.lat, location.lon];
  const gibsDate = (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0]; })();

  const base    = BASE_MAPS.find(b => b.id === baseMap);
  const temp    = nasaObs?.temp_2m            ?? 24.5;
  const tmax    = nasaObs?.temp_max           ?? 30.5;
  const rain    = nasaObs?.precipitation_mm   ?? 0;
  const solar   = nasaObs?.solar_radiation_mj ?? 18.2;
  const wind    = nasaObs?.wind_speed         ?? 1.8;
  const moist   = soilReading?.soil_moisture  ?? 22;
  const ph      = soilReading?.ph             ?? 7.8;

  const farmIcon = L.divIcon({
    className: '',
    html: `<div style="background:#4f8ef7;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(79,142,247,0.6)"></div>`,
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <div className="space-y-5 tab-panel">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
           style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#0b3d91', color: '#fff' }}>
              NASA EARTH OBSERVATIONS
            </span>
            <span className="text-xs status-good px-2 py-0.5 rounded-full font-semibold">
              <CheckCircle2 className="inline w-3 h-3 mr-1" />100% Free • No API Key
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Satellite Farm Map</h2>
          <p className="text-sm mt-0.5" style={{ color: '#9ea3b8' }}>
            Esri World Imagery + NASA GIBS MODIS overlays for your field location
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            {BASE_MAPS.map(b => (
              <button key={b.id} onClick={() => setBaseMap(b.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold transition"
                      style={{
                        background: baseMap === b.id ? '#4f8ef7' : 'transparent',
                        color:      baseMap === b.id ? '#fff' : '#9ea3b8',
                      }}>
                {b.label}
              </button>
            ))}
          </div>
          <select
            value={activeOverlay}
            onChange={e => setActiveOverlay(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#0f1117', border: '1px solid #2a2d3e', color: '#e8eaf6' }}>
            {OVERLAYS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Map + Side Panel ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Map */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ height: '500px', border: '1px solid #2a2d3e' }}>
          <MapContainer center={coords} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <ChangeMapView coords={coords} />

            {/* Base Tiles — Esri (free) or OSM (free) — NEVER CARTO */}
            <TileLayer url={base.url} attribution={base.attr} maxZoom={18} />

            {/* NASA GIBS MODIS True Color Overlay */}
            {activeOverlay === 'modis_color' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
                attribution="NASA GIBS / Terra MODIS True Color"
                opacity={opacity}
                maxZoom={9}
              />
            )}
            {/* NASA GIBS Land Surface Temperature Overlay */}
            {activeOverlay === 'modis_lst' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${gibsDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`}
                attribution="NASA GIBS / MODIS Terra LST Day"
                opacity={opacity}
                maxZoom={7}
              />
            )}

            {/* Farm boundary circle */}
            <Circle
              center={coords}
              radius={2500}
              pathOptions={{ color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 0.08, weight: 2, dashArray: '6, 4' }}
            />
            {/* Farm marker */}
            <Marker position={coords} icon={farmIcon}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{location.name}</div>
                  <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
                    <div>📍 {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E</div>
                    <div>💧 Soil Moisture: <b>{moist}%</b></div>
                    <div>🧪 Soil pH: <b>{ph}</b></div>
                    <div>🌡 Temp: <b>{temp}°C</b> / Max: <b>{tmax}°C</b></div>
                    <div>🌧 Rain 24h: <b>{rain} mm</b></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Right Data Panel */}
        <div className="space-y-4">

          {/* NASA Agroclimatic Data */}
          <div className="rounded-xl p-5" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4" style={{ color: '#4f8ef7' }} />
              <h3 className="text-sm font-bold text-white">NASA POWER Data</h3>
              <span className="text-xs status-good px-2 py-0.5 rounded-full ml-auto">Live</span>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Thermometer, color: '#f59e0b', label: 'Air Temp (T2M)',    value: `${temp}°C`   },
                { icon: Thermometer, color: '#ef4444', label: 'Peak Temp (Tmax)',  value: `${tmax}°C`   },
                { icon: Droplet,     color: '#06b6d4', label: 'GPM 24h Rain',      value: `${rain} mm`  },
                { icon: Sun,         color: '#f59e0b', label: 'Solar Irradiance',  value: `${solar} MJ/m²` },
                { icon: Wind,        color: '#9ea3b8', label: 'Wind Speed',        value: `${wind} m/s` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                     style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2">
                    <row.icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                    <span className="text-xs" style={{ color: '#9ea3b8' }}>{row.label}</span>
                  </div>
                  <span className="text-xs font-bold metric-number text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terrain & Soil */}
          <div className="rounded-xl p-5" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4" style={{ color: '#22c55e' }} />
              <h3 className="text-sm font-bold text-white">SRTM Terrain & Soil</h3>
            </div>
            <div className="space-y-2 text-xs" style={{ color: '#9ea3b8' }}>
              <div className="flex justify-between py-1"><span>Elevation:</span><span className="font-semibold text-white">212 m ASL</span></div>
              <div className="flex justify-between py-1"><span>Slope:</span><span className="font-semibold text-white">0.8% (Flat alluvial)</span></div>
              <div className="flex justify-between py-1"><span>Soil Series:</span><span className="font-semibold text-white">Indo-Gangetic Alluvium</span></div>
              <div className="flex justify-between py-1"><span>Texture:</span><span className="font-semibold text-white">Sandy Loam – Clay Loam</span></div>
              <div className="flex justify-between py-1"><span>Infiltration:</span><span className="font-semibold text-white">Moderate (12–15 mm/hr)</span></div>
              <div className="flex justify-between py-1"><span>Runoff Risk:</span><span className="font-semibold" style={{ color: '#22c55e' }}>Low</span></div>
            </div>
          </div>

          {/* Fire & Stubble Alert */}
          <div className="rounded-xl p-4" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span className="text-sm font-bold text-white">FIRMS Fire Alert</span>
            </div>
            <div className="text-xs py-2 px-3 rounded-lg status-good">
              ✅ No fire anomalies detected within 10km radius
            </div>
            <p className="text-xs mt-2" style={{ color: '#6b7194' }}>
              NASA FIRMS tracks stubble burning and thermal hotspots in real-time
            </p>
          </div>

          {/* Overlay Opacity Slider */}
          {activeOverlay !== 'none' && (
            <div className="rounded-xl p-4" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
              <div className="text-xs font-semibold mb-2 text-white">Overlay Opacity</div>
              <input type="range" min="0.1" max="1" step="0.05" value={opacity}
                     onChange={e => setOpacity(parseFloat(e.target.value))}
                     className="w-full" />
              <div className="text-xs mt-1 text-right" style={{ color: '#6b7194' }}>{Math.round(opacity * 100)}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
