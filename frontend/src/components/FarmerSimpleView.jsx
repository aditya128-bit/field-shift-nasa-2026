import React, { useState, useEffect } from 'react';
import {
  Droplets, Sun, Sprout, AlertTriangle, CheckCircle2,
  ArrowRight, Leaf, Calendar, Zap, MapPin, TrendingUp,
  Thermometer, CloudRain, Wind, Activity, Shield, Sparkles,
  Waves, FlaskConical, Search, Check
} from 'lucide-react';
import { 
  fetchCropProfile, setFarmerCrop, fetchCropAlerts, 
  fetchActiveHazards, fetchOrganicFertilizer, fetchGroundwaterSeaLevel 
} from '../services/api';

const POPULAR_CROPS = [
  { name: 'Wheat', emoji: '🌾', season: 'Rabi' },
  { name: 'Rice', emoji: '🌾', season: 'Kharif' },
  { name: 'Mustard', emoji: '🌼', season: 'Rabi' },
  { name: 'Mung Bean', emoji: '🫘', season: 'Zaid/Kharif' },
  { name: 'Cotton', emoji: '🌸', season: 'Kharif' },
  { name: 'Sugarcane', emoji: '🎋', season: 'Annual' },
  { name: 'Sorghum', emoji: '🌽', season: 'Kharif' },
  { name: 'Tomato', emoji: '🍅', season: 'Multi-season' },
];

