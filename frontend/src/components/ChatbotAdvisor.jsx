import React, { useState, useEffect, useRef } from 'react';
import { Send, Zap, Loader2, MessageSquare, ChevronDown, Bot, User, Globe, Sprout, ShieldCheck, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const QUICK_QUESTIONS = [
  'Which stage is my crop in now?',
  'My crop is in flowering stage now',
  'What fertilizer needed at current stage?',
  'Check 30-day forecast for my crop',
  'How does my previous crop affect soil today?',
  'Should I irrigate today based on 7-day forecast?',
];

function FormattedContent({ content }) {
  if (!content) return null;

  // Split into lines for basic clean markdown rendering
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Horizontal rule
        if (trimmed === '---') {
          return <hr key={idx} className="my-2 border-slate-700/60" />;
        }

        // H3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-base font-bold text-cyan-300 mt-2 mb-1">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // H4
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={idx} className="text-sm font-bold text-amber-300 mt-1.5 mb-0.5">
              {trimmed.replace('#### ', '')}
            </h5>
          );
        }

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-200">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }} />
            </div>
          );
        }

        // Normal paragraph
        return (
          <p key={idx} className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      })}
    </div>
  );
}

function formatInline(str) {
  if (!str) return '';
  let out = str;
  // Markdown links: [Title](url) -> <a href="url" target="_blank">Title ↗</a>
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline font-semibold hover:text-cyan-300 inline-flex items-center gap-0.5">$1 ↗</a>');
  // Bold **text** -> <b>text</b>
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b class="text-white font-semibold">$1</b>');
  // Code `code` -> <code>code</code>
  out = out.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded text-xs bg-slate-800 text-amber-300 font-mono">$1</code>');
  return out;
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-md"
           style={{ background: isUser ? '#4f8ef7' : '#1e2130', border: '1px solid #2a2d3e' }}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4" style={{ color: '#4f8ef7' }} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg leading-relaxed ${isUser ? 'chat-user' : 'chat-ai'}`}
           style={{ background: isUser ? '#2563eb' : '#1a1d27', border: '1px solid #2a2d3e', color: '#e8eaf6' }}>
        
        {isUser ? (
          <div className="text-sm font-medium text-white">{msg.content}</div>
        ) : (
          <FormattedContent content={msg.content} />
        )}

        {/* Actionable Recommendations Chips */}
        {msg.recommendations && msg.recommendations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5" />
              <span>Recommended Farm Actions:</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {msg.recommendations.map((rec, i) => (
                <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Soil Enrichment Protocols */}
        {msg.soil_enrichment_tips && msg.soil_enrichment_tips.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-1.5">
            <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Natural Soil Health Protocols:</span>
            </div>
            <div className="space-y-1">
              {msg.soil_enrichment_tips.map((tip, i) => (
                <div key={i} className="text-xs px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-200">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {msg.source && (
          <div className="mt-2.5 text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{msg.source}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatbotAdvisor({ soilReading, nasaObs, apiKey, initialQuery }) {
  const [cropInfo, setCropInfo] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 **Hello! I am your Senior Agrometeorologist AI Advisor**, powered by **NVIDIA NIM** + **NASA Earth Observations** + **Live ICAR Web Grounding**.\n\nAsk me anything about:\n* Which crops fit your specific soil pH, Nitrogen, and NASA climate horizon\n* Irrigation scheduling & FAO-56 evapotranspiration\n* Natural organic soil conditioning (Dhaincha, Rhizobium, vermicompost)\n* Heatwave risk evasion & intercropping geometries (e.g. Wheat + Mustard 4:1)\n\n*How can I help you optimize your field today?*',
      source: 'AI Agrometeorologist • NVIDIA NIM + Live Agricultural Web Grounding'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load persistent crop profile and rotation history
  const loadCropInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/crop/profile`);
      if (res.ok) {
        const data = await res.json();
        setCropInfo(data);
      }
    } catch (e) {
      console.warn("[Crop Profile Load Notice]", e);
    }
  };

  const handleManualStageChange = async (stageName) => {
    try {
      const res = await fetch(`${API_BASE}/api/crop/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageName })
      });
      if (res.ok) {
        const updated = await res.json();
        setCropInfo(updated);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Active Growth Stage Updated:** Your **${updated.name || 'crop'}** is now officially recorded in the **${stageName}** stage.\n\nAll IoT soil thresholds, water deficit alerts, and NASA agrometeorological guidance have been dynamically calibrated for this stage.`,
          source: 'System Agrometeorology Engine'
        }]);
      }
    } catch (e) {
      console.error("[Manual Stage Change Error]", e);
    }
  };

  useEffect(() => {
    loadCropInfo();
  }, []);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInput(initialQuery);
      setTimeout(() => handleSend(initialQuery), 300);
    }
  }, [initialQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          api_key: apiKey || '',
          soilReading: soilReading,
          nasaObs: nasaObs,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const replyContent = data.reply || data.response || data.message || 'I have analyzed your farm telemetry. Please ask a specific question regarding crop suitability or soil amendments.';
      const sourceModel = data.source_model || (data.model ? `Model: ${data.model}` : 'NVIDIA NIM (google/gemma-4-31b-it) + Live Web Grounding');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: replyContent,
        source: sourceModel,
        recommendations: data.recommendations || [],
        soil_enrichment_tips: data.soil_enrichment_tips || [],
        suggested_rotations: data.suggested_rotations || []
      }]);

      // Re-fetch crop profile in case the AI or user mutated the active stage
      loadCropInfo();
    } catch (err) {
      console.error("[Chat Advisor Error]", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Connection error. Live agrometeorology servers are re-establishing. Please try asking again.',
        source: 'System Error Fallback'
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="tab-panel flex flex-col" style={{ height: 'calc(100vh - 180px)', minHeight: 520 }}>

      {/* ── Header ───────────────────────────────────── */}
      <div className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
           style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">FIELD SHIFT Agrometeorology AI Advisor</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full status-good font-semibold flex items-center gap-1">
              ✨ NVIDIA NIM + Live ICAR Web Grounding
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: '#9ea3b8' }}>
            Multi-modal decision engine combining in-situ 8-in-1 IoT soil telemetry, NASA decadal satellite trends, and real-time agricultural research.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800 text-blue-300 font-mono">
            🔍 Web Search: Active (Zero Keys)
          </span>
        </div>
      </div>

      {/* ── Active Crop & Lifecycle Context Strip ─────── */}
      {cropInfo && (
        <div className="rounded-xl px-4 py-3 mb-3 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3"
             style={{ background: '#131722', border: '1px solid #1e2538' }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{cropInfo.emoji || '🌾'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {cropInfo.name || 'Wheat'}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300">
                    Day {cropInfo.days_elapsed || 28} of {cropInfo.duration_days || 120}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Sown: <span className="text-slate-200">{cropInfo.sow_date || 'Oct 18, 2026'}</span> • Expected Harvest: <span className="text-slate-200">{cropInfo.expected_harvest || 'Feb 15, 2027'}</span>
                </div>
              </div>
            </div>

            {/* Previous rotation legacy */}
            {cropInfo.rotation_history?.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-slate-900/90 border border-slate-800 text-slate-300">
                <span className="text-amber-400 font-semibold">🔄 Previous Crop:</span>
                <span className="text-slate-200 font-medium">{cropInfo.rotation_history[0].crop}</span>
                <span className="text-slate-400">({cropInfo.rotation_history[0].season})</span>
              </div>
            )}
          </div>

          {/* Active Stage Quick Selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">Active Stage:</span>
            <select
              value={cropInfo.active_stage?.name || cropInfo.stages?.[0]?.name || ''}
              onChange={e => handleManualStageChange(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 text-emerald-300 focus:outline-none focus:border-emerald-500"
            >
              {(cropInfo.stages || []).map(s => (
                <option key={s.name} value={s.name}>
                  🌱 {s.name} ({s.days} days)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Quick Questions ──────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:bg-white/10 disabled:opacity-40"
            style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#e8eaf6' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Chat Window ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto rounded-xl p-4 space-y-4 shadow-inner"
           style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                 style={{ background: '#1e2130', border: '1px solid #2a2d3e' }}>
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2 text-xs"
                 style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#9ea3b8' }}>
              <Loader2 className="w-4 h-4 spin text-blue-400" />
              <span>Querying NVIDIA NIM & retrieving live ICAR web grounding…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ────────────────────────────────── */}
      <div className="mt-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your crop suitability, soil pH/N-P-K, water saving, or NASA climate forecasts…"
          disabled={loading}
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm transition focus:border-blue-500"
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            color: '#e8eaf6',
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition disabled:opacity-40 shadow-lg hover:bg-blue-600"
          style={{ background: '#4f8ef7', color: '#fff' }}
        >
          {loading ? <Loader2 className="w-4 h-4 spin" /> : <Send className="w-4 h-4" />}
          <span>Send</span>
        </button>
      </div>

      <div className="mt-2 text-[11px] text-center" style={{ color: '#6b7194' }}>
        FIELD SHIFT AI advice is grounded on NASA Earth Observations (SMAP, GPM, MODIS) and in-situ 8-in-1 IoT soil data.
      </div>
    </div>
  );
}
