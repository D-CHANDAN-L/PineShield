import React from 'react';
import { MASTER_SOP_RULES, ERROR_CATEGORIES } from '../../data/sopRules';
import { ShieldAlert, Zap, AlertCircle } from 'lucide-react';

export default function ErrorInjectionPanel({ onSelectError, activeErrorCode }) {
  // Group rules by category
  const nonAggErrors = MASTER_SOP_RULES.filter(r => r.category === ERROR_CATEGORIES.NON_AGG_TID_DEFLECTION);
  const cardErrors = MASTER_SOP_RULES.filter(r => r.category === ERROR_CATEGORIES.CUSTOMER_CARD_ISSUER);

  return (
    <div className="bg-pine-surface/90 border border-pine-border rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-pine-border pb-2">
        <div className="flex items-center space-x-1.5">
          <Zap className="w-4 h-4 text-amber-400"/>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Error Injection Matrix
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">Simulate Failure</span>
      </div>

      <div className="space-y-2.5">
        {/* Category 1: Non-Aggregator TID Drops (Secret Sauce) */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-400 mb-1">
            <ShieldAlert className="w-3 h-3"/>
            <span>Bank TID Deactivations (Zero-Touch Deflection)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {nonAggErrors.slice(0, 4).map(err => (
              <button
                key={err.code}
                onClick={() => onSelectError(err.code)}
                className={`text-left px-2 py-1.5 rounded text-[10px] font-mono border transition ${
                  activeErrorCode === err.code
                    ? "bg-rose-950/70 border-rose-500 text-rose-300 font-bold"
                    : "bg-pine-card/60 border-pine-border/80 text-slate-300 hover:border-rose-500/50 hover:bg-rose-950/30"
                }`}
              >
                {err.code}
              </button>
            ))}
          </div>
        </div>

        {/* Category 2: Customer Card Issuers */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 mb-1">
            <AlertCircle className="w-3 h-3"/>
            <span>Customer Card / Limits (Advise Cashier)</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {cardErrors.slice(0, 2).map(err => (
              <button
                key={err.code}
                onClick={() => onSelectError(err.code)}
                className={`text-left px-2 py-1.5 rounded text-[10px] font-mono border transition ${
                  activeErrorCode === err.code
                    ? "bg-amber-950/70 border-amber-500 text-amber-300 font-bold"
                    : "bg-pine-card/60 border-pine-border/80 text-slate-300 hover:border-amber-500/50 hover:bg-amber-950/30"
                }`}
              >
                {err.code}
              </button>
            ))}
          </div>
        </div>

        {/* Category 3: Brand EMI & Hardware */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-sky-400 mb-1">
            <span>Brand Affordability & Hardware Locks</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSelectError("INVALID PRODUCT DETAILS (IMEI)")}
              className={`text-left px-2 py-1.5 rounded text-[9.5px] font-mono border transition ${
                activeErrorCode === "INVALID PRODUCT DETAILS (IMEI)"
                  ? "bg-sky-950/70 border-sky-500 text-sky-300 font-bold"
                  : "bg-pine-card/60 border-pine-border text-slate-300 hover:border-sky-500/50"
              }`}
            >
              INVALID IMEI
            </button>
            <button
              onClick={() => onSelectError("Customer App Not Working")}
              className={`text-left px-2 py-1.5 rounded text-[9.5px] font-mono border transition ${
                activeErrorCode === "Customer App Not Working"
                  ? "bg-sky-950/70 border-sky-500 text-sky-300 font-bold"
                  : "bg-pine-card/60 border-pine-border text-slate-300 hover:border-sky-500/50"
              }`}
            >
              E600 Display
            </button>
          </div>
        </div>

        {/* Success Option */}
        <button
          onClick={() => onSelectError(null)}
          className={`w-full py-1.5 rounded text-[10px] font-semibold border transition ${
            activeErrorCode === null
              ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold"
              : "bg-pine-card/50 border-pine-border text-slate-400 hover:text-emerald-300"
          }`}
        >
          ✓ Normal Clean Transaction (No Failure)
        </button>
      </div>
    </div>
  );
}
