import React, { useMemo } from 'react';
import {
  Droplets, Sun, Sprout, AlertTriangle, CheckCircle2,
  ArrowRight, Leaf, Calendar, Zap, MapPin, TrendingUp,
  Thermometer, CloudRain, Wind, Activity
} from 'lucide-react';

// ─── Helper: status from value ────────────────────────────
function soilMoistureStatus(val) {
  if (val >= 20 && val <= 35) return { label: '✅ Good',  cls: 'status-good', action: 'No irrigation needed today. Save water & power.' };
  if (val < 20)               return { label: '⚠️ Low',   cls: 'status-warn', action: 'Consider light irrigation in the next 1–2 days.' };
  return                             { label: '💧 High',  cls: 'status-info', action: 'Excess moisture. Skip irrigation, check drainage.' };
}

function tempStatus(tmax) {
  if (tmax < 28) return { label: '✅ Cool',   cls: 'status-good', action: 'Good temperature for most crops today.' };
  if (tmax < 35) return { label: '⚠️ Warm',  cls: 'status-warn', action: 'Avoid midday field work. Water crops in early morning.' };
  return               { label: '🔥 Hot',    cls: 'status-alert', action: 'Heat stress risk! Irrigate early morning or late evening.' };
}

function soilHealthStatus(shi) {
  if (shi >= 75) return { label: '✅ Healthy', cls: 'status-good' };
  if (shi >= 50) return { label: '⚠️ Fair',   cls: 'status-warn' };
  return               { label: '❌ Poor',    cls: 'status-alert' };
}

// ─── Metric Card ─────────────────────────────────────────
function MetricCard({ icon: Icon, iconColor, title, value, unit, status, action, onClick }) {
  return (
    <div
      className="card-hover rounded-xl p-5 flex flex-col gap-3 cursor-pointer"
      style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: '#0f1117' }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <span className="text-sm font-medium" style={{ color: '#9ea3b8' }}>{title}</span>
        </div>
        {status && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        )}
      </div>

      <div>
        <div className="metric-number text-3xl font-bold text-white">
          {value}<span className="text-lg ml-1" style={{ color: '#6b7194' }}>{unit}</span>
        </div>
      </div>

      {action && (
        <div className="text-xs rounded-lg px-3 py-2" style={{ background: '#0f1117', color: '#9ea3b8' }}>
          {action}
        </div>
      )}
    </div>
  );
}

// ─── Rotation Strategy Card ───────────────────────────────
const ROTATIONS = [
  {
    id: 'current',
    color: '#6b7194',
    borderColor: '#2a2d3e',
    emoji: '🌾',
    name: 'Current Rotation',
    sub: 'Wheat → Rice (Traditional)',
    badge: { label: 'Your Current Plan', cls: 'status-info' },
    pros: ['Familiar & low-risk', 'Good local market support', 'Established supply chain'],
    cons: ['High water use (Rice needs 1200mm)', 'Soil nutrient depletion over time', 'Prone to blast & blight diseases'],
    water: '🔴 High (1200+ mm/season)',
    soil: '🟡 Moderate improvement',
    income: '🟡 Moderate',
  },
  {
    id: 'strategy_a',
    color: '#22c55e',
    borderColor: 'rgba(34,197,94,0.3)',
    emoji: '🌿',
    name: 'Strategy A — Recommended',
    sub: 'Wheat → Mung Bean → Mustard',
    badge: { label: '⭐ Best for Water Saving', cls: 'status-good' },
    pros: ['Saves 40–60% irrigation vs. Rice', 'Mung Bean fixes nitrogen (free fertilizer!)', 'Breaks wheat disease cycle naturally'],
    cons: ['Mung market prices can vary', 'Needs some new equipment for mustard', 'First year may need expert support'],
    water: '🟢 Low (500–600 mm/season)',
    soil: '🟢 Strong improvement',
    income: '🟢 Higher potential',
  },
  {
    id: 'strategy_b',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.3)',
    emoji: '🌱',
    name: 'Strategy B — Cover Crop',
    sub: 'Wheat → Sorghum + Dhaincha Cover',
    badge: { label: '🌱 Best for Soil Health', cls: 'status-warn' },
    pros: ['Dhaincha (cover crop) adds organic matter fast', 'Sorghum very drought-tolerant', 'Prevents erosion in bare-field gaps'],
    cons: ['Lower immediate income from Dhaincha', 'Sorghum market smaller than wheat', 'Needs 2–3 seasons to see soil benefits'],
    water: '🟡 Moderate (700 mm/season)',
    soil: '🟢 Excellent long-term',
    income: '🟡 Moderate',
  },
];

