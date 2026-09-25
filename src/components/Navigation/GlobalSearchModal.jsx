import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS } from '../../data/sopRules';
import { BANK_DIRECTORY } from '../../data/bankDirectory';
import { 
  Search, 
  X, 
  Cpu, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  Phone
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { 
    setActiveTab, 
    processTriageDiagnosis, 
    triggerTerminalTransaction
  } = useMerchant();

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Filter Errors
  const matchedErrors = MASTER_ERROR_RECORDS.filter(e => 
    !q || e.errorIssue.toLowerCase().includes(q) || e.reasonOfOccurrence.toLowerCase().includes(q)
  ).slice(0, 5);

  // Filter Banks
  const matchedBanks = Object.entries(BANK_DIRECTORY).filter(([k, b]) =>
    !q || k.toLowerCase().includes(q) || b.bankName.toLowerCase().includes(q) || (b.tollFree && b.tollFree.includes(q))
  ).slice(0, 3);

  // Exactly 4 Core Workbench Views
  const workbenchTabs = [
    { id: 'simulator', label: 'POS Simulator', icon: Cpu, desc: 'A920 Hardware Fidelity & Charge Slip' },
    { id: 'triage', label: 'AI Triage Studio', icon: Sparkles, desc: 'Gemini-Powered Root-Cause Analysis' },
    { id: 'whatsapp', label: 'Store Manager WhatsApp', icon: MessageSquare, desc: 'Omnichannel Resolution Feed' },
    { id: 'emergency', label: 'Emergency Desk', icon: Zap, desc: 'Outage Incident Operations & SLA Tracker' }
  ].filter(t => !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));

  const handleSelectError = (errorIssue) => {
    setActiveTab('triage');
    processTriageDiagnosis(errorIssue);
    onClose();
  };

  const handleSimulateInPOS = (errorIssue) => {
    setActiveTab('simulator');
    triggerTerminalTransaction(errorIssue);
    onClose();
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    onClose();
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-auto bg-[#161D2B] border border-[#243044] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#243044] flex items-center gap-3 bg-[#0B0F17]">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search error codes, acquiring banks, terminals, or workbench actions..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          
          {/* Section: Diagnostic Error Issues */}
          {matchedErrors.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-2 flex justify-between">
                <span>Official Pine Labs Diagnostic Errors</span>
                <span className="text-emerald-400 font-mono">1-Click Triage</span>
              </div>
              <div className="space-y-1">
                {matchedErrors.map(err => (
                  <div
                    key={err.id}
                    className="p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition flex items-center justify-between group cursor-pointer"
                    onClick={() => handleSelectError(err.errorIssue)}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2 h-2 rounded-full bg-pine" />
                      <span className="font-mono font-bold text-xs text-white group-hover:text-emerald-300">
                        {err.errorIssue}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs font-sans">
                        — {err.reasonOfOccurrence}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateInPOS(err.errorIssue);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-pine-lime bg-slate-950 px-2 py-1 rounded border border-slate-800 hover:border-pine-lime transition"
                      >
                        Simulate in POS
                      </button>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        {err.defaultRule}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: 4 Core Workbench Views */}
          {workbenchTabs.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-2">
                Core Workbench Views
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {workbenchTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-pine group-hover:text-emerald-300" />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                            {tab.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {tab.desc}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Acquiring Banks & Support Lines */}
          {matchedBanks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-2">
                Escalation Helpdesks
              </div>
              <div className="space-y-1">
                {matchedBanks.map(([key, bank]) => (
                  <div
                    key={key}
                    onClick={() => {
                      handleSelectError("Contact VI");
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-xs font-bold text-white">{bank.bankName}</span>
                      <span className="text-[11px] font-mono text-emerald-400">{bank.tollFree}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{bank.tat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0B0F17] border-t border-[#243044] text-[11px] text-slate-400 flex justify-between items-center px-4 font-mono">
          <span>Pine Labs POS Sentinel Command Bar</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
