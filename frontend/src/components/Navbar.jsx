import React, { useState } from 'react';
import { Satellite, Cpu, MapPin, Key, Radio, Layers, RefreshCw, CheckCircle2, Globe, Shield } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  location,
  setLocation,
  soilReading,
  nasaObs,
  apiKey,
  setApiKey,
  openHardwareModal
}) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');

  const locations = [
    { name: "Delhi Basin (IARI Pusa / Najafgarh)", lat: 28.6139, lon: 77.2090 },
    { name: "Punjab Agro-Belt (Ludhiana)", lat: 30.9010, lon: 75.8573 },
    { name: "Haryana Semi-Arid (Hisar)", lat: 29.1492, lon: 75.7217 },
    { name: "Western UP (Meerut)", lat: 28.9845, lon: 77.7064 }
  ];

  const handleSaveKey = () => {
    setApiKey(tempKey.trim());
    localStorage.setItem("FIELD_SHIFT_NVIDIA_KEY", tempKey.trim());
    setShowKeyModal(false);
  };

  return (
    <>
      <header className="border-b border-[#1b2b52] bg-[#071330] text-white sticky top-0 z-40 shadow-xl">
        
        {/* Top Official Banner Ticker */}
        <div className="bg-[#030919] border-b border-[#132242] py-1.5 px-4 text-[11px] font-sans">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <span className="font-extrabold uppercase tracking-wider text-[#FCEE21] flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 mr-1" />
                NASA SPACE APPS CHALLENGE 2026
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Challenge: <b className="text-white">Field Shift: Adapting Farms with NASA Data</b></span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>NASA Earth Observations: 100% Free Public Data (Zero API Key)</span>
              </span>
              <span className="text-slate-500 hidden md:inline">•</span>
              <span className="text-slate-400 hidden md:inline">
                Satellites: <span className="text-cyan-300 font-mono">SMAP | GPM | MODIS | POWER | ECOSTRESS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* NASA Space Apps Challenge Official Logo */}
            <div className="flex items-center space-x-4">
              {/* Space Apps Signal Logo Mark */}
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('gis')}>
                <svg viewBox="0 0 100 100" className="w-11 h-11 text-white flex-shrink-0" fill="none">
                  {/* Outer Orbit / Planet */}
                  <circle cx="54" cy="54" r="32" stroke="white" strokeWidth="4.5" />
                  {/* Signal Rays emerging top-left */}
                  <line x1="26" y1="26" x2="10" y2="10" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="38" y1="18" x2="26" y2="4" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="54" y1="14" x2="54" y2="1" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Node Dots */}
                  <circle cx="10" cy="10" r="3.5" fill="#FCEE21" />
                  <circle cx="26" cy="4" r="3.5" fill="#FCEE21" />
                  <circle cx="54" cy="1" r="3.5" fill="#FCEE21" />
                </svg>

                <div className="leading-tight">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#FC3D21]">
                    NASA
                  </div>
                  <div className="text-lg sm:text-xl font-black tracking-tight text-white uppercase font-sans">
                    SPACE APPS
                  </div>
                  <div className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
                    CHALLENGE
                  </div>
                </div>
              </div>

              <div className="h-10 w-[1px] bg-slate-700 hidden lg:block mx-1"></div>

              {/* Solution Title */}
              <div className="hidden lg:block">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-black tracking-wider text-white">
                    FIELD SHIFT
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-900/90 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                    Decision OS
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Adapting Multi-Generational Farms with Space Agency Data
                </div>
              </div>
            </div>

            {/* Middle: Target Location Switcher & Telemetry Badges */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Target Location Dropdown */}
              <div className="bg-[#030919] px-3.5 py-1.5 rounded-xl border border-blue-900/60 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#FCEE21]" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Target Field Basin</div>
                  <select
                    value={location.name}
                    onChange={(e) => {
                      const sel = locations.find(l => l.name === e.target.value);
                      if (sel) setLocation(sel);
                    }}
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                  >
                    {locations.map((loc) => (
                      <option key={loc.name} value={loc.name} className="bg-[#071330] text-white">
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Edge Node Status */}
              <div 
                onClick={openHardwareModal}
                className="bg-[#030919] px-3.5 py-1.5 rounded-xl border border-blue-900/60 flex items-center space-x-2.5 hover:border-cyan-400 cursor-pointer transition-colors"
                title="Click to view ESP32 8-in-1 Modbus wiring"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
                <div className="text-left text-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">8-in-1 IoT Node</div>
                  <div className="text-cyan-300 font-mono font-bold">
                    {soilReading?.sensor_mode === "hardware_rs485" ? "Hardware Live" : "Delhi Baseline Sim"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Electric Yellow Primary Action Button (Matching Space Apps Site) */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('rotations')}
                className="bg-[#FCEE21] hover:bg-[#fff033] text-[#071330] px-4 py-2 rounded-xl text-xs sm:text-sm font-black tracking-wide uppercase transition-all shadow-lg shadow-yellow-500/20 flex items-center space-x-1.5"
              >
                <span>Compare Rotations</span>
              </button>

              <button
                onClick={openHardwareModal}
                className="bg-blue-900/60 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-bold border border-blue-700/60 transition-all flex items-center space-x-1.5"
              >
                <Cpu className="w-4 h-4 text-cyan-300" />
                <span className="hidden sm:inline">ESP32 Setup</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar: 5 Professional Mission Tabs */}
          <div className="flex space-x-1 sm:space-x-3 border-t border-[#1b2b52] overflow-x-auto py-2.5">
            {[
              { id: 'gis', label: 'NASA Geospatial Observatory', icon: Satellite },
              { id: 'rotations', label: 'Crop Rotation Strategy Studio', icon: Layers },
              { id: 'telemetry', label: '8-in-1 Ground Telemetry', icon: Cpu },
              { id: 'forecast', label: '30-Day Predictive Climate Risk', icon: Radio },
              { id: 'chat', label: 'AI Agronomist (Nemotron)', icon: RefreshCw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#0B1E48] text-white border-2 border-[#FCEE21] shadow-lg shadow-yellow-500/10"
                      : "text-slate-300 hover:text-white hover:bg-blue-950/40 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FCEE21]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* NVIDIA NIM Key Modal (Optional configuration) */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#071330] border border-blue-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">NVIDIA NIM / Nemotron Key</h3>
                <p className="text-xs text-slate-400">Optional: Connect live Nemotron 70B</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              FIELD SHIFT includes an embedded agro-intelligence engine that operates out of the box with zero keys. You can optionally paste an NVIDIA key (<code className="text-cyan-400">nvapi-...</code>) to connect directly to live Nemotron models.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">NVIDIA API Key</label>
              <input
                type="password"
                placeholder="nvapi-..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full bg-[#030919] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 text-xs font-bold text-[#071330] bg-[#FCEE21] hover:bg-yellow-400 rounded-lg shadow-md shadow-yellow-500/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
