import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FarmerSimpleView from './components/FarmerSimpleView';
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
import { RefreshCw, AlertCircle, Satellite, Cpu, Droplet, Sprout, Navigation } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('farmer');
  const [initialAiQuery, setInitialAiQuery] = useState('');
  const [location, setLocation] = useState({
    name: "Auto-Detecting Computer Location...",
    lat: 28.6139,
    lon: 77.2090,
    isDeviceLocation: false
  });
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Farmer Priorities & Constraints (NASA Challenge Requirement)
  const [farmerPriority, setFarmerPriority] = useState('water_conservation');
  const [waterConstraint, setWaterConstraint] = useState('moderate_tubewell');
  const [machineryAccess, setMachineryAccess] = useState('zero_till_happy_seeder');

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

  // Auto-detect computer / device Latitude and Longitude
  const detectDeviceLocation = () => {
    setDetectingLocation(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lon = parseFloat(position.coords.longitude.toFixed(4));
          console.log(`[Geolocation] Successfully acquired computer coordinates: ${lat}, ${lon}`);
          setLocation({
            name: `My Computer GPS (${lat}° N, ${lon}° E)`,
            lat: lat,
            lon: lon,
            isDeviceLocation: true
          });
          setDetectingLocation(false);
        },
        async (err) => {
          console.warn("[Geolocation] Browser GPS permission denied or timed out. Falling back to IP-based location:", err.message);
          try {
            const res = await fetch('/api/location/ip');
            const data = await res.json();
            if (data.lat && data.lon) {
              const lat = parseFloat(data.lat.toFixed(4));
              const lon = parseFloat(data.lon.toFixed(4));
              setLocation({
                name: `${data.city || 'Local Area'} (${lat}° N, ${lon}° E)`,
                lat: lat,
                lon: lon,
                isDeviceLocation: true
              });
            }
          } catch (e) {
            console.error("IP Geolocation fallback failed:", e);
          } finally {
            setDetectingLocation(false);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      // Fallback if browser doesn't support geolocation
      fetch('/api/location/ip')
        .then(r => r.json())
        .then(data => {
          if (data.lat && data.lon) {
            setLocation({
              name: `${data.city || 'Local Area'} (${data.lat.toFixed(4)}° N, ${data.lon.toFixed(4)}° E)`,
              lat: data.lat,
              lon: data.lon,
              isDeviceLocation: true
            });
          }
        })
        .finally(() => setDetectingLocation(false));
    }
  };

  // Run location detection on initial mount
  useEffect(() => {
    detectDeviceLocation();
  }, []);

  // Fetch NASA & Agronomy data whenever coordinates or farmer constraints change
  const loadDataForLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const [currentSoil, history, nasa, rot, fc, gibs] = await Promise.all([
        fetchCurrentSoil(),
        fetchSoilHistory(30),
        fetchNasaObservations(location.lat, location.lon),
        fetchRotationStrategies(location.lat, location.lon, farmerPriority, waterConstraint, machineryAccess),
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
      console.error("Failed to load data for coordinates:", err);
      setError(err.message || "Failed to connect to NASA observation feeds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataForLocation();
  }, [location.lat, location.lon, farmerPriority, waterConstraint, machineryAccess]);

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
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#0f1117', color: '#e8eaf6' }}>
      
      {/* Navigation & Global Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        location={location}
        setLocation={setLocation}
        detectDeviceLocation={detectDeviceLocation}
        detectingLocation={detectingLocation}
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
          <div className="rounded-xl p-4 flex items-center justify-between text-sm"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}. Check backend server on port 8000.</span>
            </div>
            <button onClick={loadDataForLocation}
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#fff' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !soilReading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
                 style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
              <Satellite className="w-6 h-6 spin" style={{ color: '#4f8ef7' }} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Connecting to NASA Satellite Feeds…</h3>
              <p className="text-xs mt-1" style={{ color: '#9ea3b8' }}>
                Coordinates: <span className="font-mono" style={{ color: '#4f8ef7' }}>{location.lat}° N, {location.lon}° E</span>
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'farmer' && (
              <FarmerSimpleView
                soilReading={soilReading}
                nasaObs={nasaObs}
                location={location}
                onSelectTab={setActiveTab}
                onAskAi={(question) => {
                  setInitialAiQuery(question);
                  setActiveTab('chat');
                }}
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

            {activeTab === 'rotations' && (
              <RotationComparator
                strategies={strategies}
                soilReading={soilReading}
                nasaObs={nasaObs}
                location={location}
                farmerPriority={farmerPriority}
                setFarmerPriority={setFarmerPriority}
                waterConstraint={waterConstraint}
                setWaterConstraint={setWaterConstraint}
                machineryAccess={machineryAccess}
                setMachineryAccess={setMachineryAccess}
                onConstraintChange={(p, w, m) => {
                  setFarmerPriority(p);
                  setWaterConstraint(w);
                  setMachineryAccess(m);
                }}
              />
            )}

            {activeTab === 'telemetry' && (
              <SoilTelemetryCard
                soilReading={soilReading}
                soilHistory={soilHistory}
                nasaObs={nasaObs}
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
                initialQuery={initialAiQuery}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs" style={{ borderTop: '1px solid #1e2130', background: '#0a0c14', color: '#6b7194' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">FIELD SHIFT</span>
            <span>•</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>
          <div>SMAP · GPM IMERG · MODIS · Landsat · NASA POWER · GRACE-FO · ECOSTRESS</div>
          <div className="font-mono" style={{ color: '#9ea3b8' }}>
            {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
          </div>
        </div>
      </footer>

      {/* Hardware Pinout & Test Modal */}
      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        onSendTestReading={loadDataForLocation}
      />

    </div>
  );
}
