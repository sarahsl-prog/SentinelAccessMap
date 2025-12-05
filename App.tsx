import React, { useState, useCallback, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';
import ThreatPanel from './components/ThreatPanel';
import ChatBot from './components/ChatBot';
import { mockNodes, mockLinks } from './services/mockData';
import { NetworkNode, ViewMode } from './types';
import { Mic, MicOff, Volume2, VolumeX, List, Activity, Settings } from 'lucide-react';
import { parseVoiceCommand } from './services/geminiService';

const App: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null); // Type 'any' used as SpeechRecognition types aren't standard in TS yet

  // --- Voice Synthesis (TTS) ---
  const speak = useCallback((text: string) => {
    if (!audioEnabled) return;
    
    // Cancel current speech to avoid queue buildup
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a good voice? Default is usually fine, but let's try to be consistent
    const voices = window.speechSynthesis.getVoices();
    // Try to find a "Google US English" or similar
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.1; // Slightly faster for efficiency
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  // --- Voice Recognition (STT) Setup ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.lang = 'en-US';
      recog.interimResults = false;

      recog.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Heard:", transcript);
        setIsListening(false);
        
        // Process intent with Gemini
        await handleVoiceCommand(transcript);
      };

      recog.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
        speak("I didn't catch that.");
      };
      
      recog.onend = () => {
        setIsListening(false);
      }

      setRecognition(recog);
    }
  }, [speak]); // Dependencies for setup

  // --- Command Handler ---
  const handleVoiceCommand = async (transcript: string) => {
      speak(`Processing: ${transcript}`);
      const intentJson = await parseVoiceCommand(transcript);
      try {
          const result = JSON.parse(intentJson);
          console.log("Intent:", result);

          switch(result.intent) {
              case 'SELECT_CRITICAL':
                  const criticalNode = mockNodes.find(n => n.status === 'critical');
                  if (criticalNode) {
                      setSelectedNode(criticalNode);
                      speak("Selecting first critical host.");
                  } else {
                      speak("No critical hosts found.");
                  }
                  break;
              case 'SHOW_DETAILS':
                  if (selectedNode) {
                      // Trigger read logic via ThreatPanel effect
                      // Just re-setting it might not trigger if same, but the panel handles reading on mount/change
                      speak("Showing details.");
                  } else {
                      speak("No host selected.");
                  }
                  break;
              case 'READ_SUMMARY':
                  if (selectedNode) {
                      // Let the ThreatPanel handle the reading
                  } else {
                      const criticalCount = mockNodes.filter(n => n.status === 'critical').length;
                      speak(`System summary: There are ${criticalCount} critical alerts in the network.`);
                  }
                  break;
              default:
                   // If specific host search could go here
                   speak("Command not recognized.");
          }

      } catch (e) {
          speak("Sorry, I couldn't understand the command intent.");
      }
  };

  const toggleListening = () => {
    if (!recognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
        setIsListening(true);
    }
  };

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    if (!audioEnabled) {
        // Optional tick sound
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* --- Sidebar (Navigation) --- */}
      <div className="w-16 md:w-20 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-6 gap-6 z-20 shadow-xl">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Activity className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 w-full items-center">
            <button 
                onClick={() => setViewMode('graph')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'graph' ? 'bg-slate-800 text-blue-400 border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                title="Graph View"
            >
                <Activity size={20} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-800 text-blue-400 border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                title="List View"
            >
                <List size={20} />
            </button>
        </div>

        <div className="flex flex-col gap-4 w-full items-center mb-4">
             <button 
                onClick={toggleListening}
                className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-600'}`}
                title="Voice Command"
            >
                {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

             <button 
                onClick={() => {
                    setAudioEnabled(!audioEnabled);
                    if (!audioEnabled) speak("Audio guidance enabled.");
                }}
                className={`p-3 rounded-xl transition-all ${audioEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-slate-500 hover:text-slate-300'}`}
                title="Toggle Audio Narratives"
            >
                {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button className="text-slate-500 hover:text-slate-300 p-2">
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-slate-700 flex items-center justify-between px-6 z-10">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Sentinel<span className="text-blue-500">Access</span></h1>
                <p className="text-xs text-slate-400">Security Monitoring Dashboard • Live</p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-slate-300">SYSTEM NORMAL</span>
               </div>
            </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 relative flex">
            {/* Viewport */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden">
                {viewMode === 'graph' ? (
                    <NetworkGraph 
                        nodes={mockNodes} 
                        links={mockLinks} 
                        onNodeClick={handleNodeClick}
                        width={window.innerWidth - (selectedNode ? 400 : 80)} // Adjust width dynamically strictly for example
                    />
                ) : (
                    <div className="p-6 overflow-y-auto h-full w-full">
                         <div className="grid gap-4">
                            {mockNodes.map(node => (
                                <button 
                                    key={node.id}
                                    onClick={() => handleNodeClick(node)}
                                    className={`w-full text-left p-4 rounded-lg border ${selectedNode?.id === node.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'} transition-all`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">{node.label}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${node.status === 'critical' ? 'bg-red-500/20 text-red-500' : node.status === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>{node.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{node.type} • {node.ip}</p>
                                </button>
                            ))}
                         </div>
                    </div>
                )}
                
                {/* Voice Command Overlay Prompt */}
                {isListening && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-8 py-4 rounded-2xl backdrop-blur-sm border border-slate-700 flex flex-col items-center animate-fade-in pointer-events-none">
                        <Mic className="w-8 h-8 text-red-500 mb-2 animate-bounce" />
                        <p className="text-lg font-medium">Listening...</p>
                        <p className="text-sm text-slate-400 mt-1">Try "Select critical hosts"</p>
                    </div>
                )}
            </div>

            {/* Right Panel (Collapsible) */}
            {selectedNode && (
                <div className="w-96 h-full border-l border-slate-700 bg-surface shadow-2xl z-20 absolute right-0 top-0 bottom-0 md:relative">
                    <ThreatPanel 
                        node={selectedNode} 
                        onClose={() => setSelectedNode(null)} 
                        audioEnabled={audioEnabled}
                        onSpeak={speak}
                    />
                </div>
            )}
        </div>
      </div>

      {/* Floating Chat Component */}
      <ChatBot onSpeak={speak} audioEnabled={audioEnabled} />
    </div>
  );
};

export default App;