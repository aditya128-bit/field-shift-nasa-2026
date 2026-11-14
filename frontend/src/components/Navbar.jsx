import React, { useState } from 'react';
import { 
  Satellite, Cpu, MapPin, Key, Radio, Layers, 
  RefreshCw, CheckCircle2, Globe, Crosshair, Navigation,
  Search, Sprout, Sparkles, ChevronDown, Bell, HelpCircle
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  location,
  setLocation,
  detectDeviceLocation,
  detectingLocation,
  soilReading,
  nasaObs,
  apiKey,
  setApiKey,
  openHardwareModal
}) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [showCustomCoordModal, setShowCustomCoordModal] = useState(false);
  const [customLat, setCustomLat] = useState(location.lat.toString());
  const [customLon, setCustomLon] = useState(location.lon.toString());
  const [searchQuery, setSearchQuery] = useState('');

  const presetLocations = [
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

  const handleApplyCustomCoords = (e) => {
    e.preventDefault();
    const latNum = parseFloat(customLat);
    const lonNum = parseFloat(customLon);
    if (!isNaN(latNum) && !isNaN(lonNum)) {
      setLocation({
        name: `Custom Point (${latNum.toFixed(4)}° N, ${lonNum.toFixed(4)}° E)`,
        lat: latNum,
        lon: lonNum,
        isDeviceLocation: false
      });
      setShowCustomCoordModal(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('chat');
    }
  };

  return (
    <>
      <header className="border-b border-[#3c4043] bg-[#202124] text-white sticky top-0 z-40 shadow-md font-sans">
        
        {/* Top Google Cloud / NASA Official Header Row */}
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between border-b border-[#3c4043] bg-[#18191c]">
          
          {/* Left: Google Cloud & NASA Space Apps Branding */}
          <div className="flex items-center space-x-4">
            
            {/* Google Cloud Style App Badge */}
            <div 
              onClick={() => setActiveTab('farmer')} 
              className="flex items-center space-x-2.5 cursor-pointer group"
              title="Go to Farmer Simple Overview"
            >
              {/* Google Cloud colored geometric icon */}
              <div className="w-8 h-8 rounded-lg bg-[#292a2d] border border-[#3c4043] flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#8ab4f8] transition">
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  <path d="M20 8L32 15V29L20 36L8 29V15L20 8Z" stroke="#4285F4" strokeWidth="3" />
                  <circle cx="20" cy="20" r="5" fill="#34A853" />
                  <path d="M20 8L20 20L32 29" stroke="#FBBC04" strokeWidth="2.5" />
                  <path d="M20 20L8 29" stroke="#EA4335" strokeWidth="2.5" />
                </svg>
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-semibold tracking-tight text-white group-hover:text-[#8ab4f8] transition">
                    Google Cloud
                  </span>
                  <span className="text-slate-500 text-xs">/</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FCEE21]">
                    NASA Space Apps
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <span>FIELD SHIFT</span>
                  <span>•</span>
                  <span className="text-[#8ab4f8]">Farm Decision OS</span>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-[#3c4043] hidden sm:block"></div>

            {/* GCP Project Selector Dropdown */}
            <div className="hidden md:flex items-center space-x-2 bg-[#28292c] hover:bg-[#303134] px-3 py-1.5 rounded-lg border border-[#3c4043] transition cursor-pointer">
              <span className="text-[11px] text-slate-400 font-medium">Field:</span>
              <select
                value={location.name}
                onChange={(e) => {
                  if (e.target.value === "gps") {
                    detectDeviceLocation();
                  } else if (e.target.value === "custom") {
                    setShowCustomCoordModal(true);
                  } else {
                    const sel = presetLocations.find(l => l.name === e.target.value);
                    if (sel) setLocation({ ...sel, isDeviceLocation: false });
                  }
                }}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1 max-w-[200px] truncate"
              >
                <option value="gps" className="bg-[#202124] text-[#8ab4f8] font-bold">
                  📍 Computer GPS ({location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°)
                </option>
                {presetLocations.map((loc) => (
                  <option key={loc.name} value={loc.name} className="bg-[#202124] text-white">
                    {loc.name}
                  </option>
                ))}
                <option value="custom" className="bg-[#202124] text-[#fbbc04]">
                  ⚙️ Custom Coordinates...
                </option>
              </select>
            </div>
          </div>

          {/* Center: Google Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search crop rotations, soil parameters, or ask AI agronomist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#28292c] hover:bg-[#303134] focus:bg-[#202124] border border-[#3c4043] focus:border-[#8ab4f8] text-xs text-white placeholder-slate-400 rounded-full pl-9 pr-4 py-2 focus:outline-none transition"
              />
            </form>
          </div>

          {/* Right: GPS, Hardware, and AI Status */}
          <div className="flex items-center space-x-2.5">
            
            {/* GPS Computer Auto-Detect Button */}
            <button
              onClick={detectDeviceLocation}
              disabled={detectingLocation}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1.5 ${
                location.isDeviceLocation
                  ? "bg-[#137333]/30 border-[#34a853] text-[#81c995]"
                  : "bg-[#28292c] border-[#3c4043] text-slate-300 hover:text-white hover:border-[#8ab4f8]"
              }`}
              title="Detect computer GPS coordinates"
            >
              {detectingLocation ? (
                <RefreshCw className="w-3.5 h-3.5 text-[#8ab4f8] animate-spin" />
              ) : (
                <Crosshair className={`w-3.5 h-3.5 ${location.isDeviceLocation ? 'text-[#34a853]' : 'text-slate-400'}`} />
              )}
              <span className="hidden sm:inline font-mono text-[11px]">
                {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
              </span>
            </button>

            {/* AI Model Indicator Pill */}
            <div 
              onClick={() => setShowKeyModal(true)}
              className="hidden sm:flex items-center space-x-1.5 bg-[#28292c] hover:bg-[#303134] px-2.5 py-1.5 rounded-lg border border-[#3c4043] text-xs cursor-pointer transition"
              title="Configure NVIDIA NIM AI Key"
            >
              <div className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse"></div>
              <span className="text-[11px] font-medium text-slate-300 font-mono">
                Llama-3.2-90B
              </span>
            </div>

            {/* Hardware ESP32 button */}
            <button
              onClick={openHardwareModal}
              className="bg-[#28292c] hover:bg-[#303134] border border-[#3c4043] hover:border-[#8ab4f8] text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
              title="ESP32 8-in-1 Modbus RS485 Sensor"
            >
              <Cpu className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span className="hidden md:inline text-[11px]">ESP32</span>
            </button>
          </div>

        </div>

        {/* Clean GCP Sub-navigation Bar */}
        <div className="px-4 sm:px-6 flex items-center justify-between overflow-x-auto bg-[#202124]">
          <div className="flex space-x-1 py-1.5">
            {[
              { id: 'farmer', label: '🌾 Farmer Overview (Simple)', icon: Sprout, highlight: true },
              { id: 'gis', label: '🗺️ Satellite GIS (NASA)', icon: Satellite },
              { id: 'rotations', label: '🔄 Crop Rotation Studio', icon: Layers },
              { id: 'telemetry', label: '⚡ 8-in-1 Soil Telemetry', icon: Cpu },
              { id: 'forecast', label: '📈 30-Day Climate & Time-Series', icon: Radio },
              { id: 'chat', label: '💬 AI Agronomist (NVIDIA NIM)', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#303134] text-[#8ab4f8] border-b-2 border-[#1a73e8] font-bold shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-[#28292c]"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
            <span>Zone: asia-south1</span>
            <span>•</span>
            <span className="text-[#34a853] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34a853]"></span>
              <span>All Systems Operational</span>
            </span>
          </div>
        </div>

      </header>

      {/* Custom Coordinates Modal */}
      {showCustomCoordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#202124] border border-[#3c4043] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800 text-[#8ab4f8]">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Custom Farm Coordinates</h3>
                <p className="text-xs text-slate-400">Target any field coordinates globally</p>
              </div>
            </div>

            <form onSubmit={handleApplyCustomCoords} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (°N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full bg-[#18191c] border border-[#3c4043] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (°E)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="w-full bg-[#18191c] border border-[#3c4043] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomCoordModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-[#303134]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-lg shadow-md"
                >
                  Apply & Query NASA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NVIDIA NIM Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#202124] border border-[#3c4043] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800 text-[#8ab4f8]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">NVIDIA NIM Configuration</h3>
                <p className="text-xs text-slate-400">Connected Model: meta/llama-3.2-90b-vision-instruct</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              FIELD SHIFT is connected to NVIDIA NIM via your API key. If you want to update your key, paste it below.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">NVIDIA API Key</label>
              <input
                type="password"
                placeholder="nvapi-..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full bg-[#18191c] border border-[#3c4043] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-[#303134]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-lg shadow-md"
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
