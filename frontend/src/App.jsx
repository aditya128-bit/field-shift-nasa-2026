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
import { RefreshCw, AlertCircle, Satellite, Cpu, Droplet, Sprout, Navigation } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('gis');
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-[#FCEE21] selection:text-black">
      
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
          <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-4 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}. Check backend server on port 8000.</span>
            </div>
            <button
              onClick={loadDataForLocation}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !soilReading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center animate-pulse">
              <Satellite className="w-6 h-6 text-[#FCEE21] animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Acquiring NASA Observations for Your Location</h3>
              <p className="text-xs text-slate-400 mt-1">
                Coordinates: <span className="font-mono text-cyan-300">{location.lat}° N, {location.lon}° E</span>
              </p>
            </div>
          </div>
        ) : (
          <>
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
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#132242] bg-[#030919] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">FIELD SHIFT</span>
            <span>•</span>
            <span className="text-[#FCEE21]">NASA Space Apps Challenge 2026</span>
          </div>
          <div>
            Open NASA Earth Observations (SMAP, GPM IMERG, Landsat/MODIS, NASA POWER) & Edge IoT.
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Active GPS: {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
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
