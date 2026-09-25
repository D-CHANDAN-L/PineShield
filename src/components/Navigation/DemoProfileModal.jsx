import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMerchant } from '../../context/MerchantContext';
import { UserCheck, Shield, Building2, Terminal, ArrowRight, X, CheckCircle2 } from 'lucide-react';

export default function DemoProfileModal({ isOpen, onClose }) {
  const { demoProfiles, activeProfileId, switchDemoProfile } = useMerchant();
  const cardRef = useRef(null);

  useGSAP(() => {
    if (isOpen && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: -8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div ref={cardRef} className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#161D2B] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white transition-colors space-y-4">

        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pine animate-pulse" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Demo Login: 1-Click Persona Pre-Binding
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an operational model. The POS ID, store, manager, and routing logic are bound instantly with zero intake friction.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoProfiles.map((p) => {
            const isActive = p.profileId === activeProfileId;
            const isNonAgg = p.architecture === "Non-Aggregator";

            return (
              <div
                key={p.profileId}
                onClick={() => switchDemoProfile(p.profileId)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${isActive
                    ? isNonAgg
                      ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-lg ring-2 ring-rose-500/20"
                      : "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-lg ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F17]/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
              >
                {/* Active Badge */}
                {isActive && (
                  <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${isNonAgg ? "bg-rose-500 text-white" : "bg-emerald-500 text-slate-950 font-black"
                    }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    Active Bound Session
                  </span>
                )}

                {/* Profile Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{isNonAgg ? "🏦" : "⚡"}</span>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                        {p.managerName}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.managerPhone}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Store:</span>
                      <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{p.storeName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Bound POS:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{p.posId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Architecture:</span>
                      <span className={`font-bold ${isNonAgg ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {p.architecture}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Acquirer:</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{p.acquirer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">TID:</span>
                      <span className="text-slate-500">{p.tid} ({p.tidStatus})</span>
                    </div>
                  </div>

                  {/* SOP Routing Explanation */}
                  <div className={`p-2 rounded-xl text-[10.5px] leading-tight border ${isNonAgg
                      ? "bg-rose-100/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                      : "bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                    }`}>
                    {isNonAgg ? (
                      <p>
                        <strong>Rule 1 Applied:</strong> 100% Zero-Touch Deflection to <strong>HDFC Bank Helpdesk</strong>. Pine Labs has no switch unlock authority.
                      </p>
                    ) : (
                      <p>
                        <strong>Rule 2 Applied:</strong> <strong>Pine Labs Master Merchant</strong>. Internal L2 priority ticket generated (no bank deflection).
                      </p>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    switchDemoProfile(p.profileId);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${isActive
                      ? isNonAgg
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                >
                  <span>{isActive ? "Currently Active Bound Profile" : `Switch to ${p.architecture}`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-1 text-[11px] text-slate-400 font-mono">
          Context pre-binding eliminates conversational friction: PineShield AI never asks "What is your POS ID?".
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
