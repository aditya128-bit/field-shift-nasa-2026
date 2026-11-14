import React from 'react';
import { 
  Sprout, Droplets, Sun, AlertTriangle, CheckCircle2, 
  TrendingUp, ArrowRight, ShieldCheck, HelpCircle, 
  Leaf, Calendar, DollarSign, Sparkles, MapPin, Zap
} from 'lucide-react';

export default function FarmerSimpleView({
  soilReading,
  nasaObs,
  location,
  onSelectTab,
  onAskAi
}) {
  const moisture = soilReading?.soil_moisture ?? 22.5;
  const temp = nasaObs?.temp_2m ?? 24.2;
  const tmax = nasaObs?.temp_max ?? 30.5;
  const shi = soilReading?.soil_health_index ?? 82;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* GCP-Style Project Header & Daily Farm Status Banner */}
      <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <span className="bg-[#1a73e8]/20 text-[#8ab4f8] px-2.5 py-0.5 rounded-full border border-[#1a73e8]/30 font-mono">
                GCP Farm Intelligence • Simple Farmer View
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#34a853]" />
                <span className="text-slate-300 font-semibold">{location.name}</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              Today's Field Action Plan & Rotation Guide
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Clear, practical decisions for your farm based on real-time ground soil sensors and free NASA Earth observation satellites.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            <div className="bg-[#0f172a] border border-[#334155] px-4 py-2.5 rounded-xl text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Field Status</span>
              <span className="text-sm font-bold text-[#34a853] flex items-center justify-end space-x-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34a853] animate-pulse inline-block" />
                <span>Healthy & Active</span>
              </span>
            </div>
            <button
              onClick={() => onSelectTab('chat')}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20 flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Agronomist</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Farmer Decision Metric Cards (GCP Console Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Water / Irrigation Action */}
        <div className="bg-[#1e293b]/60 border border-[#334155] hover:border-[#1a73e8]/60 transition-all rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-[#8ab4f8]" />
                <span>Water & Irrigation</span>
              </span>
              <span className="bg-[#34a853]/20 text-[#34a853] text-[11px] font-bold px-2 py-0.5 rounded-full">
                Sufficient
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">{moisture}%</div>
              <div className="text-xs text-slate-400 mt-0.5">Root-Zone Soil Moisture</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#334155] text-xs">
            <span className="font-bold text-[#8ab4f8]">Action: </span>
            <span className="text-slate-300">Do NOT irrigate today. Save tube-well power. Next check in 5 days.</span>
          </div>
        </div>

        {/* Card 2: Temperature & Heat Alert */}
        <div className="bg-[#1e293b]/60 border border-[#334155] hover:border-[#1a73e8]/60 transition-all rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <Sun className="w-4 h-4 text-[#fbbc04]" />
                <span>Field Temperature</span>
              </span>
              <span className="bg-blue-500/10 text-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Favorable
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">{temp}°C</div>
              <div className="text-xs text-slate-400 mt-0.5">Peak Forecast: {tmax}°C</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#334155] text-xs">
            <span className="font-bold text-[#fbbc04]">Alert: </span>
            <span className="text-slate-300">March terminal heat spike ahead. Prepare foliar spray (2% KNO3).</span>
          </div>
        </div>

        {/* Card 3: Soil Health & Natural Nutrition */}
        <div className="bg-[#1e293b]/60 border border-[#334155] hover:border-[#1a73e8]/60 transition-all rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <Leaf className="w-4 h-4 text-[#34a853]" />
                <span>Soil Health Index</span>
              </span>
              <span className="bg-[#34a853]/20 text-[#34a853] text-[11px] font-bold px-2 py-0.5 rounded-full">
                Optimal
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">{shi}/100</div>
              <div className="text-xs text-slate-400 mt-0.5">pH {soilReading?.ph ?? 7.8} • N {soilReading?.nitrogen ?? 28} mg/kg</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#334155] text-xs">
            <span className="font-bold text-[#34a853]">Recommendation: </span>
            <span className="text-slate-300">Grow Sesbania green manure for 45 days to cut urea requirement.</span>
          </div>
        </div>

        {/* Card 4: Profit & Rotation Opportunity */}
        <div className="bg-[#1e293b]/60 border border-[#334155] hover:border-[#1a73e8]/60 transition-all rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-[#34a853]" />
                <span>Next Rotation Gain</span>
              </span>
              <span className="bg-[#34a853]/20 text-[#34a853] text-[11px] font-bold px-2 py-0.5 rounded-full">
                +37% Water Saved
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-400 font-mono">+₹28,500/ha</div>
              <div className="text-xs text-slate-400 mt-0.5">Summer Moong Pulse Gain</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#334155] text-xs">
            <span className="font-bold text-emerald-400">Next Crop: </span>
            <span className="text-slate-300">Sow Summer Moong in vacant April–June gap before monsoon.</span>
          </div>
        </div>

      </div>

      {/* 3 Simple Crop Rotation Option Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sprout className="w-5 h-5 text-[#34a853]" />
              <span>Choose Your Next Crop Rotation Strategy</span>
            </h2>
            <p className="text-xs text-slate-400">
              Comparing your traditional practice against NASA-supported climate-resilient options.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('rotations')}
            className="text-xs text-[#8ab4f8] hover:text-white flex items-center space-x-1 font-semibold"
          >
            <span>Open Advanced Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Strategy 1: Traditional Rice-Wheat */}
          <div className="bg-[#1e293b]/70 border border-rose-900/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-rose-700/60 transition">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="bg-rose-950/80 text-rose-300 font-bold px-2.5 py-0.5 rounded-full border border-rose-800 text-[10px] uppercase">
                  Traditional Practice
                </span>
                <span className="text-rose-400 font-mono text-xs font-bold">High Risk</span>
              </div>
              <h3 className="text-base font-bold text-white">Conventional Rice–Wheat</h3>
              <p className="text-xs text-slate-400 mt-1">Puddled Rice ➔ Conventional Wheat ➔ Summer Fallow</p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Annual Water Demand:</span>
                  <span className="font-bold text-rose-400 font-mono">11,500 m³/ha</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Bare Soil in 44°C Heat:</span>
                  <span className="font-bold text-rose-400 font-mono">85 Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Soil Nitrogen Balance:</span>
                  <span className="font-bold text-rose-400 font-mono">-45 kg/ha (Mining N)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Heatwave Vulnerability:</span>
                  <span className="font-bold text-rose-400">High (Pollen Sterility)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-200">
              ⚠️ <b>Why Shift?</b> Tubewell depth declining by 3.2 cm/year (NASA GRACE data). Heavy electricity bills.
            </div>
          </div>

          {/* Strategy 2: Pulse-Cereal Diversification (Recommended) */}
          <div className="bg-[#1e293b]/90 border-2 border-[#34a853] rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#34a853] text-[#071330] text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Recommended ⭐⭐⭐
            </div>
            
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="bg-emerald-950/80 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-800 text-[10px] uppercase">
                  Climate Resilient
                </span>
                <span className="text-emerald-400 font-mono text-xs font-bold">+37% Water Saved</span>
              </div>
              <h3 className="text-base font-bold text-white">Pulse–Cereal Diversification</h3>
              <p className="text-xs text-slate-300 mt-1">Summer Moong ➔ Zero-Till Wheat + Mustard Border</p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Annual Water Demand:</span>
                  <span className="font-bold text-emerald-400 font-mono">7,200 m³/ha (-37%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Bare Soil in 44°C Heat:</span>
                  <span className="font-bold text-emerald-400 font-mono">28 Days (-67%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Soil Nitrogen Addition:</span>
                  <span className="font-bold text-emerald-400 font-mono">+35 kg/ha Free N</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Expected Extra Income:</span>
                  <span className="font-bold text-emerald-300 font-mono">+₹28,500 / hectare</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-200">
              ✅ <b>Best Fit:</b> Moong covers bare soil in May, cuts weed germination, and gives extra pulse cash harvest.
            </div>
          </div>

          {/* Strategy 3: Agroecological Millet-Legume */}
          <div className="bg-[#1e293b]/70 border border-cyan-800/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-cyan-600 transition">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="bg-cyan-950/80 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-800 text-[10px] uppercase">
                  Regenerative Organic
                </span>
                <span className="text-cyan-400 font-mono text-xs font-bold">+62% Water Saved</span>
              </div>
              <h3 className="text-base font-bold text-white">Agroecological Millet–Legume</h3>
              <p className="text-xs text-slate-400 mt-1">Pearl Millet (Bajra) ➔ Desi Chickpea ➔ Sesbania</p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Annual Water Demand:</span>
                  <span className="font-bold text-cyan-400 font-mono">4,400 m³/ha (-62%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Bare Soil in 44°C Heat:</span>
                  <span className="font-bold text-cyan-400 font-mono">12 Days (-86%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Soil Nitrogen Addition:</span>
                  <span className="font-bold text-cyan-400 font-mono">+65 kg/ha Free N</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Heatwave Tolerance:</span>
                  <span className="font-bold text-cyan-300">Immune (C4 Bajra &gt;42°C)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl text-xs text-cyan-200">
              🌱 <b>Maximum Conservation:</b> Ideal for water-scarce zones and farmers aiming to restore organic carbon.
            </div>
          </div>

        </div>
      </div>

      {/* Quick Farmer AI Assistant Chips */}
      <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-3">
          <Sparkles className="w-4 h-4 text-[#8ab4f8]" />
          <span>Ask Your AI Agronomist (Powered by NVIDIA NIM & NASA Grounding)</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            "How do I sow Summer Moong right after harvesting wheat?",
            "How much urea money can Sesbania green manure save me?",
            "What should I do if a 38°C heatwave hits in March?",
            "Is my soil pH 7.8 good for chickpea planting?",
            "How does Happy Seeder straw mulching save irrigation water?"
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskAi(q)}
              className="bg-[#0f172a] hover:bg-[#1a73e8]/20 hover:border-[#1a73e8] border border-[#334155] text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs transition text-left flex items-center space-x-2"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#8ab4f8] flex-shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
