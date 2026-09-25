import React from 'react';
import { Zap, Check } from 'lucide-react';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';

export default function ErrorMatrix({ 
  currentProfile, 
  selectedError, 
  onSelectError, 
  onReset,
  isProcessing = false,
  processingErrorId = null
}) {
  const isNonAggregator = currentProfile?.architecture === "Non-Aggregator";

  return (
    <div className="w-full lg:w-96 space-y-3">
      <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-5 shadow-xl space-y-4 transition-colors">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Diagnostic Error Injection Matrix
            </h3>
          </div>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
            isNonAggregator
              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
              : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
          }`}>
            {currentProfile?.architecture || "Non-Aggregator"}
          </span>
        </div>

        {/* Group 1: Bank TID Deactivation Errors or Aggregator Switch Errors */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isNonAggregator ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              1. {isNonAggregator ? "Bank Host / TID Errors" : "Aggregator Switch / TID"}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
              {isNonAggregator ? currentProfile?.acquirer : "Pine Labs Master"}
            </span>
          </div>
          <div className="space-y-1.5">
            {MASTER_ERROR_RECORDS.filter(e => 
              (e.type === ERROR_TYPES.ACQUIRING_BANK || e.type === ERROR_TYPES.AGGREGATOR_INTERNAL)
            ).map((err) => {
              const isSelected = selectedError?.id === err.id;
              const isThisProcessing = isProcessing && (processingErrorId === err.id || isSelected);

              const defaultBadgeText = 
                err.errorIssue === "Term Inactive-Amex"
                  ? "Amex"
                  : err.type === ERROR_TYPES.AGGREGATOR_INTERNAL || err.errorIssue.includes("Decline #99")
                  ? "Pine Labs / Aggregator"
                  : isNonAggregator
                  ? "Bank Host"
                  : "Plutus Desk";

              return (
                <button
                  key={err.id}
                  id={`err-btn-${err.id}`}
                  disabled={isProcessing}
                  onClick={() => onSelectError(err)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex justify-between items-center border ${
                    isThisProcessing
                      ? "cursor-wait opacity-95 ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100 shadow-md"
                      : isProcessing
                      ? "cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500"
                      : isSelected
                      ? isNonAggregator
                        ? "bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-200 font-bold shadow-sm cursor-pointer"
                        : "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm cursor-pointer"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isThisProcessing
                        ? "bg-amber-500 animate-ping"
                        : err.type === ERROR_TYPES.AGGREGATOR_INTERNAL 
                        ? "bg-emerald-500" 
                        : isNonAggregator 
                        ? "bg-rose-500" 
                        : "bg-emerald-500"
                    }`} />
                    <span className="truncate">{err.errorIssue}</span>
                  </div>
                  {isThisProcessing ? (
                    <span className="text-[9px] font-sans px-1.5 py-0.5 rounded font-bold bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 animate-pulse border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                      Sending...
                    </span>
                  ) : (
                    <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/30 font-bold">
                      {defaultBadgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Group 2: Customer Card / Issuer Limits */}
        <div>
          <div className="flex justify-between items-center mb-2 pt-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              2. Customer Card / Issuer Restrictions
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">POS Healthy</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {MASTER_ERROR_RECORDS.filter(e => e.type === ERROR_TYPES.CUSTOMER_ISSUER).map((err) => {
              const isSelected = selectedError?.id === err.id;
              const isThisProcessing = isProcessing && (processingErrorId === err.id || isSelected);

              return (
                <button
                  key={err.id}
                  id={`err-btn-${err.id}`}
                  disabled={isProcessing}
                  onClick={() => onSelectError(err)}
                  className={`text-left px-2 py-1.5 rounded-xl text-[10px] font-mono transition border truncate ${
                    isThisProcessing
                      ? "cursor-wait opacity-95 ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100 shadow-md"
                      : isProcessing
                      ? "cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500"
                      : isSelected
                      ? "bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-200 font-bold shadow-sm cursor-pointer"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400/50 cursor-pointer"
                  }`}
                  title={err.errorIssue}
                >
                  <div className="flex items-center justify-between truncate">
                    <span className="truncate">{err.errorIssue}</span>
                    {isThisProcessing && (
                      <span className="text-[8px] bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold px-1 rounded animate-pulse ml-1">
                        Sending...
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean State Approval Trigger */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            id="btn-clean-state"
            disabled={isProcessing}
            onClick={onReset}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 transition flex items-center justify-center space-x-1.5 shadow ${
              isProcessing
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Reset to Clean State (Transaction Approved)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
