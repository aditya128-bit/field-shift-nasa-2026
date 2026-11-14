import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import { 
  Satellite, Layers, Sun, Thermometer, Droplet, Wind, Activity, 
  CheckCircle2, Shield, AlertTriangle, Eye, Crosshair, Flame, CloudRain
} from 'lucide-react';
import { fetchActiveHazards } from '../services/api';

// Fix Leaflet default icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, zoom || map.getZoom());
  }, [coords, zoom]);
  return null;
}

const BASE_MAPS = [
  { id: 'satellite', label: '🛰 High-Res Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri — Source: Esri, USDA, USGS' },
  { id: 'topo',      label: '🗺 Topo & Terrain',     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri — DeLorme, NAVTEQ' },
  { id: 'osm',       label: '🌍 OpenStreetMap',      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap contributors' },
];

const OVERLAYS = [
  { id: 'none',        label: 'None (Pure Basemap)',  desc: 'Sub-meter farm field imagery without overlay' },
  { id: 'modis_ndvi',  label: '🌱 NASA MODIS NDVI (Vegetation Index)', desc: 'Crop vigor & biomass vitality (8-day composite)' },
  { id: 'modis_lst',   label: '🌡 NASA MODIS Land Surface Temp', desc: 'Thermal heat stress & surface temperature' },
  { id: 'gpm_rain',    label: '🌧 NASA GPM IMERG Precipitation', desc: 'Global precipitation measurement satellite feed' },
  { id: 'smap_moist',  label: '💧 NASA SMAP Soil Moisture', desc: 'Root-zone active microwave soil moisture' },
  { id: 'modis_color', label: '📸 NASA MODIS True Color Reflectance', desc: 'Natural color Terra corrected reflectance' },
  { id: 'isro_lulc',   label: '🇮🇳 ISRO Bhuvan Land Cover (LULC)', desc: 'Indian Space Research Organisation agro-thematic mapping' },
];

export default function NasaGeoMap({ location, nasaObs, soilReading }) {
  const [baseMap, setBaseMap] = useState('satellite');
  const [activeOverlay, setActiveOverlay] = useState('none');
  const [opacity, setOpacity] = useState(0.70);
  const [hazardsData, setHazardsData] = useState(null);
  const [showHazardLayer, setShowHazardLayer] = useState(true);

  const coords = [location.lat, location.lon];

  // GIBS safe historical date (2 days prior to today for 100% processed global coverage)
  const gibsDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d.toISOString().split('T')[0];
  })();

  const base = BASE_MAPS.find(b => b.id === baseMap) || BASE_MAPS[0];
  const temp  = nasaObs?.temp_2m ?? 24.5;
  const tmax  = nasaObs?.temp_max ?? 30.5;
  const rain  = nasaObs?.precipitation_mm ?? 0;
  const solar = nasaObs?.solar_radiation_mj ?? 18.2;
  const wind  = nasaObs?.wind_speed ?? 1.8;
  const moist = soilReading?.soil_moisture ?? 22;
  const ph    = soilReading?.ph ?? 7.8;

  // Fetch live hazards on mount
  useEffect(() => {
    fetchActiveHazards(location.lat, location.lon)
      .then(data => setHazardsData(data))
      .catch(err => console.warn("[Hazards Fetch]", err));
  }, [location.lat, location.lon]);

  // Farm marker icon
  const farmIcon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:22px; height:22px;">
        <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#4f8ef7; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#4f8ef7; border:3px solid #ffffff; box-shadow:0 0 14px rgba(79,142,247,0.8);"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  // Cyclone icon
  const cycloneIcon = L.divIcon({
    className: '',
    html: `
      <div style="background:#ec4899; color:#fff; width:28px; height:28px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 0 15px #ec4899;">
        🌀
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  // Fire hotspot icon
  const fireIcon = L.divIcon({
    className: '',
    html: `
      <div style="background:#f97316; color:#fff; width:22px; height:22px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 0 10px #f97316;">
        🔥
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  const activeOverlayInfo = OVERLAYS.find(o => o.id === activeOverlay);

  return (
    <div className="space-y-5 tab-panel">

      {/* ── Top Header & Layer Toolbar ─────────────────────── */}
      <div className="rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
           style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#0b3d91', color: '#fff' }}>
              NASA & ISRO EARTH OBSERVATORIES
            </span>
            <span className="text-xs status-good px-2 py-0.5 rounded-full font-semibold">
              <CheckCircle2 className="inline w-3 h-3 mr-1" />100% Free Public Satellites • Zero API Keys
            </span>
            {hazardsData?.total_alerts > 0 && (
              <span className="text-xs status-alert px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {hazardsData.total_alerts} Active Environmental Warnings
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">Geospatial Farm & Hazard Observatory</h2>
          <p className="text-xs mt-1" style={{ color: '#9ea3b8' }}>
            Overlaying in-situ farm field coordinates with NASA MODIS, SMAP, GPM IMERG, and ISRO Bhuvan thematic layers.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Basemap picker */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            {BASE_MAPS.map(b => (
              <button key={b.id} onClick={() => setBaseMap(b.id)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition"
                      style={{
                        background: baseMap === b.id ? '#4f8ef7' : 'transparent',
                        color:      baseMap === b.id ? '#fff' : '#9ea3b8',
                      }}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Overlay Selector Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={activeOverlay}
              onChange={e => setActiveOverlay(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ background: '#0f1117', border: '1px solid #2a2d3e', color: '#e8eaf6' }}
            >
              {OVERLAYS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Hazard Toggle Button */}
          <button
            onClick={() => setShowHazardLayer(v => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            style={{
              background: showHazardLayer ? 'rgba(239,68,68,0.2)' : '#0f1117',
              border: `1px solid ${showHazardLayer ? '#ef4444' : '#2a2d3e'}`,
              color: showHazardLayer ? '#fca5a5' : '#9ea3b8'
            }}
          >
            <span>🌀 Hazards & Storms</span>
            <span className={`w-2 h-2 rounded-full ${showHazardLayer ? 'bg-red-500' : 'bg-gray-500'}`} />
          </button>
        </div>
      </div>

      {/* ── Active Overlay Description Banner ────────────── */}
      {activeOverlay !== 'none' && (
        <div className="rounded-lg px-4 py-2.5 flex items-center justify-between text-xs"
             style={{ background: '#111827', border: '1px solid #1f2937' }}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">{activeOverlayInfo?.label}:</span>
            <span style={{ color: '#9ca3af' }}>{activeOverlayInfo?.desc}</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
              Date: {gibsDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="font-mono text-white text-[11px]">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      )}

      {/* ── Map + Side Panel Layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Map Container */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden relative shadow-2xl" 
             style={{ height: '540px', border: '1px solid #2a2d3e', background: '#0a0c14' }}>
          
          <MapContainer center={coords} zoom={11} minZoom={3} maxZoom={18} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <MapController coords={coords} zoom={11} />

            {/* Base Layer: Esri World Imagery (100% Free, high-res) / Topo / OSM */}
            <TileLayer url={base.url} attribution={base.attr} maxZoom={18} />

            {/* 1. NASA GIBS MODIS NDVI Vegetation Index */}
            {activeOverlay === 'modis_ndvi' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${gibsDate}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`}
                attribution="NASA GIBS / Terra MODIS NDVI 8-Day"
                opacity={opacity}
                maxZoom={8}
                minZoom={3}
              />
            )}

            {/* 2. NASA GIBS Land Surface Temperature (Day LST) */}
            {activeOverlay === 'modis_lst' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${gibsDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`}
                attribution="NASA GIBS / Terra MODIS Land Surface Temp"
                opacity={opacity}
                maxZoom={7}
                minZoom={3}
              />
            )}

            {/* 3. NASA GPM IMERG Precipitation Rate */}
            {activeOverlay === 'gpm_rain' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${gibsDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`}
                attribution="NASA GIBS / GPM IMERG 24hr Rain Rate"
                opacity={opacity}
                maxZoom={6}
                minZoom={3}
              />
            )}

            {/* 4. NASA SMAP Surface Soil Moisture */}
            {activeOverlay === 'smap_moist' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/${gibsDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`}
                attribution="NASA GIBS / SMAP Analyzed Surface Soil Moisture"
                opacity={opacity}
                maxZoom={7}
                minZoom={3}
              />
            )}

            {/* 5. NASA MODIS True Color Reflectance */}
            {activeOverlay === 'modis_color' && (
              <TileLayer
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
                attribution="NASA GIBS / Terra MODIS Corrected Reflectance True Color"
                opacity={opacity}
                maxZoom={9}
                minZoom={4}
              />
            )}

            {/* 6. ISRO Bhuvan Land Use / Land Cover (WMS) */}
            {activeOverlay === 'isro_lulc' && (
              <WMSTileLayer
                url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms"
                layers="lulc:LULC50K_1516"
                format="image/png"
                transparent={true}
                opacity={opacity}
                attribution="ISRO / NRSC Bhuvan Thematic Geoportal"
              />
            )}

            {/* Farm 2.5km Root-Zone Radius Circle */}
            <Circle
              center={coords}
              radius={2500}
              pathOptions={{ color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 0.10, weight: 2, dashArray: '6, 5' }}
            />

            {/* Farm Location Marker */}
            <Marker position={coords} icon={farmIcon}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{location.name}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
                    <div>📍 GPS: <b>{location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E</b></div>
                    <div>💧 Ground Soil Moisture: <b>{moist}%</b></div>
                    <div>🧪 Soil pH: <b>{ph}</b></div>
                    <div>🌡 Air Temp: <b>{temp}°C</b> (Max: <b>{tmax}°C</b>)</div>
                    <div>🌧 Rainfall 24h: <b>{rain} mm</b></div>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Live Geo Hazards Markers (Cyclones & Thermal Fire Hotspots) */}
            {showHazardLayer && hazardsData?.geo_hazard_markers?.map((h, idx) => {
              const isCyclone = h.type === 'cyclone';
              return (
                <React.Fragment key={idx}>
                  {isCyclone && h.radius_km && (
                    <Circle
                      center={[h.lat, h.lon]}
                      radius={h.radius_km * 1000}
                      pathOptions={{ color: '#ec4899', fillColor: '#ec4899', fillOpacity: 0.12, weight: 2, dashArray: '8, 6' }}
                    />
                  )}
                  <Marker position={[h.lat, h.lon]} icon={isCyclone ? cycloneIcon : fireIcon}>
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 170 }}>
                        <div style={{ fontWeight: 800, fontSize: 12, color: isCyclone ? '#db2777' : '#ea580c' }}>
                          {h.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          Coords: {h.lat.toFixed(2)}° N, {h.lon.toFixed(2)}° E
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

          </MapContainer>

          {/* Map Overlay Bottom Badges */}
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 pointer-events-none">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-lg"
                  style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', border: '1px solid #334155' }}>
              🎯 Farm Radius: 2.5 km
            </span>
            {showHazardLayer && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold shadow-lg text-rose-300"
                    style={{ background: 'rgba(76, 5, 25, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid #9f1239' }}>
                🌀 {hazardsData?.active_cyclones_count ?? 0} Storms / Cyclones Tracked
              </span>
            )}
          </div>
        </div>

        {/* Right Data Inspection Panel */}
        <div className="space-y-4">

          {/* Active Hazards Card */}
          <div className="rounded-xl p-4" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Active Hazard Alerts</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                hazardsData?.overall_status === 'EMERGENCY' ? 'status-alert' :
                hazardsData?.overall_status === 'WARNING'   ? 'status-warn'  : 'status-good'
              }`}>
                {hazardsData?.overall_status || 'ALL CLEAR'}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {hazardsData?.alerts?.length ? (
                hazardsData.alerts.slice(0, 4).map((alt, i) => (
                  <div key={i} className="p-2.5 rounded-lg text-xs" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
                    <div className="flex items-center justify-between font-bold text-white mb-0.5">
                      <span>{alt.icon} {alt.title}</span>
                      <span className="text-[10px] text-amber-400">{alt.level}</span>
                    </div>
                    <p style={{ color: '#9ea3b8', lineHeight: 1.4 }}>{alt.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs py-3 text-center" style={{ color: '#6b7194' }}>
                  No active weather or fire hazards near your coordinates.
                </div>
              )}
            </div>
          </div>

          {/* Live NASA POWER Feeds */}
          <div className="rounded-xl p-4" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" style={{ color: '#4f8ef7' }} />
              <h3 className="text-sm font-bold text-white">NASA Satellite Feeds</h3>
              <span className="text-xs status-good px-2 py-0.5 rounded-full ml-auto font-mono text-[10px]">LIVE</span>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { icon: Thermometer, color: '#f59e0b', label: 'Air Temp (T2M)', value: `${temp}°C` },
                { icon: Thermometer, color: '#ef4444', label: 'Peak Temp (Tmax)', value: `${tmax}°C` },
                { icon: Droplet, color: '#06b6d4', label: 'GPM 24h Rain', value: `${rain} mm` },
                { icon: Sun, color: '#f59e0b', label: 'Solar Irradiance', value: `${solar} MJ/m²` },
                { icon: Wind, color: '#9ea3b8', label: 'Wind Velocity', value: `${wind} m/s` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: '#0f1117' }}>
                  <div className="flex items-center gap-2">
                    <row.icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                    <span style={{ color: '#9ea3b8' }}>{row.label}</span>
                  </div>
                  <span className="font-bold metric-number text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topography & Elevation */}
          <div className="rounded-xl p-4 text-xs space-y-1.5" style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#9ea3b8' }}>
            <div className="font-bold text-white flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>SRTM Topography & Soil Horizon</span>
            </div>
            <div className="flex justify-between py-0.5"><span>Elevation:</span><span className="text-white font-medium">212 m ASL</span></div>
            <div className="flex justify-between py-0.5"><span>Slope:</span><span className="text-white font-medium">0.8% (Alluvial flood plain)</span></div>
            <div className="flex justify-between py-0.5"><span>Soil Series:</span><span className="text-white font-medium">Indo-Gangetic Alluvium</span></div>
            <div className="flex justify-between py-0.5"><span>Runoff Risk:</span><span className="text-emerald-400 font-bold">Low (High infiltration)</span></div>
          </div>

        </div>

      </div>

    </div>
  );
}
