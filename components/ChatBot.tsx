import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Search, ChevronDown, ChevronUp, Loader2, Globe, Terminal } from 'lucide-react';
import { sendMessageToChatbot, searchThreatIntel } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatBotProps {
  onSpeak: (text: string) => void;
  audioEnabled: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ onSpeak, audioEnabled }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mode, setMode] = useState<'chat' | 'search'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'SentinelAI Console initialized. Ready for query...', timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) {
        scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    let responseText = '';

    if (mode === 'search') {
        const result = await searchThreatIntel(userText);
        responseText = result.text;
        if (result.sources.length > 0) {
            responseText += `\n\nSources:\n${result.sources.map(s => `- ${s}`).join('\n')}`;
        }
    } else {
        responseText = await sendMessageToChatbot(userText);
    }

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);

    if (audioEnabled) {
      onSpeak(responseText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
        className={`w-full bg-slate-900 border-t border-slate-700 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'h-80' : 'h-12'}`}
    >
      {/* Header Bar */}
      <div 
        className="h-12 px-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            <div className={`p-1 rounded ${mode === 'chat' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <Terminal size={18} />
            </div>
            <h3 className="font-bold text-slate-200 text-sm tracking-wide">SENTINEL_AI_CONSOLE</h3>
            {mode === 'search' && (
                <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    SEARCH GROUNDING ACTIVE
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => setMode('chat')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'chat' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Chat
                </button>
                <button 
                    onClick={() => setMode('search')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'search' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Web Search
                </button>
            </div>
            <div className="text-slate-400">
                {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </div>
        </div>
      </div>

      {/* Main Content Area (Only visible when expanded) */}
      <div className={`flex-1 flex overflow-hidden ${!isExpanded && 'hidden'}`}>
          
          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm bg-slate-950">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-blue-300 border border-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {msg.role === 'model' && <span className="text-green-500 mr-2 opacity-50">$</span>}
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="text-slate-500 flex items-center gap-2 px-3">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing request...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="w-96 bg-slate-900 p-4 border-l border-slate-700 flex flex-col justify-between">
             <div className="text-xs text-slate-500 mb-2">
                INPUT COMMAND
             </div>
             <div className="flex-1 relative">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === 'search' ? "Enter search query..." : "Ask Sentinel AI..."}
                    className="w-full h-full bg-slate-800 text-white rounded p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none border border-slate-700 font-mono"
                />
             </div>
             <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
             >
                {mode === 'search' ? <Search size={14} /> : <Send size={14} />}
                EXECUTE
             </button>
          </div>
      </div>
    </div>
  );
};

export default ChatBot;