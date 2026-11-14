import React from 'react';
import { 
  Calendar, AlertCircle, Droplets, Sun, ShieldCheck, 
  TrendingDown, Info, Flame, CloudRain 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

export default function ClimateRiskCalendar({ forecast, nasaObs }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading 30-day Predictive Climate Risk Forecast...
      </div>
    );
  }

  // Chart data
  const chartData = forecast.map((f, i) => ({
    day: `D+${i + 1}`,
    date: f.date,
    moisture: f.predicted_soil_moisture,
    rainProb: f.rain_probability_pct,
    status: f.moisture_status,
    heatRisk: f.heat_risk_level
  }));

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Machine Learning Forecasting
              </span>
              <span className="text-xs text-slate-400">Random Forest Regressor (R² = 0.79)</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">30-Day Predictive Climate Risk Calendar</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Forecasting root-zone moisture depletion, precipitation probabilities, and extreme thermal stress windows to inform optimal sowing and protective cover cropping.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block">Forecast Window:</span>
              <span className="text-sm font-bold text-white font-mono">Next 30 Days</span>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block">Climate Hazard Alert:</span>
              <span className="text-sm font-bold text-emerald-400">Low Hazard Level</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Root-Zone Moisture Depletion & Precipitation Trajectory */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-cyan-400" />
            <span>Predicted Root-Zone Soil Moisture Depletion vs Rain Chance</span>
          </h3>
          <span className="text-xs text-slate-400">Daily Projection (0 - 1 Soil Wetness)</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#00E5FF" domain={[0.1, 0.7]} label={{ value: 'Soil Moisture (0-1)', angle: -90, position: 'insideLeft', fill: '#00E5FF', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" domain={[0, 100]} label={{ value: 'Rain Prob (%)', angle: 90, position: 'insideRight', fill: '#3b82f6', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="moisture" stroke="#00E5FF" strokeWidth={3} dot={{ r: 3 }} name="Predicted Root Moisture" />
              <Line yAxisId="right" type="monotone" dataKey="rainProb" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Rain Probability (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bare Field Vulnerability vs Continuous Living Root Calendar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Annual Bare-Soil Exposure & Thermal Stress Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Comparing field protection across the 12-month calendar. Bare-soil periods exposed to high solar radiation cause rapid microbial death and carbon burnout.
          </p>
        </div>

        {/* Timeline Visualization Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">System</th>
                <th className="py-2.5 px-2">Jan - Feb</th>
                <th className="py-2.5 px-2">Mar - Apr (Heat)</th>
                <th className="py-2.5 px-2 bg-rose-950/20 text-rose-300">May - Jun (Summer Bake)</th>
                <th className="py-2.5 px-2">Jul - Sep (Monsoon)</th>
                <th className="py-2.5 px-2 bg-amber-950/20 text-amber-300">Oct - Nov (Stubble Gap)</th>
                <th className="py-2.5 px-3">Bare Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-3 px-3 font-sans font-bold text-slate-200">1. Conv. Rice-Wheat</td>
                <td className="py-3 px-2 text-emerald-400">Wheat (Veg)</td>
                <td className="py-3 px-2 text-rose-400 font-semibold">Wheat (Heat Blast)</td>
                <td className="py-3 px-2 bg-rose-950/30 text-rose-300 font-bold">BARE SOIL (44°C Bake)</td>
                <td className="py-3 px-2 text-blue-400">Puddled Rice</td>
                <td className="py-3 px-2 bg-amber-950/30 text-amber-300 font-bold">BARE / Stubble Burn</td>
                <td className="py-3 px-3 text-rose-400 font-bold">85 Days</td>
              </tr>
              <tr className="bg-cyan-950/20">
                <td className="py-3 px-3 font-sans font-bold text-cyan-300">2. Pulse-Cereal Diversified</td>
                <td className="py-3 px-2 text-emerald-400">Wheat + Mustard</td>
                <td className="py-3 px-2 text-emerald-300">Mustard Harvest / Zero-Till</td>
                <td className="py-3 px-2 text-cyan-300 font-bold">Summer Moong (Cover)</td>
                <td className="py-3 px-2 text-blue-300">Maize / Soy / Millet</td>
                <td className="py-3 px-2 text-emerald-400 font-bold">Zero-Till Retention</td>
                <td className="py-3 px-3 text-cyan-300 font-bold">28 Days</td>
              </tr>
              <tr className="bg-emerald-950/20">
                <td className="py-3 px-3 font-sans font-bold text-emerald-300">3. Agroecological Millet-Legume</td>
                <td className="py-3 px-2 text-emerald-400">Desi Chickpea</td>
                <td className="py-3 px-2 text-emerald-300">Chickpea Maturity</td>
                <td className="py-3 px-2 text-emerald-400 font-bold">Sesbania Green Manure</td>
                <td className="py-3 px-2 text-emerald-300">Pearl Millet (Bajra)</td>
                <td className="py-3 px-2 text-emerald-400 font-bold">Direct Chickpea Drill</td>
                <td className="py-3 px-3 text-emerald-300 font-bold">12 Days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Advisory Cards Grid (Next 6 Days Sample) */}
      <div>
        <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Stage-by-Stage Field Action Advisories</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecast.slice(0, 6).map((day, idx) => (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-bold">{day.date}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">Day +{idx + 1}</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Soil Moisture:</span>
                <span className="font-bold text-white font-mono">{day.predicted_soil_moisture}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Precipitation Chance:</span>
                <span className="font-bold text-cyan-300 font-mono">{day.rain_probability_pct}%</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                {day.advisory}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
