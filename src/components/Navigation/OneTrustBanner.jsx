import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { saveOneTrustConsent } from '../../services/integrations';
import { ShieldCheck, X } from 'lucide-react';

export default function OneTrustBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    performance: true,
    functional: true,
    targeting: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('pinelabs_onetrust_consent');
      if (!consent) {
        setShowBanner(true);
      } else {
        setPreferences(JSON.parse(consent));
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const all = { necessary: true, performance: true, functional: true, targeting: true };
    saveOneTrustConsent(all);
    setPreferences(all);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSaveCustom = () => {
    saveOneTrustConsent(preferences);
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Floating Bottom Consent Banner */}
      {showBanner && !showModal && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-40 bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-pine flex-shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white">OneTrust Privacy & Telemetry Compliance</span>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            PineShield utilizes essential cookies, GTM event telemetry, and VWO optimization layers 
            to monitor POS terminal uptime and prevent retail checkout disruption.
          </p>

          <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition cursor-pointer"
            >
              Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-xl bg-pine hover:bg-pine-hover text-white text-[11px] font-bold transition shadow cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showModal && (typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white transition-colors">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#243044] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-pine" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">OneTrust Cookie Consent Center</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Strictly Necessary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Strictly Necessary Cookies</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Terminal session & switch telemetry</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Always Active</span>
              </div>

              {/* Performance / GTM */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Performance Telemetry (GTM)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Anonymous POS diagnostic metrics</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.performance}
                  onChange={(e) => setPreferences(p => ({ ...p, performance: e.target.checked }))}
                  className="rounded text-pine focus:ring-pine cursor-pointer"
                />
              </div>

              {/* VWO Optimization */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">VWO Experience Optimization</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Support deflection layout tuning</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences(p => ({ ...p, functional: e.target.checked }))}
                  className="rounded text-pine focus:ring-pine cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-3.5 py-1.5 rounded-xl bg-pine hover:bg-pine-hover text-white text-xs font-bold shadow cursor-pointer active:scale-95"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null)}
    </>
  );
}
