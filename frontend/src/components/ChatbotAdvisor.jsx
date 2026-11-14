import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Sprout, AlertCircle, 
  Leaf, RefreshCw, Key, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { sendChatMessage } from '../services/api';

export default function ChatbotAdvisor({ soilReading, nasaObs, apiKey, initialQuery }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Namaste! I am your FIELD SHIFT AI Agronomist, powered by NVIDIA NIM (Llama-3.2-90B), NASA Earth Observations, and your local 8-in-1 IoT soil telemetry.\n\nAsk me anything about crop suitability, 30-day rain and heat predictions, intercropping arrangements, or natural ways to enrich your soil!",
      recommendations: [
        "Incorporate short-duration summer legume (Moong) to restore soil Nitrogen.",
        "Maintain crop residue mulch to lower surface soil temperatures during spring heat spikes."
      ],
      soil_enrichment_tips: [
        "Grow Sesbania (Dhaincha) for 45 days as green manure to neutralize alkaline pH (current pH: 7.8).",
        "Inoculate seeds with Rhizobium & PSB bio-fertilizers before sowing."
      ],
      model: "FIELD SHIFT NASA Agronomy Intelligence Engine"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Can I plant Chickpea next month with current soil NPK and rain forecast?",
    "My soil pH is 7.8 (mildly alkaline). What natural methods will enrich it?",
    "What is the best intercropping arrangement for wheat to reduce water and pest attacks?",
    "Why is Pearl Millet (Bajra) safer than puddled rice under rising heatwaves?",
    "How can I eliminate the bare-soil gap between wheat harvest and monsoon sowing?"
  ];

  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(textToSend, apiKey);
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: response.reply,
          recommendations: response.recommendations || [],
          soil_enrichment_tips: response.soil_enrichment_tips || [],
          suggested_rotations: response.suggested_rotations || [],
          model: response.source_model
        }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: "I encountered an error connecting to the advice service. Please ensure the backend is running or check your connection.",
          error: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[700px] overflow-hidden">
      
      {/* Chat Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm">FIELD SHIFT AI Agronomist</h3>
              <span className="text-[10px] font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                NVIDIA Nemotron / NIM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live context: Ground Moisture: <span className="text-cyan-300 font-mono">{soilReading?.soil_moisture ?? 22}%</span> | Soil pH: <span className="text-cyan-300 font-mono">{soilReading?.ph ?? 7.8}</span> | NASA Temp: <span className="text-cyan-300 font-mono">{nasaObs?.temp_2m ?? 24}°C</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Regenerative Soil Intelligence</span>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 py-2.5 overflow-x-auto flex space-x-2">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center flex-shrink-0">
          Suggested:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 px-3 py-1 rounded-full border border-slate-800 hover:border-cyan-500/40 transition-colors whitespace-nowrap flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
            }`}>
              
              {/* Message text with basic paragraph formatting */}
              <div className="whitespace-pre-line text-[13px] leading-relaxed">
                {msg.text}
              </div>

              {/* Natural Soil Enrichment Tips Callout */}
              {msg.soil_enrichment_tips && msg.soil_enrichment_tips.length > 0 && (
                <div className="mt-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 space-y-1.5">
                  <div className="text-[11px] uppercase font-bold text-emerald-400 flex items-center space-x-1.5">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>Natural Soil Enrichment Protocols:</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    {msg.soil_enrichment_tips.map((tip, tIdx) => (
                      <li key={tIdx} className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Intercropping / Practical Recommendations */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3 space-y-1.5">
                  <div className="text-[11px] uppercase font-bold text-cyan-400 flex items-center space-x-1.5">
                    <Leaf className="w-3.5 h-3.5" />
                    <span>Recommended Intercropping & Practice:</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    {msg.recommendations.map((rec, rIdx) => (
                      <li key={rIdx} className="flex items-start space-x-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model Citation Tag */}
              {msg.model && (
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                  Engine: {msg.model}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Analyzing NASA climate trends, 8-in-1 ground nutrients, and agroecological models...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask AI Agronomist (e.g. 'Can I sow mustard next week with current soil moisture?')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
