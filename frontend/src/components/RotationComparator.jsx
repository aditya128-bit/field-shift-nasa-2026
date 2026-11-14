import React, { useState, useEffect } from 'react';
import { 
  Layers, Droplets, Leaf, ShieldAlert, Award, 
  Check, ArrowRight, TrendingUp, AlertTriangle, HelpCircle, 
  Sliders, SlidersHorizontal, BookOpen, Compass, Activity, Database, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fetchScientificWaterBalance } from '../services/api';

export default function RotationComparator({ 
  strategies, 
  soilReading, 
  nasaObs, 
  location,
  farmerPriority, 
  setFarmerPriority,
  waterConstraint, 
  setWaterConstraint,
  machineryAccess, 
  setMachineryAccess,
  onConstraintChange
}) {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [climateStressSlider, setClimateStressSlider] = useState(0); // 0 = Current, 1 = +2.5°C Heatwave, 2 = Severe Drought (-35% Rain)
  const [scientificData, setScientificData] = useState(null);
  const [showScientificModal, setShowScientificModal] = useState(false);

  useEffect(() => {
    fetchScientificWaterBalance(location.lat, location.lon)
      .then(data => setScientificData(data))
      .catch(err => console.error("Water balance fetch error:", err));
  }, [location.lat, location.lon]);

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
    { subject: 'Soil Organic Carbon', Strategy1: 30, Strategy2: 75, Strategy3: 95 },
    { subject: 'Bare Soil Avoidance', Strategy1: 35, Strategy2: 80, Strategy3: 92 },
    { subject: 'Heatwave Resilience', Strategy1: climateStressSlider === 0 ? 40 : (climateStressSlider === 1 ? 20 : 25), Strategy2: 85, Strategy3: 95 },
    { subject: 'Economic Stability', Strategy1: climateStressSlider === 0 ? 65 : (climateStressSlider === 1 ? 45 : 35), Strategy2: 88, Strategy3: 82 },
  ];

  // Water & Bare days comparison bar chart
  const barData = strategies.map(strat => ({
    name: strat.id === 'strategy_1_conventional' ? '1. Rice-Wheat' : (strat.id === 'strategy_2_pulse_cereal' ? '2. Pulse-Cereal' : '3. Millet-Legume'),
    water: strat.annual_water_demand_m3_ha,
    bareDays: strat.bare_soil_days,
    nBalance: strat.soil_nitrogen_balance_kg_ha
  }));

  const active = selectedStrategy || strategies.find(s => s.recommended) || strategies[0];

  return (
    <div className="space-y-8">
      
      {/* Top Banner: Scientific Rationale & NASA Challenge Objectives */}
      <div className="bg-gradient-to-r from-[#071330] via-[#0b1a3e] to-[#0d204a] border border-blue-900/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-black tracking-widest text-[#071330] bg-[#FCEE21] px-2.5 py-0.5 rounded-md">
                NASA DECISION SUPPORT STUDIO
              </span>
              <span className="text-xs text-cyan-300 font-bold bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                FAO-56 Penman-Monteith & SMAP Water Balance Coupled
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Multi-Scenario Crop Rotation Intelligence Studio
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Evaluating 3 distinct rotation pathways against incumbent double-cereal monocultures. Quantifying water footprints, biological nitrogen fixation, bare soil exposure, and climate stress buffering.
            </p>
          </div>

          <button
            onClick={() => setShowScientificModal(true)}
            className="self-start lg:self-center bg-blue-900/80 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-cyan-400/30 flex items-center space-x-2 transition-all shadow-lg"
          >
            <Activity className="w-4 h-4 text-[#FCEE21]" />
            <span>View Scientific Equations & Harmonization Grid</span>
          </button>
        </div>
      </div>

      {/* Interactive Farmer Priorities & Constraints Input Form (Direct NASA Requirement) */}
      <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-950 pb-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-[#FCEE21]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Farmer Priorities & Local Field Constraints (Interactive Profiler)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Adjust to customize scientific rotation rankings
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Primary Goal */}
          <div className="bg-[#030919] p-3.5 rounded-xl border border-blue-950 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">1. Primary Farm Objective</label>
            <select
              value={farmerPriority}
              onChange={(e) => {
                setFarmerPriority(e.target.value);
                if (onConstraintChange) onConstraintChange(e.target.value, waterConstraint, machineryAccess);
              }}
              className="w-full bg-[#071330] text-white border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FCEE21]"
            >
              <option value="water_conservation">Water Conservation & Groundwater Recovery</option>
              <option value="maximum_profit">Maximum Net Farmer Profit & High ROI</option>
              <option value="soil_regeneration">Soil Health & Biological Nitrogen Regeneration</option>
              <option value="erosion_control">Erosion Shielding & Residue Mulch Armor</option>
            </select>
            <p className="text-[10px] text-slate-400">Re-weights algorithm based on your primary strategic driver.</p>
          </div>

          {/* 2. Water Availability Constraint */}
          <div className="bg-[#030919] p-3.5 rounded-xl border border-blue-950 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">2. Water Access Constraint</label>
            <select
              value={waterConstraint}
              onChange={(e) => {
                setWaterConstraint(e.target.value);
                if (onConstraintChange) onConstraintChange(farmerPriority, e.target.value, machineryAccess);
              }}
              className="w-full bg-[#071330] text-white border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FCEE21]"
            >
              <option value="severe_rationing">Severe Shortage (Rationed Canal / Rainfed)</option>
              <option value="moderate_tubewell">Moderate Tubewell (Depleting Aquifer Table)</option>
              <option value="unconstrained">Unconstrained Irrigation Access</option>
            </select>
            <p className="text-[10px] text-slate-400">Matches crop coefficients (Kc) to available field water.</p>
          </div>

          {/* 3. Farm Machinery & Equipment */}
          <div className="bg-[#030919] p-3.5 rounded-xl border border-blue-950 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">3. Machinery & Seeder Access</label>
            <select
              value={machineryAccess}
              onChange={(e) => {
                setMachineryAccess(e.target.value);
                if (onConstraintChange) onConstraintChange(farmerPriority, waterConstraint, e.target.value);
              }}
              className="w-full bg-[#071330] text-white border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#FCEE21]"
            >
              <option value="zero_till_happy_seeder">Have Happy Seeder / Zero-Till Drill</option>
              <option value="traditional_tillage_only">Traditional Tillage / Rotavator Only</option>
            </select>
            <p className="text-[10px] text-slate-400">Determines if direct seeding into residue mulch is practical.</p>
          </div>

        </div>
      </div>

      {/* Climate Stress Scenario Slider */}
      <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FCEE21]">Climate Shock Stress-Test</span>
          <h4 className="text-sm font-bold text-white mt-0.5">Simulate Future Climate Extreme Scenarios</h4>
        </div>

        <div className="flex-1 max-w-md bg-[#030919] p-3 rounded-xl border border-blue-950">
          <div className="flex justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-300">Scenario:</span>
            <span className="text-[#FCEE21]">
              {climateStressSlider === 0 ? "Normal Climate Baseline" : (climateStressSlider === 1 ? "+2.5°C March Heatwave Blast" : "-35% Monsoon Rainfall Deficit")}
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="1"
            value={climateStressSlider}
            onChange={(e) => setClimateStressSlider(parseInt(e.target.value))}
            className="w-full accent-[#FCEE21] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Historical Baseline</span>
            <span>Spring Heatwave</span>
            <span>Severe Drought</span>
          </div>
        </div>
      </div>

      {/* 3 Rotation Strategies Side-by-Side */}
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
                  ? "bg-[#0B1E48] border-[#FCEE21] ring-2 ring-yellow-400/30 shadow-2xl shadow-yellow-500/10" 
                  : "bg-[#071330] border-blue-900/60 hover:border-slate-600 hover:bg-[#091838]"
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400">
                  Option #{idx + 1}
                </span>
                {isRecommended ? (
                  <span className="text-[10px] uppercase font-black tracking-wider bg-[#FCEE21] text-[#071330] px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-md">
                    <Award className="w-3 h-3 mr-1" />
                    Top Scientific Match
                  </span>
                ) : isBaseline ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    Incumbent Baseline
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-900 text-cyan-300 px-2 py-0.5 rounded-full border border-blue-700">
                    Conservation System
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">{strat.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{strat.tagline}</p>

                {/* Crops list */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {strat.crops.map((crop, cIdx) => (
                    <span key={cIdx} className="text-xs bg-[#030919] text-cyan-300 px-2.5 py-1 rounded-md border border-blue-950 flex items-center space-x-1">
                      <Leaf className="w-3 h-3 text-emerald-400" />
                      <span>{crop}</span>
                    </span>
                  ))}
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-5 space-y-2.5 text-xs border-t border-blue-950 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Annual Water Footprint:</span>
                    <span className="font-mono font-bold text-white flex items-center space-x-1">
                      <span>{strat.annual_water_demand_m3_ha.toLocaleString()} m³/ha</span>
                      {strat.water_savings_percent > 0 && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
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
                        <span className="text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                          -{strat.bare_soil_reduction_percent}%
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Soil Organic Carbon Rate:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{strat.soil_organic_carbon_rate}</span>
                  </div>
                </div>
              </div>

              {/* Select Indicator */}
              <button 
                className={`mt-6 w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  isSelected 
                    ? "bg-[#FCEE21] text-[#071330] font-black shadow-lg" 
                    : "bg-[#030919] text-slate-300 hover:bg-slate-800 border border-blue-900"
                }`}
              >
                <span>{isSelected ? "Inspecting Detailed Scientific Dossier" : "Select & Analyze Trade-Offs"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Visual Trade-Offs: Radar Analysis & Water Demand Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 6-Dimension Radar Chart */}
        <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#FCEE21]" />
              <span>Multi-Criteria Trade-Off Radar Matrix</span>
            </h3>
            <span className="text-[11px] text-slate-400">Normalized Index (0 - 100)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e2d50" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="1. Conv. Rice-Wheat" dataKey="Strategy1" stroke="#FC3D21" fill="#FC3D21" fillOpacity={0.2} />
                <Radar name="2. Pulse-Cereal" dataKey="Strategy2" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.25} />
                <Radar name="3. Millet-Legume" dataKey="Strategy3" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#071330', borderColor: '#1e2d50', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual Water Demand Bar Chart */}
        <div className="bg-[#071330] border border-blue-900/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Annual Water Footprint (m³/ha) vs Bare Soil Exposure Days</span>
            </h3>
            <span className="text-[11px] text-slate-400">Aquifer Protection Metric</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d50" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" label={{ value: 'Water (m³/ha)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Bare Soil Days', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#071330', borderColor: '#1e2d50', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="water" fill="#0284c7" radius={[4, 4, 0, 0]} name="Water Demand (m³/ha)" />
                <Bar yAxisId="right" dataKey="bareDays" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Bare Soil Days / Year" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Comprehensive Scientific Dossier Addressing All 5 NASA Mandates */}
      <div className="bg-[#071330] border-2 border-blue-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-950 pb-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#FCEE21]">
              Scientific Evidence & Decision Support Dossier
            </span>
            <h3 className="text-xl font-black text-white mt-1">{active.name}</h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Net Profit Stability Index:</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{active.net_profit_index}/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1 & 2: Why Suggested & Supporting NASA Evidence */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>1. Why Suggested (Agronomic Rationale & Soil Mechanics)</span>
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-[#030919] p-3.5 rounded-xl border border-blue-950">
                {active.agronomic_rationale}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>2. Supporting NASA Earth Observation Evidence</span>
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-[#030919] p-3.5 rounded-xl border border-blue-950">
                {active.nasa_evidence}
              </p>
            </div>

            <div className="bg-[#030919] p-3 rounded-xl border border-blue-950 text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Terminal Heat Vulnerability:</span>
              <span className="text-slate-200 leading-relaxed block">{active.terminal_heat_resilience}</span>
            </div>
          </div>

          {/* Section 3, 4 & 5: Benefits, Information Gaps, & Identified Local Risks */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>3. Specific Quantified Agronomic Benefits</span>
              </h4>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                  <span className="text-slate-400 block text-[10px]">Water Saved:</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono">
                    {active.water_savings_percent > 0 ? `-${active.water_savings_percent}%` : 'Baseline'}
                  </span>
                </div>
                <div className="bg-[#030919] p-2.5 rounded-xl border border-blue-950">
                  <span className="text-slate-400 block text-[10px]">Nitrogen Balance:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {active.soil_nitrogen_balance_kg_ha > 0 ? `+${active.soil_nitrogen_balance_kg_ha}` : active.soil_nitrogen_balance_kg_ha} kg N/ha
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>4. Scientific Information Gaps</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1 bg-[#030919] p-3 rounded-xl border border-blue-950 leading-relaxed">
                {active.information_gaps || "Micro-topographic drainage variations across field boundaries; local fertilizer subsidy structure differences."}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>5. Identified Risks Requiring Local Farmer Judgment</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                This NASA tool is intended to support—not replace—local farmer expertise. Review these constraints:
              </p>
              <div className="mt-2 space-y-1.5">
                {active.local_risks_for_review.map((risk, rIdx) => (
                  <div key={rIdx} className="flex items-start space-x-2 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl text-xs text-amber-200">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scientific Harmonization & Equations Modal */}
      {showScientificModal && scientificData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#071330] border border-blue-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-blue-950 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-blue-950 border border-blue-800 text-[#FCEE21]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Scientific Framework & Spatial Harmonization</h3>
                  <p className="text-xs text-slate-400">FAO-56 Penman-Monteith, NASA GRACE, and Multi-Scale Sensor Grid</p>
                </div>
              </div>
              <button onClick={() => setShowScientificModal(false)} className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1 bg-slate-800 rounded-lg">
                Close
              </button>
            </div>

            {/* FAO-56 Equation */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                1. FAO-56 Penman-Monteith Evapotranspiration Equation
              </h4>
              <pre className="bg-[#030919] border border-blue-950 p-3 rounded-xl text-xs font-mono text-cyan-200 overflow-x-auto">
                {scientificData.fao56_penman_monteith.formula}
              </pre>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-[#030919] p-2 rounded-lg border border-blue-950">
                  <span className="text-slate-400 block">Computed Daily ET0:</span>
                  <span className="font-bold text-[#FCEE21] font-mono text-sm">{scientificData.fao56_penman_monteith.et0_mm_day} mm/day</span>
                </div>
                <div className="bg-[#030919] p-2 rounded-lg border border-blue-950">
                  <span className="text-slate-400 block">Solar Irradiance:</span>
                  <span className="font-bold text-white font-mono text-sm">{scientificData.fao56_penman_monteith.solar_radiation_mj} MJ/m²</span>
                </div>
                <div className="bg-[#030919] p-2 rounded-lg border border-blue-950">
                  <span className="text-slate-400 block">Wind Velocity (u2):</span>
                  <span className="font-bold text-white font-mono text-sm">{scientificData.fao56_penman_monteith.wind_speed_m_s} m/s</span>
                </div>
              </div>
            </div>

            {/* NASA GRACE Groundwater Depletion */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-rose-400">
                2. NASA GRACE / GRACE-FO Decadal Groundwater Storage Depletion
              </h4>
              <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-900/50 text-rose-200 leading-relaxed">
                <b>Measured Rate:</b> {scientificData.nasa_grace_groundwater_trend.trend_cm_year_equivalent_water_height} cm/year equivalent water height across the Indo-Gangetic basin.
                <p className="mt-1 text-[11px] text-slate-300">
                  Direct satellite gravimetry reveals continuous aquifer mining, validating the urgency to replace puddled paddy with Summer Moong and Pearl Millet rotations.
                </p>
              </div>
            </div>

            {/* Spatial Harmonization Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                3. Multi-Scale Spatial Harmonization Architecture
              </h4>
              <p className="text-xs text-slate-300">
                Harmonizing NASA datasets across different spatial and temporal resolutions to a common <b>1 km Unified Agro-Ecological Grid Cell</b>:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-blue-950 text-slate-400 bg-[#030919]">
                      <th className="py-2 px-3">NASA Sensor</th>
                      <th className="py-2 px-3">Native Resolution</th>
                      <th className="py-2 px-3">Harmonization Technique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-950 text-slate-300 font-mono text-[11px]">
                    {scientificData.spatial_harmonization_grid.sensors.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-sans font-bold text-white">{s.name}</td>
                        <td className="py-2 px-3 text-cyan-300">{s.native_resolution}</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">{s.harmonization}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
