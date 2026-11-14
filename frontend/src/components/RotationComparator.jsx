import React, { useState } from 'react';
import { 
  Layers, Droplets, Leaf, ShieldAlert, Award, 
  Check, ArrowRight, TrendingUp, AlertTriangle, HelpCircle, Sliders 
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function RotationComparator({ strategies, soilReading, nasaObs }) {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [climateStressSlider, setClimateStressSlider] = useState(0); // 0 = Current, 1 = +2°C Heatwave, 2 = Severe Drought (-35% Rain)

  if (!strategies || strategies.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading NASA Multi-Scenario Rotation Engine...
      </div>
    );
  }

  // Radar comparison data
  const radarData = [
    { subject: 'Water Conservation', Strategy1: 25, Strategy2: 75, Strategy3: 95 },
    { subject: 'Soil N Fixation', Strategy1: 20, Strategy2: 80, Strategy3: 90 },
    { subject: 'Soil Organic Health', Strategy1: 30, Strategy2: 75, Strategy3: 95 },
    { subject: 'Bare Soil Avoidance', Strategy1: 35, Strategy2: 80, Strategy3: 92 },
    { subject: 'Heatwave Resilience', Strategy1: climateStressSlider === 0 ? 40 : (climateStressSlider === 1 ? 20 : 25), Strategy2: 85, Strategy3: 95 },
    { subject: 'Economic Stability', Strategy1: climateStressSlider === 0 ? 65 : (climateStressSlider === 1 ? 45 : 35), Strategy2: 85, Strategy3: 80 },
  ];

  // Water & Bare days comparison bar chart
  const barData = strategies.map(strat => ({
    name: strat.id === 'strategy_1_conventional' ? '1. Rice-Wheat' : (strat.id === 'strategy_2_pulse_cereal' ? '2. Pulse-Cereal' : '3. Millet-Legume'),
    water: strat.annual_water_demand_m3_ha,
    bareDays: strat.bare_soil_days,
    nBalance: strat.soil_nitrogen_balance_kg_ha
  }));

  const active = selectedStrategy || strategies.find(s => s.recommended) || strategies[1];

  return (
    <div className="space-y-8">
      
      {/* Header & Scenario Simulation Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                Decision Support Tool
              </span>
              <span className="text-xs text-slate-400">NASA Challenge Core Objective</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Multi-Scenario Crop Rotation Studio</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Evaluating 3 distinct rotation strategies against incumbent double-cereal monocultures. Trade-offs quantify water footprint, biological nitrogen fixation, bare soil exposure, and climate shock buffering.
            </p>
          </div>

          {/* Climate Stress Scenario Slider */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-w-md w-full">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate Future Climate Stress:</span>
              </span>
              <span className="font-bold text-amber-400">
                {climateStressSlider === 0 ? "Historical Normal" : (climateStressSlider === 1 ? "+2.5°C Spring Heatwave" : "-35% Monsoon Deficit")}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="1"
              value={climateStressSlider}
              onChange={(e) => setClimateStressSlider(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Baseline</span>
              <span>March Heat Blast</span>
              <span>Severe Drought</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategy Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strat, idx) => {
          const isSelected = active.id === strat.id;
          const isBaseline = strat.id === "strategy_1_conventional";
          const isRecommended = strat.recommended;

          return (
            <div
              key={strat.id}
              onClick={() => setSelectedStrategy(strat)}
              className={`rounded-2xl p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                isSelected 
                  ? "bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl shadow-cyan-900/20" 
                  : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400">
                  Option #{idx + 1}
                </span>
                {isRecommended ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700 flex items-center space-x-1">
                    <Award className="w-3 h-3 text-emerald-400 mr-1" />
                    Recommended Match
                  </span>
                ) : isBaseline ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                    Incumbent Baseline
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800">
                    Agroecological
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">{strat.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{strat.tagline}</p>

                {/* Crops list */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {strat.crops.map((crop, cIdx) => (
                    <span key={cIdx} className="text-xs bg-slate-950/80 text-cyan-300 px-2.5 py-1 rounded-md border border-slate-800 flex items-center space-x-1">
                      <Leaf className="w-3 h-3 text-emerald-400" />
                      <span>{crop}</span>
                    </span>
                  ))}
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-5 space-y-2.5 text-xs border-t border-slate-800/80 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Annual Water Demand:</span>
                    <span className="font-mono font-bold text-white flex items-center space-x-1">
                      <span>{strat.annual_water_demand_m3_ha.toLocaleString()} m³/ha</span>
                      {strat.water_savings_percent > 0 && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                          -{strat.water_savings_percent}%
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Soil Nitrogen Balance:</span>
                    <span className={`font-mono font-bold ${
                      strat.soil_nitrogen_balance_kg_ha >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {strat.soil_nitrogen_balance_kg_ha > 0 ? `+${strat.soil_nitrogen_balance_kg_ha}` : strat.soil_nitrogen_balance_kg_ha} kg N/ha
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bare Field Days:</span>
                    <span className="font-mono font-bold text-white flex items-center space-x-1">
                      <span>{strat.bare_soil_days} days/yr</span>
                      {strat.bare_soil_reduction_percent > 0 && (
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800">
                          -{strat.bare_soil_reduction_percent}%
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Soil Organic Carbon:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{strat.soil_organic_carbon_rate}</span>
                  </div>
                </div>
              </div>

              {/* Select Indicator */}
              <button 
                className={`mt-6 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  isSelected 
                    ? "bg-cyan-500 text-slate-950" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{isSelected ? "Inspecting Strategy Details" : "Select & Analyze Trade-offs"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Visual Trade-Offs: Radar Analysis & Water Demand Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 6-Dimension Radar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Multi-Criteria Trade-Off Radar</span>
            </h3>
            <span className="text-[11px] text-slate-400">0 - 100 Normalized Index</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="1. Conv. Rice-Wheat" dataKey="Strategy1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                <Radar name="2. Pulse-Cereal" dataKey="Strategy2" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.25} />
                <Radar name="3. Millet-Legume" dataKey="Strategy3" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual Water Demand Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Annual Water Demand (m³/ha) vs Bare Soil Days</span>
            </h3>
            <span className="text-[11px] text-slate-400">Groundwater Preservation</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" label={{ value: 'Water (m³/ha)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Bare Soil Days', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="water" fill="#0284c7" radius={[4, 4, 0, 0]} name="Water Demand (m³/ha)" />
                <Bar yAxisId="right" dataKey="bareDays" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Bare Days / Year" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Deep-Dive Inspection Panel for Selected Strategy */}
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
              Detailed Evidence & Risk Dossier
            </span>
            <h3 className="text-xl font-black text-white mt-1">{active.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Farmer Profit Stability:</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{active.net_profit_index}/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agronomic Rationale & NASA Evidence */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>Agronomic Rationale (Why Suggested)</span>
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {active.agronomic_rationale}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>Supporting NASA Satellite Observations</span>
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {active.nasa_evidence}
              </p>
            </div>
          </div>

          {/* Local Risks & Human Judgment Callouts */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Risks for Local Farmer Review</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                This tool supports—not replaces—local farmer judgment. Review the following practical field constraints:
              </p>
              <div className="mt-2.5 space-y-2">
                {active.local_risks_for_review.map((risk, rIdx) => (
                  <div key={rIdx} className="flex items-start space-x-2 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl text-xs text-amber-200">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Terminal Heat Vulnerability:</span>
              <span className="text-slate-200 leading-relaxed block">{active.terminal_heat_resilience}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
