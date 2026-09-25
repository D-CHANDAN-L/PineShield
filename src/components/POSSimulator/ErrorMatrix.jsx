import React, { useState, useMemo } from 'react';
import { Zap, Check, Search, X } from 'lucide-react';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';

export default function ErrorMatrix({ 
  currentProfile, 
  selectedError, 
  onSelectError, 
  onReset,
  isProcessing = false,
  processingErrorId = null
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL"); // ALL, TID, CARD

  const isNonAggregator = currentProfile?.architecture === "Non-Aggregator";

  // Filter master records by search query and category
  const hostErrors = useMemo(() => {
    return MASTER_ERROR_RECORDS.filter(e => 
      (e.type === ERROR_TYPES.ACQUIRING_BANK || e.type === ERROR_TYPES.AGGREGATOR_INTERNAL)
    );
  }, []);

  const cardErrors = useMemo(() => {
    return MASTER_ERROR_RECORDS.filter(e => 
      e.type === ERROR_TYPES.CUSTOMER_ISSUER
    );
  }, []);

  const filteredHostErrors = useMemo(() => {
    if (activeCategory === "CARD") return [];
    if (!searchQuery.trim()) return hostErrors;
    const q = searchQuery.toLowerCase().trim();
    return hostErrors.filter(e => 
      e.errorIssue.toLowerCase().includes(q) ||
      (e.reasonOfOccurrence && e.reasonOfOccurrence.toLowerCase().includes(q))
    );
  }, [hostErrors, searchQuery, activeCategory]);

  const filteredCardErrors = useMemo(() => {
    if (activeCategory === "TID") return [];
    if (!searchQuery.trim()) return cardErrors;
    const q = searchQuery.toLowerCase().trim();
    return cardErrors.filter(e => 
      e.errorIssue.toLowerCase().includes(q) ||
      (e.reasonOfOccurrence && e.reasonOfOccurrence.toLowerCase().includes(q))
    );
  }, [cardErrors, searchQuery, activeCategory]);

  const totalFilteredCount = filteredHostErrors.length + filteredCardErrors.length;

  return (
    <div className="w-full lg:w-[410px] max-w-full space-y-3 flex-shrink-0">
      <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-4 sm:p-5 shadow-xl transition-colors flex flex-col max-h-[580px] sm:max-h-[660px]">
        
        {/* 1. Header (Fixed top) */}
        <div className="flex-shrink-0 pb-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Diagnostic Error Matrix
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

          {/* Quick Search & Category Filter */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              id="input-filter-errors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 15+ errors (e.g. TID, Amex, Inoperative)..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0E1520] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                activeCategory === "ALL"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-bold"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({hostErrors.length + cardErrors.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === "TID" ? "ALL" : "TID")}
              className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                activeCategory === "TID"
                  ? isNonAggregator
                    ? "bg-rose-600 text-white border-transparent font-bold"
                    : "bg-emerald-600 text-white border-transparent font-bold"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Host/TID ({hostErrors.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === "CARD" ? "ALL" : "CARD")}
              className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                activeCategory === "CARD"
                  ? "bg-amber-600 text-white border-transparent font-bold"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Card Declines ({cardErrors.length})
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body (Contained internal scroll) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pt-3 pb-1 scrollbar-thin">
          {totalFilteredCount === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <div>No error codes matching "{searchQuery}"</div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("ALL");
                }}
                className="text-emerald-500 hover:underline font-semibold text-xs cursor-pointer"
              >
                Clear search & filters
              </button>
            </div>
          ) : (
            <>
              {/* Group 1: Bank TID Deactivation Errors or Aggregator Switch Errors */}
              {filteredHostErrors.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isNonAggregator ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      1. {isNonAggregator ? "Bank Host / TID Errors" : "Aggregator Switch / TID"} ({filteredHostErrors.length})
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                      {isNonAggregator ? currentProfile?.acquirer : "Pine Labs Master"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredHostErrors.map((err) => {
                      const isSelected = selectedError?.id === err.id;
                      const isThisProcessing = isProcessing && (processingErrorId === err.id || isSelected);

                      const defaultBadgeText = 
                        err.noContactNeeded
                          ? "Auto-Resolve"
                          : err.requiresRetryFirst
                          ? "Retry First"
                          : err.type === ERROR_TYPES.AGGREGATOR_INTERNAL || err.errorIssue.includes("Decline #99")
                          ? "Pine Labs"
                          : isNonAggregator
                          ? "Bank Host"
                          : "Plutus Desk";

                      return (
                        <button
                          key={err.id}
                          id={`err-btn-${err.id}`}
                          disabled={isProcessing}
                          onClick={() => onSelectError(err)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex justify-between items-center border min-h-[38px] ${
                            isThisProcessing
                              ? "cursor-wait opacity-95 ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100 shadow-md"
                              : isProcessing
                              ? "cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500"
                              : isSelected
                              ? isNonAggregator
                                ? "bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-200 font-bold shadow-sm cursor-pointer"
                                : "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm cursor-pointer"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 cursor-pointer active:scale-[0.99]"
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
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
                            <span className="text-[9px] font-sans px-1.5 py-0.5 rounded font-bold bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 animate-pulse border border-amber-300 dark:border-amber-700 flex items-center gap-1 flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                              Sending...
                            </span>
                          ) : (
                            <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/30 font-bold flex-shrink-0">
                              {defaultBadgeText}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 2: Customer Card / Issuer Limits */}
              {filteredCardErrors.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2 pt-1">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      2. Customer Card / Issuer Restrictions ({filteredCardErrors.length})
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">POS Healthy</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredCardErrors.map((err) => {
                      const isSelected = selectedError?.id === err.id;
                      const isThisProcessing = isProcessing && (processingErrorId === err.id || isSelected);

                      return (
                        <button
                          key={err.id}
                          id={`err-btn-${err.id}`}
                          disabled={isProcessing}
                          onClick={() => onSelectError(err)}
                          className={`text-left px-2.5 py-2 rounded-xl text-[10.5px] font-mono transition border truncate min-h-[38px] ${
                            isThisProcessing
                              ? "cursor-wait opacity-95 ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100 shadow-md"
                              : isProcessing
                              ? "cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500"
                              : isSelected
                              ? "bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-200 font-bold shadow-sm cursor-pointer"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400/50 cursor-pointer active:scale-[0.99]"
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
              )}
            </>
          )}
        </div>

        {/* 3. Footer Reset Button (Fixed bottom) */}
        <div className="flex-shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            id="btn-clean-state"
            disabled={isProcessing}
            onClick={onReset}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 transition flex items-center justify-center space-x-1.5 shadow min-h-[42px] ${
              isProcessing
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer active:scale-98"
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
