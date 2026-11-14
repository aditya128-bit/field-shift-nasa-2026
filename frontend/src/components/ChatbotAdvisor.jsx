import React, { useState, useEffect, useRef } from 'react';
import { Send, Zap, Loader2, MessageSquare, ChevronDown, Bot, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const QUICK_QUESTIONS = [
  'Should I irrigate today?',
  'Best crop for water saving?',
  'Signs of nitrogen deficiency?',
  'How to improve soil organic matter?',
  'What is NDVI and why does it matter?',
  'Explain crop rotation benefits',
];

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
           style={{ background: isUser ? '#4f8ef7' : '#1e2130', border: '1px solid #2a2d3e' }}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4" style={{ color: '#4f8ef7' }} />}
      </div>
      {/* Bubble */}
      <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${isUser ? 'chat-user' : 'chat-ai'}`}
           style={{ color: '#e8eaf6' }}>
        {msg.content}
        {msg.source && (
          <div className="mt-2 text-xs opacity-60">{msg.source}</div>
        )}
      </div>
    </div>
  );
}

export default function ChatbotAdvisor({ soilReading, nasaObs, apiKey, initialQuery }) {
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m your AI Farm Advisor, powered by NVIDIA Llama AI + NASA data.\n\nAsk me anything about:\n• Irrigation timing & water saving\n• Crop rotation strategies\n• Soil health & fertilizer advice\n• Weather risk & climate patterns\n• NASA satellite data explained simply\n\nWhat would you like to know?',
      source: 'AI Agronomist • Powered by NVIDIA NIM'
    }
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInput(initialQuery);
      // Auto-submit after mount
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
          message:      text,
          apiKey:       apiKey || '',
          soilReading:  soilReading,
          nasaObs:      nasaObs,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.response || data.message || 'Sorry, I could not get a response. Please try again.',
        source:  data.model ? `Model: ${data.model}` : 'AI Agronomist • NVIDIA NIM'
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: '⚠️ Connection error. Please check your internet and try again.',
        source:  'Error'
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
    <div className="tab-panel flex flex-col" style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" style={{ color: '#4f8ef7' }} />
            <h2 className="text-lg font-bold text-white">AI Farm Advisor</h2>
            <span className="text-xs px-2 py-0.5 rounded-full status-info font-semibold">
              NVIDIA Llama AI
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#9ea3b8' }}>
            Grounded with NASA POWER, SMAP, GPM data for your location
          </p>
        </div>
      </div>

      {/* ── Quick Questions ──────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-xs px-3 py-2 rounded-lg font-medium transition hover:bg-white/5 disabled:opacity-40"
                  style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#e8eaf6' }}>
            {q}
          </button>
        ))}
      </div>

      {/* ── Chat Window ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto rounded-xl p-4 space-y-4"
           style={{ background: '#0f1117', border: '1px solid #2a2d3e' }}>
        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                 style={{ background: '#1e2130', border: '1px solid #2a2d3e' }}>
              <Bot className="w-4 h-4" style={{ color: '#4f8ef7' }} />
            </div>
            <div className="chat-ai px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 spin" style={{ color: '#4f8ef7' }} />
              <span className="text-sm" style={{ color: '#9ea3b8' }}>Analysing NASA data & preparing advice…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ────────────────────────────────── */}
      <div className="mt-4 flex items-end gap-3">
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your farm, soil, crops, water, or climate…"
          disabled={loading}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm"
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
          className="px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition disabled:opacity-40"
          style={{ background: '#4f8ef7', color: '#fff' }}
        >
          {loading ? <Loader2 className="w-4 h-4 spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
      <div className="mt-2 text-xs text-center" style={{ color: '#6b7194' }}>
        AI advice supports — does not replace — local farmer expertise and agricultural extension services.
      </div>
    </div>
  );
}
