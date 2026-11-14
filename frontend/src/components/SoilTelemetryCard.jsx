import React, { useState } from 'react';
import { 
  Droplet, Thermometer, Zap, Activity, Sprout, 
  AlertTriangle, CheckCircle, TrendingUp, Info, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

export default function SoilTelemetryCard({ soilReading, soilHistory, nasaObs }) {
  const [activeChartMetric, setActiveChartMetric] = useState('moisture_temp');

  if (!soilReading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Connecting to Edge Telemetry Stream...</span>
      </div>
    );
  }

  // Format historical chart data
  const chartData = (soilHistory || []).map((item, idx) => {
    const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${idx}`;
    return {
      time: timeStr,
      moisture: item.soil_moisture,
      temperature: item.soil_temperature,
      nitrogen: item.nitrogen,
      phosphorus: item.phosphorus,
      potassium: item.potassium,
      ph: item.ph,
      ec: item.electrical_conductivity
    };
  });

  const getHealthColor = (score) => {
    if (score >= 80) return "from-emerald-500 to-green-600 border-emerald-500/30 text-emerald-400";
    if (score >= 60) return "from-amber-500 to-yellow-600 border-amber-500/30 text-amber-400";
    return "from-rose-500 to-red-600 border-rose-500/30 text-rose-400";
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Soil Health Index & Satellite Coupling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Soil Health Index Gauge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
                  Ground Truth 8-in-1 Sensor
                </span>
                <span className="text-xs text-slate-400">
                  Node: <span className="font-mono text-slate-200">{soilReading.device_id}</span>
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-2">Overall Soil Health Index</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Calculated in real-time by combining chemical NPK levels, pH balance, moisture saturation, and electrical conductivity (EC).
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-4xl font-extrabold text-white tracking-tight">
                  {soilReading.soil_health_index}
                  <span className="text-lg font-normal text-slate-500">/100</span>
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                  soilReading.soil_health_index >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  soilReading.soil_health_index >= 60 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  'bg-red-950 text-red-400 border border-red-800'
                }`}>
                  {soilReading.health_status}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${getHealthColor(soilReading.soil_health_index)}`}
              style={{ width: `${soilReading.soil_health_index}%` }}
            ></div>
          </div>

          {/* Active Diagnostic Alerts */}
          {soilReading.alerts && soilReading.alerts.length > 0 && (
            <div className="mt-4 space-y-2">
              {soilReading.alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-amber-950/40 border border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NASA Satellite Coupling Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950/60 border border-blue-900/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                NASA Satellite Fusion
              </span>
              <span className="text-[11px] text-slate-400 font-mono">MERRA-2 / SMAP</span>
            </div>
            <h3 className="text-base font-bold text-white mt-3">Orbital vs Ground Moisture</h3>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">Ground 8-in-1 Sensor:</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{soilReading.soil_moisture}%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">SMAP Root-Zone Wetness:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{nasaObs?.root_zone_moisture ?? 0.45} (0-1)</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">Regional Moisture Anomaly:</span>
                <span className={`text-sm font-bold font-mono ${
                  (nasaObs?.soil_moisture_anomaly ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {nasaObs?.soil_moisture_anomaly ?? -0.02}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed border-t border-slate-800/80 pt-3">
            Satellite SMAP captures 9km scale regional root wetness, while your 8-in-1 sensor validates field-scale root infiltration.
          </p>
        </div>

      </div>

      {/* The 8-in-1 Sensor Parameter Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>8-in-1 Soil Telemetry Breakdown</span>
          </h3>
          <span className="text-xs text-slate-400">
            Calibrated Indo-Gangetic Basin Profile
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. Moisture */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Moisture</span>
              <Droplet className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.soil_moisture} <span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Target: 20-30%</span>
              <span className={soilReading.soil_moisture >= 18 ? "text-emerald-400" : "text-amber-400"}>
                {soilReading.soil_moisture >= 18 ? "Adequate" : "Low"}
              </span>
            </div>
          </div>

          {/* 2. Temperature */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Soil Temp</span>
              <Thermometer className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.soil_temperature} <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Optimal: 18-28°C</span>
              <span className="text-emerald-400">Normal</span>
            </div>
          </div>

          {/* 3. Soil pH */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Soil pH</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.ph}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Ideal: 6.5 - 7.5</span>
              <span className={soilReading.ph > 7.6 ? "text-amber-400" : "text-emerald-400"}>
                {soilReading.ph > 7.6 ? "Mildly Alkaline" : "Neutral"}
              </span>
            </div>
          </div>

          {/* 4. Electrical Conductivity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">EC (Conductivity)</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.electrical_conductivity} <span className="text-xs font-normal text-slate-400">µS/cm</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Limit: &lt;1200</span>
              <span className="text-emerald-400">Low Salinity</span>
            </div>
          </div>

          {/* 5. Nitrogen (N) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Nitrogen (N)</span>
              <Sprout className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.nitrogen} <span className="text-xs font-normal text-slate-400">mg/kg</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Target: &gt;35</span>
              <span className={soilReading.nitrogen < 30 ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                {soilReading.nitrogen < 30 ? "Deficient" : "Medium"}
              </span>
            </div>
          </div>

          {/* 6. Phosphorus (P) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Phosphorus (P)</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.phosphorus} <span className="text-xs font-normal text-slate-400">mg/kg</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Target: 15-25</span>
              <span className="text-emerald-400">Medium</span>
            </div>
          </div>

          {/* 7. Potassium (K) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Potassium (K)</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.potassium} <span className="text-xs font-normal text-slate-400">mg/kg</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Target: &gt;150</span>
              <span className="text-emerald-400 font-semibold">Sufficient</span>
            </div>
          </div>

          {/* 8. Salinity / TDS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-teal-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Salinity / TDS</span>
              <Activity className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {soilReading.salinity} <span className="text-xs font-normal text-slate-400">mg/L</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Limit: &lt;600</span>
              <span className="text-emerald-400">Normal</span>
            </div>
          </div>

        </div>
      </div>

      {/* 24-Hour Telemetry History Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Edge Sensor Telemetry Trend</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous sampling capturing diurnal cycling & soil moisture-temperature interactions.
            </p>
          </div>

          {/* Metric switcher */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveChartMetric('moisture_temp')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeChartMetric === 'moisture_temp' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Moisture & Temp
            </button>
            <button
              onClick={() => setActiveChartMetric('npk')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeChartMetric === 'npk' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              NPK Nutrients
            </button>
            <button
              onClick={() => setActiveChartMetric('ph_ec')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeChartMetric === 'ph_ec' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              pH & Salinity
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartMetric === 'moisture_temp' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FC3D21" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FC3D21" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="moisture" stroke="#00E5FF" fillOpacity={1} fill="url(#moistGrad)" name="Moisture (%)" />
                <Area type="monotone" dataKey="temperature" stroke="#FC3D21" fillOpacity={1} fill="url(#tempGrad)" name="Temp (°C)" />
              </AreaChart>
            ) : activeChartMetric === 'npk' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="nitrogen" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Nitrogen (mg/kg)" />
                <Area type="monotone" dataKey="phosphorus" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Phosphorus (mg/kg)" />
                <Area type="monotone" dataKey="potassium" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="Potassium (mg/kg)" />
              </AreaChart>
            ) : (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="ph" stroke="#c084fc" fill="#c084fc" fillOpacity={0.2} name="pH" />
                <Area type="monotone" dataKey="ec" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="EC (µS/cm)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
