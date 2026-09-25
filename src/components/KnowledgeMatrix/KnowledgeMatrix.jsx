import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS, SOP_RULES, ERROR_TYPES } from '../../data/sopRules';
import { 
  Building2, 
  Store, 
  Terminal, 
  Layers, 
  Search, 
  PlayCircle, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';

export default function KnowledgeMatrix({ onSimulateError }) {
  const {
    organization,
    stores,
    currentStore,
    currentPos,
    setSelectedStoreId,
    setSelectedPosId
  } = useMerchant();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredErrors = MASTER_ERROR_RECORDS.filter(item => {
    const matchesSearch = 
      item.errorIssue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reasonOfOccurrence.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.defaultRule.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = 
      selectedCategory === "ALL" || 
      item.category === selectedCategory ||
      (selectedCategory === "BANK" && item.type === ERROR_TYPES.ACQUIRING_BANK) ||
      (selectedCategory === "CUSTOMER" && item.type === ERROR_TYPES.CUSTOMER_ISSUER);

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* SECTION 1: RELATIONAL TREE EXPLORER */}
      <div className="bg-white dark:bg-pine-surface/90 border border-slate-200 dark:border-pine-border rounded-3xl p-6 shadow-2xl transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-200 dark:border-pine-border gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pine" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Merchant Relational Tree Explorer
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any POS Terminal card below to instantly bind it as the active hardware context across all workbench tools.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-pine-card/80 border border-slate-200 dark:border-pine-border px-3.5 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Organization:</span>
            <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5 font-sans">
              <Building2 className="w-3.5 h-3.5 text-pine" />
              {organization?.orgName || "Croma Electronics India Ltd."}
            </span>
            <span className="bg-pine/15 text-pine-dark dark:text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-pine/30 font-semibold">
              {organization?.mid || "MID_CR_88201"}
            </span>
          </div>
        </div>

        {/* Hierarchy Tree Visualizer */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stores.map((store) => {
            const isStoreActive = store.storeId === currentStore.storeId;

            return (
              <div
                key={store.storeId}
                className={`rounded-2xl border transition-all duration-200 p-5 ${
                  isStoreActive
                    ? "bg-slate-50 dark:bg-slate-900/90 border-pine/50 ring-2 ring-pine/30 shadow-lg shadow-pine/5"
                    : "bg-white dark:bg-pine-card/40 border-slate-200 dark:border-pine-border/60 hover:border-slate-300 dark:hover:border-pine-border"
                }`}
              >
                {/* Store Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isStoreActive 
                        ? "bg-pine/20 text-pine border border-pine/40" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}>
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{store.storeName}</h3>
                        {isStoreActive && (
                          <span className="bg-pine/20 text-pine-dark dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-pine/30">
                            Active Store
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manager: <strong className="text-slate-800 dark:text-slate-200">{store.managerName}</strong> • {store.managerPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Store Terminals Grid */}
                <div className="space-y-3">
                  <div className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configured SmartPOS Terminals ({store.terminals.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {store.terminals.map((pos) => {
                      const isPosSelected = pos.posId === currentPos.posId;
                      const isNonAgg = pos.architecture === "Non-Aggregator";

                      return (
                        <div
                          key={pos.posId}
                          onClick={() => {
                            setSelectedStoreId(store.storeId);
                            setSelectedPosId(pos.posId);
                          }}
                          className={`rounded-xl p-3 border text-xs cursor-pointer transition-all ${
                            isPosSelected
                              ? "bg-emerald-50 dark:bg-pine-forest/70 border-pine text-slate-900 dark:text-white shadow-md ring-2 ring-pine/40"
                              : "bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              {pos.posId}
                              {isPosSelected && <CheckCircle className="w-3.5 h-3.5 text-pine inline" />}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase ${
                              isNonAgg
                                ? "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                            }`}>
                              {pos.architecture}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Acquirer: <strong className="text-slate-800 dark:text-slate-200">{pos.acquirer}</strong>
                          </div>

                          {/* Subsystems & TIDs preview */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
                            {pos.subsystems?.map((sub, i) => (
                              <div key={i} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                <span className="truncate max-w-[110px]">{sub.name}:</span>
                                <span className={sub.status === "Inactive" ? "text-rose-500 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400"}>
                                  {sub.tid || sub.vpa || sub.dmsCode}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: SEARCHABLE SOP DIAGNOSTIC TABLE */}
      <div className="bg-white dark:bg-pine-surface/90 border border-slate-200 dark:border-pine-border rounded-3xl p-6 shadow-2xl transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-200 dark:border-pine-border gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pine-lime" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Master SOP Diagnostic & Resolution Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deterministic routing logic for all 12 official Pine Labs Error Issues. Click "Simulate in POS" to inject error, auto-dispatch to WhatsApp, and inspect terminal.
            </p>
          </div>

          {/* Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-pine-border rounded-xl px-3 py-1.5 w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by error, reason, rule..."
                className="bg-transparent text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full font-mono"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-pine-card p-1 rounded-xl border border-slate-200 dark:border-pine-border text-xs">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === "ALL" ? "bg-pine text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All (12)
              </button>
              <button
                onClick={() => setSelectedCategory("BANK")}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === "BANK" ? "bg-rose-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Bank TIDs (5)
              </button>
              <button
                onClick={() => setSelectedCategory("CUSTOMER")}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === "CUSTOMER" ? "bg-amber-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Card Limits (7)
              </button>
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-pine-border bg-slate-50 dark:bg-pine-card/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">S.No</th>
                <th className="py-3 px-3">Error Issue</th>
                <th className="py-3 px-3">Category / Entity</th>
                <th className="py-3 px-3">Reason of Occurrence</th>
                <th className="py-3 px-3">Required Solution</th>
                <th className="py-3 px-3">Applied Rule</th>
                <th className="py-3 px-3 text-right">Interactive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-pine-border/60 font-sans">
              {filteredErrors.map((err) => {
                const isBank = err.type === ERROR_TYPES.ACQUIRING_BANK;
                const ruleInfo = SOP_RULES[err.defaultRule];

                return (
                  <tr key={err.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{err.id}</td>
                    
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-950/80 rounded border border-slate-200 dark:border-slate-800">
                        {err.errorIssue}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isBank
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                      }`}>
                        {err.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                      {err.reasonOfOccurrence}
                    </td>

                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200 max-w-sm leading-relaxed font-medium">
                      {err.solution}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                        {ruleInfo ? ruleInfo.id : err.defaultRule}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSimulateError(err.errorIssue)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pine hover:bg-pine-hover text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                        title={`Simulate ${err.errorIssue} on SmartPOS`}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Simulate in POS</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
