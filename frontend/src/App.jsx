import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SoilTelemetryCard from './components/SoilTelemetryCard';
import RotationComparator from './components/RotationComparator';
import NasaGeoMap from './components/NasaGeoMap';
import ClimateRiskCalendar from './components/ClimateRiskCalendar';
import ChatbotAdvisor from './components/ChatbotAdvisor';
import HardwareModal from './components/HardwareModal';
import { 
  fetchCurrentSoil, fetchSoilHistory, fetchNasaObservations, 
  fetchRotationStrategies, fetchForecast, fetchNasaGibs,
  createTelemetryWebSocket 
} from './services/api';
import { RefreshCw, AlertCircle, Satellite, Cpu, Droplet, Sprout } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('gis');
  const [location, setLocation] = useState({
    name: "Delhi Basin (IARI Pusa / Najafgarh)",
    lat: 28.6139,
    lon: 77.2090
  });

  const [soilReading, setSoilReading] = useState(null);
  const [soilHistory, setSoilHistory] = useState([]);
  const [nasaObs, setNasaObs] = useState(null);
  const [gibsLayers, setGibsLayers] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("FIELD_SHIFT_NVIDIA_KEY") || "");
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [currentSoil, history, nasa, rot, fc, gibs] = await Promise.all([
        fetchCurrentSoil(),
        fetchSoilHistory(30),
        fetchNasaObservations(location.lat, location.lon),
        fetchRotationStrategies(location.lat, location.lon),
        fetchForecast(location.lat, location.lon),
        fetchNasaGibs()
      ]);

      setSoilReading(currentSoil);
      setSoilHistory(history);
      setNasaObs(nasa);
      setStrategies(rot);
      setForecast(fc);
      setGibsLayers(gibs);
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError(err.message || "Failed to connect to backend service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [location]);

  // Real-time WebSocket connection for live telemetry stream
  useEffect(() => {
    const ws = createTelemetryWebSocket(
      (data) => {
        if (data.type === "telemetry_tick" && data.soil) {
          setSoilReading(data.soil);
          setSoilHistory((prev) => {
            const next = [...prev, data.soil];
            return next.length > 50 ? next.slice(-50) : next;
          });
        }
      },
      (err) => {
        console.warn("Telemetry WebSocket fallback to polling:", err);
      }
    );

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Navigation & Global Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        location={location}
        setLocation={setLocation}
        soilReading={soilReading}
        nasaObs={nasaObs}
        apiKey={apiKey}
        setApiKey={setApiKey}
        openHardwareModal={() => setIsHardwareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Error notification banner if any */}
        {error && (
          <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-4 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}. Check that the FastAPI backend is running on port 8000.</span>
            </div>
            <button
              onClick={loadInitialData}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !soilReading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center animate-pulse">
              <Satellite className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Initializing FIELD SHIFT Mission Feed</h3>
              <p className="text-xs text-slate-400 mt-1">Connecting NASA Earth Observations & 8-in-1 IoT Telemetry...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'telemetry' && (
              <SoilTelemetryCard
                soilReading={soilReading}
                soilHistory={soilHistory}
                nasaObs={nasaObs}
              />
            )}

            {activeTab === 'rotations' && (
              <RotationComparator
                strategies={strategies}
                soilReading={soilReading}
                nasaObs={nasaObs}
              />
            )}

            {activeTab === 'gis' && (
              <NasaGeoMap
                location={location}
                nasaObs={nasaObs}
                soilReading={soilReading}
                gibsLayers={gibsLayers}
              />
            )}

            {activeTab === 'forecast' && (
              <ClimateRiskCalendar
                forecast={forecast}
                nasaObs={nasaObs}
              />
            )}

            {activeTab === 'chat' && (
              <ChatbotAdvisor
                soilReading={soilReading}
                nasaObs={nasaObs}
                apiKey={apiKey}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">FIELD SHIFT</span>
            <span>•</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>
          <div>
            Built with NASA Earth Observations (SMAP, GPM IMERG, Landsat/MODIS, NASA POWER) & NVIDIA NIM.
          </div>
          <div className="text-[11px] text-slate-600">
            Designed for Farmer Decision Support & Multi-generational Agricultural Resilience
          </div>
        </div>
      </footer>

      {/* Hardware Pinout & Test Modal */}
      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        onSendTestReading={loadInitialData}
      />

    </div>
  );
}
