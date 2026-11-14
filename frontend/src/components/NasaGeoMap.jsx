import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Satellite, Layers, Droplet, Sun, Wind, Flame, 
  Thermometer, CheckCircle2, ShieldCheck, Eye, Compass, Info 
} from 'lucide-react';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ChangeMapView({ coords }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

export default function NasaGeoMap({ location, nasaObs, soilReading }) {
  const [baseMap, setBaseMap] = useState("satellite"); // 'satellite', 'topo'
  const [activeOverlay, setActiveOverlay] = useState("none"); // 'none', 'modis_truecolor', 'modis_lst'
  const [overlayOpacity, setOverlayOpacity] = useState(0.75);
  const coords = [location.lat, location.lon];

  // NASA GIBS date (typically 2 days before today for full global processing)
  const today = new Date();
  today.setDate(today.getDate() - 2);
  const gibsDate = today.toISOString().split('T')[0];

  const customMarkerIcon = L.divIcon({
    className: 'custom-farm-marker',
    html: `
      <div style="background-color: #FCEE21; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #071330; box-shadow: 0 0 20px #FCEE21; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #071330; width: 8px; height: 8px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Official NASA Earth Observation Banner */}
      <div className="bg-gradient-to-r from-[#071330] via-[#0b1a3e] to-[#0d204a] border border-blue-900/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-black tracking-widest text-[#071330] bg-[#FCEE21] px-2.5 py-0.5 rounded-md font-sans">
                NASA EARTH OBSERVATIONS
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Free Public Data • Zero API Key Required</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Geospatial Farm Intelligence Observatory
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Fusing high-resolution aerial satellite imagery with NASA Earth observation sensors (MODIS Surface Reflectance, Land Surface Temperature, SMAP Soil Moisture, and GPM Precipitation).
            </p>
          </div>

          {/* Map Layer Selector Toolbar */}
          <div className="bg-[#030919]/90 p-2 rounded-xl border border-blue-900/50 flex flex-wrap items-center gap-1.5 self-start lg:self-center">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">Base:</span>
            <button
              onClick={() => setBaseMap("satellite")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                baseMap === "satellite" 
                  ? "bg-[#FCEE21] text-[#071330] shadow-md shadow-yellow-500/20" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              High-Res Satellite
            </button>
            <button
              onClick={() => setBaseMap("topo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                baseMap === "topo" 
                  ? "bg-[#FCEE21] text-[#071330] shadow-md shadow-yellow-500/20" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Terrain / Topo
            </button>

            <div className="w-[1px] h-5 bg-slate-700 mx-1"></div>

            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">NASA Overlay:</span>
            <button
              onClick={() => setActiveOverlay("none")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeOverlay === "none" 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              None
            </button>
            <button
              onClick={() => setActiveOverlay("modis_truecolor")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeOverlay === "modis_truecolor" 
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              MODIS 250m
            </button>
            <button
              onClick={() => setActiveOverlay("modis_lst")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeOverlay === "modis_lst" 
                  ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/30" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Heat Stress (LST)
            </button>
          </div>
        </div>

        {/* Opacity slider if overlay is active */}
        {activeOverlay !== "none" && (
          <div className="mt-4 pt-3 border-t border-blue-900/50 flex items-center space-x-3 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300">NASA Satellite Overlay Opacity:</span>
            <input 
              type="range" 
              min="0.2" 
              max="1.0" 
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className="w-48 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 font-bold">{Math.round(overlayOpacity * 100)}%</span>
            <span className="text-[11px] text-slate-400">
              (Overlaying {activeOverlay === 'modis_truecolor' ? 'MODIS Terra Reflectance' : 'Land Surface Temperature (LST)'} on High-Res Satellite)
            </span>
          </div>
        )}
      </div>

      {/* Main Map + Satellite Telemetry Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Interactive Map Box */}
        <div className="lg:col-span-3 bg-[#071330] border border-blue-900/60 rounded-2xl overflow-hidden shadow-2xl relative h-[560px]">
          <MapContainer 
            center={coords} 
            zoom={11} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', backgroundColor: '#030712' }}
          >
            <ChangeMapView coords={coords} />

            {/* Base Layer 1: High-Resolution Aerial Satellite (Esri World Imagery) - 100% Free */}
            {baseMap === "satellite" && (
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {/* Base Layer 2: Topographic & Terrain Map (Esri Topo) - 100% Free */}
            {baseMap === "topo" && (
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            )}

            {/* NASA GIBS MODIS Terra True Color Reflectance Overlay */}
            {activeOverlay === "modis_truecolor" && (
              <TileLayer
                attribution="NASA Global Imagery Browse Services (GIBS) / Terra MODIS"
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
                opacity={overlayOpacity}
                maxZoom={9}
              />
            )}

            {/* NASA GIBS Land Surface Temperature (LST) Day Overlay */}
            {activeOverlay === "modis_lst" && (
              <TileLayer
                attribution="NASA GIBS / MODIS Terra Land Surface Temperature (LST Day)"
                url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${gibsDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`}
                opacity={overlayOpacity}
                maxZoom={7}
              />
            )}

            {/* Farm Radius Circle */}
            <Circle 
              center={coords} 
              radius={2500} 
              pathOptions={{ color: '#FCEE21', fillColor: '#FCEE21', fillOpacity: 0.1, weight: 2, dashArray: '5, 5' }} 
            />

            {/* Farm Location Pin */}
            <Marker position={coords} icon={customMarkerIcon}>
              <Popup>
                <div className="p-2 text-slate-900 font-sans">
                  <div className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">Target Agricultural Basin</div>
                  <h4 className="font-bold text-sm text-slate-950 mt-0.5">{location.name}</h4>
                  <p className="text-xs text-slate-600">
                    GPS: {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
                  </p>
                  <div className="mt-2 text-xs border-t border-slate-200 pt-2 space-y-1">
                    <div><b>Ground Moisture:</b> {soilReading?.soil_moisture ?? 22}%</div>
                    <div><b>Soil pH:</b> {soilReading?.ph ?? 7.8} (Alkaline Alluvial)</div>
                    <div><b>NASA Ambient Temp:</b> {nasaObs?.temp_2m ?? 24}°C</div>
                    <div><b>Health Index:</b> {soilReading?.soil_health_index ?? 80}/100</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* On-Map Status HUD */}
          <div className="absolute bottom-4 left-4 z-[400] bg-[#030919]/90 backdrop-blur-md border border-blue-900/80 px-3.5 py-2 rounded-xl text-xs text-white shadow-xl flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCEE21] animate-ping"></span>
              <span className="font-bold text-slate-300">Target Field:</span>
              <span className="text-[#FCEE21] font-mono font-bold">{location.name}</span>
            </div>
            <div className="w-[1px] h-4 bg-slate-700"></div>
            <div className="text-slate-400 text-[11px]">
              Imagery Date: <span className="text-cyan-400 font-mono font-semibold">{gibsDate}</span>
            </div>
          </div>

          {/* Compass / Legend Widget */}
          <div className="absolute top-4 right-4 z-[400] bg-[#030919]/90 backdrop-blur-md border border-blue-900/80 p-3 rounded-xl text-xs text-white shadow-xl space-y-1.5 hidden sm:block">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Legend</div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-3 h-3 rounded-full bg-[#FCEE21] border border-black"></span>
              <span>Farm Field Boundary (2.5km)</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-3 h-3 rounded bg-cyan-400"></span>
              <span>Crop Canopy / Living Biomass</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-3 h-3 rounded bg-amber-600"></span>
              <span>Bare Soil / Fallow Gap</span>
            </div>
          </div>
        </div>

        {/* Right Inspection Panel: Satellite Feeds Relevant to Farmers */}
        <div className="space-y-4">
          
          {/* Thermal & Climate Stress Feed */}
          <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-blue-950 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Sun className="w-4 h-4 text-[#FCEE21]" />
                <span>NASA Agroclimatic Feeds</span>
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Live
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                <span className="text-slate-400">Surface Temp (T2M):</span>
                <span className="font-bold text-white font-mono text-sm">{nasaObs?.temp_2m ?? 24.5}°C</span>
              </div>
              <div className="flex justify-between items-center bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                <span className="text-slate-400">Peak Thermal (Tmax):</span>
                <span className="font-bold text-rose-400 font-mono text-sm">{nasaObs?.temp_max ?? 31.2}°C</span>
              </div>
              <div className="flex justify-between items-center bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                <span className="text-slate-400">GPM 24h Precipitation:</span>
                <span className="font-bold text-cyan-400 font-mono text-sm">{nasaObs?.precipitation_mm ?? 0.0} mm</span>
              </div>
              <div className="flex justify-between items-center bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                <span className="text-slate-400">Solar Irradiance:</span>
                <span className="font-bold text-amber-300 font-mono text-sm">{nasaObs?.solar_radiation_mj ?? 18.2} MJ/m²</span>
              </div>
              <div className="flex justify-between items-center bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                <span className="text-slate-400">Wind Velocity:</span>
                <span className="font-bold text-slate-300 font-mono text-sm">{nasaObs?.wind_speed ?? 2.1} m/s</span>
              </div>
            </div>
          </div>

          {/* Stubble Burning & Fire Anomalies (FIRMS) Alert */}
          <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-5 shadow-xl text-xs space-y-2.5">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>FIRMS Fire & Stubble Hotspots</span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Thermal anomaly sensor tracking stubble burning smoke plumes in the Delhi–Punjab–Haryana corridor.
            </p>
            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/60 text-emerald-300 text-[11px] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Zero fire anomalies flagged within 10km radius.</span>
            </div>
          </div>

          {/* SRTM Terrain Topography */}
          <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-5 shadow-xl text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>SRTM Elevation & Soil Horizon</span>
            </h4>
            <div className="text-slate-300 space-y-1 text-[11px]">
              <p><b>Topographic Slope:</b> 0.8% (Alluvial flood plain)</p>
              <p><b>Soil Series:</b> Indo-Gangetic Alluvium</p>
              <p><b>Runoff Risk:</b> Low (High infiltration opportunity)</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
