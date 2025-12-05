import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Search, Minimize2, Maximize2, Loader2, Globe } from 'lucide-react';
import { sendMessageToChatbot, searchThreatIntel } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatBotProps {
  onSpeak: (text: string) => void;
  audioEnabled: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ onSpeak, audioEnabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'search'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Hello, I am SentinelAI. How can I assist with your security analysis today?', timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white transition-all transform hover:scale-105 z-50"
        aria-label="Open Security Chat Assistant"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'chat' ? 'bg-green-400' : 'bg-amber-400'}`}></div>
            <h3 className="font-bold text-white">SentinelAI</h3>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setMode(mode === 'chat' ? 'search' : 'chat')}
                className={`p-1.5 rounded transition-colors ${mode === 'search' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
                title={mode === 'chat' ? "Switch to Search Grounding" : "Switch to Chat"}
            >
                {mode === 'chat' ? <MessageSquare size={16} /> : <Globe size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <Minimize2 size={18} />
            </button>
        </div>
      </div>

      {/* Mode Indicator */}
      {mode === 'search' && (
          <div className="bg-amber-500/10 text-amber-500 text-xs py-1 px-4 text-center border-b border-amber-500/20">
              <Globe size={12} className="inline mr-1" />
              Using Google Search Grounding (Live Data)
          </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-800 border-t border-slate-700">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'search' ? "Search for CVEs, news..." : "Ask a security question..."}
            className="w-full bg-slate-900 text-white rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none border border-slate-700"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'search' ? <Search size={16} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;