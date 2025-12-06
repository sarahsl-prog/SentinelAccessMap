import React from 'react';
import { X, Volume2, MessageSquare, Monitor, Check, Ear } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  autoReadDescription: boolean;
  setAutoReadDescription: (enabled: boolean) => void;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode?: boolean;
  setScreenReaderMode?: (enabled: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioEnabled,
  setAudioEnabled,
  autoReadDescription,
  setAutoReadDescription,
  reducedMotion,
  highContrast,
  screenReaderMode,
  setScreenReaderMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-96 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h2 className="text-lg font-bold text-white">Dashboard Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close Settings">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Audio Master Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                <Volume2 size={20} />
              </div>
              <div>
                <p className="font-medium text-white">Master Audio</p>
                <p className="text-xs text-slate-400">Enable all internal sound effects</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                disabled={screenReaderMode} // Disable if SR mode is on to avoid conflict
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${screenReaderMode ? 'opacity-50' : ''}`}></div>
            </label>
          </div>

          {/* Screen Reader Optimization */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400">
                <Ear size={20} />
              </div>
              <div>
                <p className="font-medium text-white">Screen Reader Mode</p>
                <p className="text-xs text-slate-400">Optimized for Narrator/NVDA</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={screenReaderMode}
                onChange={(e) => {
                    if (setScreenReaderMode) {
                        setScreenReaderMode(e.target.checked);
                        if (e.target.checked) setAudioEnabled(false); // Turn off app audio to avoid double talk
                    }
                }}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Auto Read Description */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600/20 rounded-lg text-amber-400">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-medium text-white">Auto-Read Details</p>
                <p className="text-xs text-slate-400">Speak node description on click</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoReadDescription}
                onChange={(e) => setAutoReadDescription(e.target.checked)}
                disabled={!audioEnabled && !screenReaderMode}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 ${(!audioEnabled && !screenReaderMode) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
            </label>
          </div>

          <div className="border-t border-slate-700 my-4"></div>

          {/* System Detected Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
                <Monitor size={16} className="text-slate-400"/>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Host System Sync</span>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-300">Reduced Motion</span>
                    {reducedMotion ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">
                            <Check size={12} /> DETECTED
                        </span>
                    ) : (
                        <span className="text-xs text-slate-500">Normal</span>
                    )}
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-300">High Contrast</span>
                    {highContrast ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">
                            <Check size={12} /> DETECTED
                        </span>
                    ) : (
                        <span className="text-xs text-slate-500">Normal</span>
                    )}
                </div>
            </div>
          </div>

        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500">SentinelAccess v1.0 • Accessibility Focused</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;