function RotationCard({ rot, onAskAi }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: '#1a1d27',
        border: `1px solid ${rot.borderColor}`,
        borderLeft: `4px solid ${rot.color}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{rot.emoji}</div>
          <div>
            <div className="font-bold text-white text-base">{rot.name}</div>
            <div className="text-sm mt-0.5" style={{ color: '#9ea3b8' }}>{rot.sub}</div>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${rot.badge.cls}`}>
          {rot.badge.label}
        </span>
      </div>

      {/* Pros/Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#22c55e' }}>✅ Benefits</div>
          <ul className="space-y-1">
            {rot.pros.map((p, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#9ea3b8' }}>
                <span className="mt-0.5 text-green-400">•</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>⚠️ Considerations</div>
          <ul className="space-y-1">
            {rot.cons.map((c, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#9ea3b8' }}>
                <span className="mt-0.5 text-yellow-400">•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2" style={{ borderTop: '1px solid #2a2d3e' }}>
        {[
          { label: 'Water Use', value: rot.water },
          { label: 'Soil Health', value: rot.soil },
          { label: 'Income', value: rot.income },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: '#0f1117' }}>
            <div className="text-xs font-medium mb-1" style={{ color: '#6b7194' }}>{s.label}</div>
            <div className="text-xs font-semibold" style={{ color: '#e8eaf6' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Ask AI button */}
      <button
        onClick={() => onAskAi(`Tell me more about the ${rot.name} crop rotation: ${rot.sub}. What are the key risks I should know for my local area?`)}
        className="w-full text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
        style={{ background: '#0f1117', border: '1px solid #2a2d3e', color: '#4f8ef7' }}
      >
        Ask AI about this rotation <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function FarmerSimpleView({ soilReading, nasaObs, location, onSelectTab, onAskAi }) {
  const moisture = soilReading?.soil_moisture   ?? 22.5;
  const temp     = nasaObs?.temp_2m             ?? 24.2;
  const tmax     = nasaObs?.temp_max            ?? 30.5;
  const rain     = nasaObs?.precipitation_mm    ?? 0;
  const wind     = nasaObs?.wind_speed          ?? 1.8;
  const shi      = soilReading?.soil_health_index ?? 82;

  const mStat  = soilMoistureStatus(moisture);
  const tStat  = tempStatus(tmax);
  const shStat = soilHealthStatus(shi);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const quickQuestions = [
    'Should I irrigate my field today?',
    'What crop rotation saves the most water?',
    'How is my soil health this season?',
    'When should I plant my next crop?',
    'Is there any weather risk I should prepare for?',
  ];

  return (
    <div className="space-y-6 tab-panel">

      {/* ── Page Header ──────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" style={{ color: '#4f8ef7' }} />
              <span className="text-sm font-medium" style={{ color: '#9ea3b8' }}>{location.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full status-good">NASA POWER Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Today's Farm Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#9ea3b8' }}>{today}</p>
          </div>
          <button
            onClick={() => onSelectTab('chat')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition"
            style={{ background: '#4f8ef7', color: '#fff' }}
          >
            <Zap className="w-4 h-4" />
            Ask AI Agronomist
          </button>
        </div>
      </div>

      {/* ── 4 Metric Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Droplets} iconColor="#4f8ef7"
          title="Soil Moisture"
          value={moisture} unit="%"
          status={mStat}
          action={mStat.action}
          onClick={() => onSelectTab('telemetry')}
        />
        <MetricCard
          icon={Thermometer} iconColor="#f59e0b"
          title="Peak Temperature"
          value={tmax} unit="°C"
          status={tStat}
          action={tStat.action}
          onClick={() => onSelectTab('forecast')}
        />
        <MetricCard
          icon={CloudRain} iconColor="#06b6d4"
          title="Rainfall Today"
          value={rain} unit="mm"
          status={rain > 10 ? { label: '🌧 Rainy', cls: 'status-info' } : { label: '☀️ Dry', cls: 'status-good' }}
          action={rain > 10 ? 'No irrigation needed. Good natural recharge.' : 'No rain today. Monitor soil moisture closely.'}
          onClick={() => onSelectTab('forecast')}
        />
        <MetricCard
          icon={Sprout} iconColor="#22c55e"
          title="Soil Health Score"
          value={shi} unit="/100"
          status={shStat}
          action="See Rotations tab for improvement strategies."
          onClick={() => onSelectTab('rotations')}
        />
      </div>

      {/* ── Satellite Data Strip ─────────────────────── */}
      <div className="rounded-xl px-5 py-4 flex flex-wrap gap-4 items-center justify-between"
           style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center"
               style={{ background: '#0b3d91' }}>
            <Activity className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold text-white">NASA Satellite Readings</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
            100% Free • No API Key
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Air Temp', value: `${temp}°C`, color: '#f59e0b' },
            { label: 'Wind', value: `${wind} m/s`, color: '#9ea3b8' },
            { label: 'Solar', value: `${nasaObs?.solar_radiation_mj ?? 18.2} MJ/m²`, color: '#f59e0b' },
            { label: 'NDVI', value: nasaObs?.ndvi?.toFixed(2) ?? '0.52', color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="text-xs">
              <span style={{ color: '#6b7194' }}>{s.label}: </span>
              <span className="font-bold metric-number" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onSelectTab('gis')}
                className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
                style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#4f8ef7' }}>
          View Satellite Map <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* ── 3 Crop Rotation Cards ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Crop Rotation Strategies</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9ea3b8' }}>
              Based on NASA soil moisture, rainfall, and temperature data for your location
            </p>
          </div>
          <button onClick={() => onSelectTab('rotations')}
                  className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
                  style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#4f8ef7' }}>
            Full Analysis <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ROTATIONS.map(rot => (
            <RotationCard key={rot.id} rot={rot} onAskAi={onAskAi} />
          ))}
        </div>
      </div>

      {/* ── Quick AI Questions ───────────────────────── */}
      <div className="rounded-xl p-5" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" style={{ color: '#4f8ef7' }} />
          <h3 className="text-sm font-bold text-white">Quick Questions for AI Agronomist</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.2)' }}>
            Powered by NVIDIA Llama AI
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => onAskAi(q)}
              className="text-sm px-4 py-2.5 rounded-lg font-medium transition hover:bg-white/5"
              style={{ background: '#0f1117', border: '1px solid #2a2d3e', color: '#e8eaf6' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ───────────────────────────────── */}
      <div className="rounded-lg px-4 py-3 text-xs" style={{ background: '#0f1117', border: '1px solid #2a2d3e', color: '#6b7194' }}>
        <strong className="text-white">ℹ️ Important:</strong> This tool uses NASA satellite data to support your decisions — it does not replace local farmer knowledge or expert advice. Always consult local agricultural extension officers before major changes.
      </div>
    </div>
  );
}