export default function FarmerSimpleView({
  soilReading,
  nasaObs,
  location,
  onSelectTab,
  onAskAi
}) {
  const [cropProfile, setCropProfile] = useState(null);
  const [cropAlerts, setCropAlerts] = useState([]);
  const [hazards, setHazards] = useState(null);
  const [organicPlan, setOrganicPlan] = useState(null);
  const [groundwaterData, setGroundwaterData] = useState(null);
  const [customCropInput, setCustomCropInput] = useState('');
  const [isUpdatingCrop, setIsUpdatingCrop] = useState(false);

  const moisture = soilReading?.soil_moisture ?? 22.5;
  const temp     = nasaObs?.temp_2m ?? 24.2;
  const tmax     = nasaObs?.temp_max ?? 30.5;
  const rain     = nasaObs?.precipitation_mm ?? 0;
  const wind     = nasaObs?.wind_speed ?? 1.8;
  const shi      = soilReading?.soil_health_index ?? 82;
  const ph       = soilReading?.ph ?? 7.8;

  // Load crop profile, hazards, organic fertilizer, and groundwater
  const loadAgroIntelligence = async (cropName = null) => {
    try {
      let prof;
      if (cropName) {
        setIsUpdatingCrop(true);
        prof = await setFarmerCrop(cropName, null, location.lat, location.lon);
        setIsUpdatingCrop(false);
      } else {
        prof = await fetchCropProfile();
      }
      setCropProfile(prof);

      const targetCrop = prof?.name || 'Wheat';
      const [alertsRes, hazRes, orgRes, gwRes] = await Promise.all([
        fetchCropAlerts(location.lat, location.lon),
        fetchActiveHazards(location.lat, location.lon),
        fetchOrganicFertilizer(targetCrop, location.lat, location.lon),
        fetchGroundwaterSeaLevel(location.lat, location.lon)
      ]);

      setCropAlerts(alertsRes?.alerts || []);
      setHazards(hazRes);
      setOrganicPlan(orgRes);
      setGroundwaterData(gwRes);
    } catch (err) {
      console.warn("[AgroIntelligence Load Error]", err);
      setIsUpdatingCrop(false);
    }
  };

  useEffect(() => {
    loadAgroIntelligence();
  }, [location.lat, location.lon]);

  const handleSelectCrop = (cropName) => {
    loadAgroIntelligence(cropName);
  };

  const handleCustomCropSubmit = (e) => {
    e.preventDefault();
    if (customCropInput.trim()) {
      handleSelectCrop(customCropInput.trim());
      setCustomCropInput('');
    }
  };

  // Tolerances
  const thresh = cropProfile?.thresholds || {
    soil_moisture_min: 18,
    soil_moisture_max: 32,
    temp_max_c: 35,
    heat_stress_c: 38,
    frost_risk_c: 2
  };

  // Status indicators
  const moistureOptimal = moisture >= thresh.soil_moisture_min && moisture <= thresh.soil_moisture_max;
  const heatStressRisk = tmax >= thresh.heat_stress_c;

  const todayStr = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  return (
    <div className="space-y-6 tab-panel">

      {/* ── Active Weather Hazards & Extreme Alert Banner ── */}
      {hazards?.alerts?.length > 0 && (
        <div className="rounded-xl p-4 shadow-xl"
             style={{ 
               background: hazards.overall_status === 'EMERGENCY' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)', 
               border: `1px solid ${hazards.overall_status === 'EMERGENCY' ? '#ef4444' : '#f59e0b'}` 
             }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg text-2xl">
                {hazards.alerts[0].icon || '⚠️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{hazards.alerts[0].title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                        style={{ background: '#ef4444', color: '#fff' }}>
                    {hazards.alerts[0].level}
                  </span>
                  <span className="text-xs text-gray-400">({hazards.total_alerts} active warnings)</span>
                </div>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed max-w-3xl">
                  {hazards.alerts[0].message}
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab('gis')}
              className="self-start sm:self-center px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              <span>View On Radar Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Crop Selector & Personalized Parameter Tolerances ── */}
      <div className="rounded-xl p-6 shadow-xl" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2a2d3e]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: '#0b3d91', color: '#fff' }}>
                AI Crop Intelligence
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {location.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>{cropProfile?.emoji || '🌾'}</span>
              <span>Current Crop: <span className="text-[#4f8ef7]">{cropProfile?.name || 'Wheat'}</span></span>
            </h1>
            <p className="text-xs mt-1" style={{ color: '#9ea3b8' }}>
              All NASA environmental thresholds, water balances, and hazard alarms below are tailored specifically to this plant.
            </p>

            {/* AI Generation Badge & Agrometeorological Rationale */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5"
                    style={{ background: 'rgba(79, 142, 247, 0.15)', border: '1px solid rgba(79, 142, 247, 0.3)', color: '#8ab4f8' }}>
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>AI Agrometeorology: {cropProfile?.source || "NVIDIA NIM (google/gemma-4-31b-it)"}</span>
              </span>
              {isUpdatingCrop ? (
                <span className="text-xs text-amber-300 animate-pulse font-medium">
                  ⚡ Querying NVIDIA NIM AI for {customCropInput || "selected crop"}...
                </span>
              ) : cropProfile?.llm_reasoning ? (
                <span className="text-xs text-slate-300 italic">
                  "{cropProfile.llm_reasoning}"
                </span>
              ) : null}
            </div>
          </div>

          {/* Custom crop text input */}
          <form onSubmit={handleCustomCropSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type any crop (e.g. Maize, Chickpea)..."
              value={customCropInput}
              onChange={e => setCustomCropInput(e.target.value)}
              className="px-3.5 py-2 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: '#0f1117', border: '1px solid #2a2d3e', minWidth: '220px' }}
            />
            <button
              type="submit"
              disabled={isUpdatingCrop}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow"
            >
              {isUpdatingCrop ? 'Updating…' : 'Set Crop'}
            </button>
          </form>
        </div>

        {/* Quick Crop Selector Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 mr-1">Switch Crop:</span>
          {POPULAR_CROPS.map(c => {
            const isSelected = cropProfile?.name?.toLowerCase().includes(c.name.toLowerCase());
            return (
              <button
                key={c.name}
                onClick={() => handleSelectCrop(c.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-white/5 border border-[#2a2d3e]'
                }`}
              >
                <span>{c.emoji}</span>
                <span>{c.name}</span>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}
        </div>

        {/* Crop Dynamic Parameter Ranges & Thresholds */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-[#2a2d3e]">
          
          {/* Optimal Moisture Range */}
          <div className="p-3 rounded-lg" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Optimal Soil Moisture</span>
              <span className={moistureOptimal ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {moistureOptimal ? '✅ Within Range' : '⚠️ Deficit'}
              </span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {thresh.soil_moisture_min}% – {thresh.soil_moisture_max}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Current sensor: <b className="text-white">{moisture}%</b>
            </div>
          </div>

          {/* Thermal Ceiling */}
          <div className="p-3 rounded-lg" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Thermal Stress Ceiling</span>
              <span className={heatStressRisk ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {heatStressRisk ? '🔥 Heat Stress' : '✅ Safe'}
              </span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              Max {thresh.heat_stress_c || 35}°C
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              NASA peak today: <b className="text-white">{tmax}°C</b>
            </div>
          </div>

          {/* Water Requirement */}
          <div className="p-3 rounded-lg" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Full Season Water Need</span>
              <span className="text-blue-400 font-semibold">{cropProfile?.season || 'Season'}</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {cropProfile?.water_need_mm_season || 450} mm
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Duration: <b className="text-white">{cropProfile?.duration_days || 150} days</b>
            </div>
          </div>

          {/* Active Growth Stage */}
          <div className="p-3 rounded-lg" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Stage</span>
              <span className="text-emerald-400 font-semibold">Stage 1 of {cropProfile?.stages?.length || 5}</span>
            </div>
            <div className="text-base font-bold text-emerald-300 truncate">
              {cropProfile?.stages?.[0]?.name || 'Sowing / Vegetative'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expected Harvest: <b className="text-white">{cropProfile?.expected_harvest || '150 days'}</b>
            </div>
          </div>

        </div>

        {/* Active Crop Tolerance Alerts */}
        {cropAlerts?.length > 0 && (
          <div className="mt-4 p-3 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2"
               style={{ background: 'rgba(79, 142, 247, 0.1)', border: '1px solid rgba(79, 142, 247, 0.25)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">{cropAlerts[0].level.includes('Emergency') ? '🆘' : '💡'}</span>
              <span className="font-semibold text-white">{cropAlerts[0].level}:</span>
              <span className="text-slate-300">{cropAlerts[0].message}</span>
            </div>
            <button
              onClick={() => onAskAi(`How do I protect my ${cropProfile?.name} crop given current soil moisture of ${moisture}% and peak temp of ${tmax}°C?`)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
            >
              Ask AI Agronomist →
            </button>
          </div>
        )}
      </div>

      {/* ── 4 Primary Decision Metric Cards ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Water / Irrigation */}
        <div className="card-hover rounded-xl p-5 flex flex-col justify-between"
             style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}
             onClick={() => onSelectTab('telemetry')}>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Water & Root Moisture</span>
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${moistureOptimal ? 'status-good' : 'status-warn'}`}>
                {moistureOptimal ? '✅ Optimal' : '⚠️ Low'}
              </span>
            </div>
            <div className="mt-3">
              <div className="metric-number text-3xl font-bold text-white">{moisture}%</div>
              <div className="text-xs text-slate-400 mt-0.5">8-in-1 IoT Probe reading</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2a2d3e] text-xs" style={{ color: '#9ea3b8' }}>
            <span className="font-bold text-blue-400">Action: </span>
            <span>{moistureOptimal ? 'Soil moisture sufficient. Defer irrigation to save tube-well electricity.' : 'Plan light irrigation in morning to reach optimal root capacity.'}</span>
          </div>
        </div>

        {/* Card 2: Peak Temperature */}
        <div className="card-hover rounded-xl p-5 flex flex-col justify-between"
             style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}
             onClick={() => onSelectTab('forecast')}>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Peak Temperature</span>
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${heatStressRisk ? 'status-alert' : 'status-good'}`}>
                {heatStressRisk ? '🔥 Heat Risk' : '✅ Mild'}
              </span>
            </div>
            <div className="mt-3">
              <div className="metric-number text-3xl font-bold text-white">{tmax}°C</div>
              <div className="text-xs text-slate-400 mt-0.5">NASA POWER Peak Surface Temp</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2a2d3e] text-xs" style={{ color: '#9ea3b8' }}>
            <span className="font-bold text-amber-400">Action: </span>
            <span>{heatStressRisk ? 'High heat alert. Maintain straw mulch to avoid root-zone thermal scorch.' : 'Temperature range supports healthy crop vegetative growth.'}</span>
          </div>
        </div>

        {/* Card 3: Rainfall */}
        <div className="card-hover rounded-xl p-5 flex flex-col justify-between"
             style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}
             onClick={() => onSelectTab('forecast')}>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                <span>GPM 24h Rainfall</span>
              </span>
              <span className="text-xs status-info px-2 py-0.5 rounded-full font-bold">
                {rain > 5 ? '🌧 Active' : '☀️ Dry'}
              </span>
            </div>
            <div className="mt-3">
              <div className="metric-number text-3xl font-bold text-white">{rain} mm</div>
              <div className="text-xs text-slate-400 mt-0.5">NASA GPM IMERG Microwave</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2a2d3e] text-xs" style={{ color: '#9ea3b8' }}>
            <span className="font-bold text-cyan-400">Action: </span>
            <span>{rain > 20 ? 'Heavy rain detected. Ensure field drainage channels are cleared.' : 'No rainfall today. Monitor transpiration loss.'}</span>
          </div>
        </div>

        {/* Card 4: Soil Health Score */}
        <div className="card-hover rounded-xl p-5 flex flex-col justify-between"
             style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}
             onClick={() => onSelectTab('rotations')}>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>Soil Health Index</span>
              </span>
              <span className="text-xs status-good px-2 py-0.5 rounded-full font-bold">
                {shi >= 75 ? '🟢 Healthy' : '🟡 Moderate'}
              </span>
            </div>
            <div className="mt-3">
              <div className="metric-number text-3xl font-bold text-white">{shi}/100</div>
              <div className="text-xs text-slate-400 mt-0.5">pH: {ph} (Alluvial Soil Series)</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2a2d3e] text-xs" style={{ color: '#9ea3b8' }}>
            <span className="font-bold text-emerald-400">Action: </span>
            <span>See Organic Fertilizer plan below for natural bio-nutrition.</span>
          </div>
        </div>

      </div>

      {/* ── Organic Fertilizer & Natural Nutrition Advisory ── */}
      <div className="rounded-xl p-6 shadow-xl" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2a2d3e]">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Organic Fertilizer & Natural Soil Enrichment Plan
              </h2>
              <p className="text-xs text-slate-400">
                Tailored for {cropProfile?.name || 'Wheat'} based on current soil pH ({ph}) and weather forecast
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full status-good font-bold">
            Reduces Synthetic N by {organicPlan?.expected_chemical_n_reduction_pct || 40}%
          </span>
        </div>

        {organicPlan?.weather_precaution && (
          <div className="mb-4 p-3 rounded-lg status-warn text-xs">
            {organicPlan.weather_precaution}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Green Manure */}
          <div className="p-4 rounded-xl" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Leaf className="w-3.5 h-3.5" />
              <span>Green Manure Option</span>
            </div>
            <div className="font-bold text-white text-sm">
              {organicPlan?.green_manure_options?.[0]?.species || 'Sunnhemp / Dhaincha'}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Biomass: <b>{organicPlan?.green_manure_options?.[0]?.biomass_yield || '15 t/ha'}</b>
            </div>
            <div className="text-xs text-emerald-300 mt-1">
              Adds: <b>{organicPlan?.green_manure_options?.[0]?.nitrogen_addition || '60 kg N/ha'}</b>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {organicPlan?.green_manure_options?.[0]?.timing}
            </p>
          </div>

          {/* Biofertilizers */}
          <div className="p-4 rounded-xl" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Biofertilizer Seed Pack</span>
            </div>
            <div className="font-bold text-white text-sm">
              {organicPlan?.biofertilizers?.[0]?.name || 'Azotobacter & PSB'}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Dosage: <b>{organicPlan?.biofertilizers?.[0]?.dosage}</b>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {organicPlan?.biofertilizers?.[0]?.mechanism}
            </p>
          </div>

          {/* Fermented Formulations */}
          <div className="p-4 rounded-xl" style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Fermented Bio-Stimulant</span>
            </div>
            <div className="font-bold text-white text-sm">
              {organicPlan?.bio_stimulants?.[0]?.formulation || 'Liquid Jeevamrut'}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Application: <b>{organicPlan?.bio_stimulants?.[0]?.application}</b>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {organicPlan?.bio_stimulants?.[0]?.impact}
            </p>
          </div>

        </div>
      </div>

      {/* ── NASA GRACE-FO Groundwater & Coastal Risk Strip ── */}
      <div className="rounded-xl px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4"
           style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-950 text-blue-400 flex-shrink-0">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">NASA GRACE-FO Groundwater Trend</span>
              <span className="text-[10px] status-alert px-2 py-0.5 rounded-full font-bold">
                {groundwaterData?.grace_groundwater?.depletion_status || 'Critical Aquifer'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Drawdown velocity: <b className="text-rose-400 font-mono">{groundwaterData?.grace_groundwater?.terrestrial_water_storage_anomaly_trend || '-3.4 cm/year'}</b>. {groundwaterData?.grace_groundwater?.pumping_guidance}
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-4 flex-shrink-0">
          <div>Distance to Coast: <b className="text-white">{groundwaterData?.distance_to_coast_km ?? 1086} km</b></div>
          <button
            onClick={() => onSelectTab('forecast')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            Multi-Window Forecast →
          </button>
        </div>
      </div>

      {/* ── Quick AI Questions ───────────────────────────── */}
      <div className="rounded-xl p-5" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Ask AI Agronomist About {cropProfile?.name || 'Crop'}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            `How should I adjust irrigation for ${cropProfile?.name} with today's readings?`,
            `What is the best green manure before sowing ${cropProfile?.name}?`,
            `How do I protect ${cropProfile?.name} against upcoming heat stress?`,
            `Are there any active storm or cyclone risks for my location?`,
            `How do I prepare Jeevamrut for biological soil enrichment?`
          ].map(q => (
            <button
              key={q}
              onClick={() => onAskAi(q)}
              className="text-xs px-3.5 py-2 rounded-lg font-medium transition hover:bg-white/5"
              style={{ background: '#0f1117', border: '1px solid #2a2d3e', color: '#e8eaf6' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
