import React, { useState, useEffect } from 'react';
import {
  Home, Map, RotateCw, Cpu, BarChart2, MessageSquare,
  Crosshair, Loader2, ChevronDown, Settings, Bell, Sprout, AlertTriangle
} from 'lucide-react';
import { fetchActiveHazards } from '../services/api';

const NAV_TABS = [
  { id: 'farmer',    icon: Home,          label: 'My Farm'       },
  { id: 'gis',       icon: Map,           label: 'Satellite Map' },
  { id: 'rotations', icon: RotateCw,      label: 'Crop Rotations'},
  { id: 'telemetry', icon: Cpu,           label: 'Soil Sensors'  },
  { id: 'forecast',  icon: BarChart2,     label: 'Forecast'      },
  { id: 'chat',      icon: MessageSquare, label: 'Ask AI'        },
];

const FIELD_PRESETS = [
  { name: 'Delhi Basin (Pusa / Najafgarh)', lat: 28.6139, lon: 77.2090 },
  { name: 'Punjab Agro Belt (Ludhiana)',     lat: 30.9010, lon: 75.8573 },
  { name: 'Haryana Semi-Arid (Hisar)',       lat: 29.1492, lon: 75.7217 },
  { name: 'Western UP (Meerut)',             lat: 28.9845, lon: 77.7064 },
];

export default function Navbar({
  activeTab, setActiveTab,
  location, setLocation,
  detectDeviceLocation, detectingLocation,
  nasaObs, soilReading, openHardwareModal, apiKey, setApiKey
}) {
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [hazardAlerts, setHazardAlerts] = useState(0);

  useEffect(() => {
    fetchActiveHazards(location.lat, location.lon)
      .then(d => setHazardAlerts(d?.total_alerts || 0))
      .catch(() => {});
  }, [location.lat, location.lon]);

  const handlePreset = (preset) => {
    setLocation({ name: preset.name, lat: preset.lat, lon: preset.lon, isDeviceLocation: false });
    setShowFieldPicker(false);
  };

  const handleGPS = () => {
    setShowFieldPicker(false);
    detectDeviceLocation();
  };

  return (
    <header className="sticky top-0 z-50" style={{ background: '#0a0c14', borderBottom: '1px solid #1e2130' }}>

      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14">

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setActiveTab('farmer')}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #0b3d91 60%, #4f8ef7)' }}>
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white leading-none">FIELD SHIFT</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: '#fc3d21', color: '#fff', letterSpacing: '0.05em' }}>
                NASA 2026
              </span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: '#6b7194' }}>
              Farm Decision Intelligence
            </div>
          </div>
        </div>

        {/* Centre: Field Location Selector */}
        <div className="hidden md:block relative">
          <button
            onClick={() => setShowFieldPicker(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#e8eaf6' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
            <span className="max-w-[200px] truncate font-medium text-xs">{location.name}</span>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6b7194' }} />
          </button>

          {showFieldPicker && (
            <div className="absolute top-10 left-0 w-72 rounded-xl shadow-2xl py-1 z-50"
                 style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7194' }}>
                Quick Fields
              </div>
              {FIELD_PRESETS.map(p => (
                <button key={p.name} onClick={() => handlePreset(p)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition"
                        style={{ color: '#e8eaf6' }}>
                  {p.name}
                </button>
              ))}
              <div className="border-t my-1" style={{ borderColor: '#2a2d3e' }} />
              <button onClick={handleGPS}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-white/5 transition"
                      style={{ color: '#4f8ef7' }}>
                {detectingLocation
                  ? <Loader2 className="w-4 h-4 spin" />
                  : <Crosshair className="w-4 h-4" />}
                Use My GPS Location
              </button>
            </div>
          )}
        </div>

        {/* Right: Status chips */}
        <div className="flex items-center gap-2">
          {/* Active Hazards Alert Badge */}
          {hazardAlerts > 0 && (
            <button
              onClick={() => setActiveTab('gis')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#fca5a5' }}
              title="Active Storm or Weather Hazard"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{hazardAlerts} Warnings</span>
            </button>
          )}

          {/* NASA Online Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
               style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-green" />
            NASA Live
          </div>
          {/* IoT Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
               style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', color: '#4f8ef7' }}>
            <Cpu className="w-3 h-3" />
            IoT Sim
          </div>
          {/* GPS button (mobile) */}
          <button onClick={handleGPS}
                  className="p-2 rounded-lg transition hover:bg-white/5"
                  style={{ border: '1px solid #2a2d3e' }}
                  title="Detect my GPS location">
            {detectingLocation
              ? <Loader2 className="w-4 h-4 spin" style={{ color: '#4f8ef7' }} />
              : <Crosshair className="w-4 h-4" style={{ color: '#4f8ef7' }} />}
          </button>
          <button onClick={openHardwareModal}
                  className="p-2 rounded-lg transition hover:bg-white/5"
                  style={{ border: '1px solid #2a2d3e' }}
                  title="ESP32 Hardware Setup">
            <Settings className="w-4 h-4" style={{ color: '#6b7194' }} />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────── */}
      <div className="flex overflow-x-auto px-4 gap-1 pb-0" style={{ borderTop: '1px solid #1e2130' }}>
        {NAV_TABS.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative"
              style={{
                color: active ? '#4f8ef7' : '#9ea3b8',
                borderBottom: active ? '2px solid #4f8ef7' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Click-outside to close field picker */}
      {showFieldPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowFieldPicker(false)} />
      )}
    </header>
  );
}
