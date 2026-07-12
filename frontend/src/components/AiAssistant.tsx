import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Trash2, Copy, Check, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Which vehicles need maintenance?",
  "Which trips are delayed?",
  "Which drivers have the highest safety score?",
  "Which vehicles are idle?",
  "Detect unusual expenses.",
  "Predict maintenance risks.",
  "Explain dashboard KPIs.",
  "Show today's operations summary."
];

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "### TransitOps AI Assistant\n\nHello! I am your real-time Fleet Operations Copilot. I analyze your active vehicle logs, driver safety scores, and maintenance status. Click one of the suggested prompts below or ask me anything directly!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', { prompt: textToSend });
      if (res.success) {
        const assistantMsg: Message = {
          id: Math.random().toString(),
          sender: 'assistant',
          text: res.answer,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(res.error || 'Failed to chat');
      }
    } catch (err: any) {
      toast.error('Failed to connect to AI assistant');
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "🚨 **Error connecting to telemetry agent.** Please check your local server or configuration.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Response copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "### TransitOps AI Assistant\n\nHello! I am your real-time Fleet Operations Copilot. I analyze your active vehicle logs, driver safety scores, and maintenance status. Click one of the suggested prompts below or ask me anything directly!",
        timestamp: new Date()
      }
    ]);
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const clean = line.trim();
      if (!clean) return <div key={idx} className="h-2" />;
      
      if (clean.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-3 mb-1.5">{clean.replace('### ', '')}</h4>;
      }
      
      if (clean.startsWith('* ') || clean.startsWith('- ')) {
        const content = clean.slice(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-zinc-650 dark:text-zinc-400 mt-1">
            {parseInline(content)}
          </li>
        );
      }
      
      if (/^\d+\.\s+/.test(clean)) {
        const content = clean.replace(/^\d+\.\s+/, '');
        return (
          <li key={idx} className="ml-4 list-decimal text-xs text-zinc-650 dark:text-zinc-400 mt-1">
            {parseInline(content)}
          </li>
        );
      }

      return <p key={idx} className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed mt-1">{parseInline(clean)}</p>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans no-print">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
          title="Ask Operations Assistant"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
        </button>
      )}

      {/* Chat Window Box */}
      {isOpen && (
        <div className="w-96 max-sm:w-[calc(100vw-32px)] h-[500px] bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="bg-teal-700 text-white px-4 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <p className="font-bold text-xs">Fleet Assistant</p>
                <p className="text-[9px] text-teal-200">Prisma Live Analytics Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="p-1 hover:bg-teal-800 rounded-lg text-teal-100 hover:text-white transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-teal-800 rounded-lg text-teal-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs relative group ${
                    msg.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-tr-none'
                      : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-150 dark:border-zinc-800'
                  }`}
                >
                  {msg.sender === 'assistant' ? (
                    <div>{formatMessage(msg.text)}</div>
                  ) : (
                    <p className="leading-relaxed">{msg.text}</p>
                  )}

                  {/* Copy Button for Assistant */}
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="bg-zinc-100 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-800 px-3.5 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span className="text-xs text-zinc-500">Scanning ledger...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 max-h-[120px] overflow-y-auto">
              <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Suggested Queries:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-primary text-zinc-700 dark:text-zinc-350 px-2 py-1 rounded-lg transition-all cursor-pointer hover:bg-teal-500/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-zinc-150 dark:border-zinc-800 flex gap-2 bg-white dark:bg-zinc-900"
          >
            <input
              type="text"
              placeholder="Ask a fleet query..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-zinc-50 dark:bg-zinc-950 text-xs px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-teal-500 outline-hidden"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-500/40 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AiAssistant;
