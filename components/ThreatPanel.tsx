import React, { useEffect, useState } from 'react';
import { NetworkNode } from '../types';
import { generateThreatNarrative } from '../services/geminiService';
import { AlertTriangle, CheckCircle, ShieldAlert, Volume2, X, Info } from 'lucide-react';

interface ThreatPanelProps {
  node: NetworkNode | null;
  onClose: () => void;
  audioEnabled: boolean;
  autoReadDescription: boolean;
  onSpeak: (text: string) => void;
}

const ThreatPanel: React.FC<ThreatPanelProps> = ({ node, onClose, audioEnabled, autoReadDescription, onSpeak }) => {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      // Immediate read of the static description if enabled
      if (audioEnabled && autoReadDescription) {
        onSpeak(`Selected ${node.label}. ${node.description}`);
      }

      // Fetch AI narrative in background, but don't auto-speak it to avoid conflict
      setLoading(true);
      generateThreatNarrative(node).then(text => {
        setNarrative(text);
        setLoading(false);
      });
    }
  }, [node, audioEnabled, autoReadDescription]); 

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 p-8 border-l border-slate-700 bg-surface">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a node to view threat intelligence.</p>
        </div>
      </div>
    );
  }

  const statusColor = node.status === 'critical' ? 'text-red-500' : node.status === 'warning' ? 'text-amber-500' : 'text-green-500';

  return (
    <div className="h-full bg-surface border-l border-slate-700 flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-slate-700 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {node.label}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{node.type.toUpperCase()} • {node.ip}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close details">
          <X size={24} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
            {node.status === 'critical' && <AlertTriangle className="text-red-500" />}
            {node.status === 'warning' && <AlertTriangle className="text-amber-500" />}
            {node.status === 'secure' && <CheckCircle className="text-green-500" />}
            <div>
                <p className="text-sm text-slate-400">Current Status</p>
                <p className={`font-bold uppercase ${statusColor}`}>{node.status}</p>
            </div>
        </div>

        {/* Static Description */}
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
           <div className="flex items-center gap-2 text-slate-300 mb-2">
              <Info size={16} className="text-blue-400"/>
              <span className="font-semibold text-sm uppercase tracking-wider text-blue-400">System Overview</span>
           </div>
           <p className="text-slate-200">
             {node.description}
           </p>
        </div>

        {/* AI Narrative */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-blue-400">AI Threat Narrative</h3>
            <button 
                onClick={() => onSpeak(narrative)}
                className="text-slate-400 hover:text-blue-400 transition-colors"
                title="Read AI Narrative"
            >
                <Volume2 size={20} />
            </button>
          </div>
          <div className="p-4 bg-slate-900/50 rounded border border-blue-900/30">
            {loading ? (
                <div className="flex items-center gap-2 text-blue-400 animate-pulse-slow">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                    Generating Advanced Insight...
                </div>
            ) : (
                <p className="text-slate-300 leading-relaxed italic">
                    "{narrative}"
                </p>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Technical Details</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800 rounded">
                    <p className="text-xs text-slate-500">Operating System</p>
                    <p className="text-sm font-mono">{node.os}</p>
                </div>
                <div className="p-3 bg-slate-800 rounded">
                    <p className="text-xs text-slate-500">IP Address</p>
                    <p className="text-sm font-mono">{node.ip}</p>
                </div>
            </div>
        </div>

        {/* Vulnerabilities */}
        <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center justify-between">
                <span>Active Vulnerabilities</span>
                <span className="text-xs px-2 py-1 bg-slate-700 rounded-full text-white">{node.vulnerabilities.length}</span>
            </h3>
            {node.vulnerabilities.length === 0 ? (
                <p className="text-slate-500 italic">No known vulnerabilities detected.</p>
            ) : (
                <ul className="space-y-3">
                    {node.vulnerabilities.map(vuln => (
                        <li key={vuln.id} className="p-3 bg-slate-800/80 rounded border-l-4 border-red-500">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-red-400 text-sm font-bold">{vuln.cve || 'UNKNOWN-CVE'}</span>
                                <span className="text-xs uppercase bg-red-500/10 text-red-500 px-2 py-0.5 rounded">{vuln.severity}</span>
                            </div>
                            <p className="text-sm text-slate-300">{vuln.description}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default ThreatPanel;