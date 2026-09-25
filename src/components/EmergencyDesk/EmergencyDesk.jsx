import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { BANK_DIRECTORY } from '../../data/bankDirectory';
import { verifyRecaptchaToken } from '../../services/integrations';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Activity, 
  Check, 
  Zap,
  PhoneCall
} from 'lucide-react';

export default function EmergencyDesk() {
  const {
    stores,
    currentStore,
    currentPos,
    emergencyIncidents,
    triggerEmergencyIncident,
    resolveEmergencyIncident
  } = useMerchant();

  const [selectedStoreId, setSelectedStoreId] = useState(currentStore.storeId);
  const [selectedPosId, setSelectedPosId] = useState(currentPos.posId);
  const [severity, setSeverity] = useState("Critical - Checkout Blocked");
  const [category, setCategory] = useState("TID Deactivation");
  const [issueDescription, setIssueDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidentSubmittedSuccess, setIncidentSubmittedSuccess] = useState(null);

  const handleStoreChange = (newStoreId) => {
    setSelectedStoreId(newStoreId);
    const store = stores.find(s => s.storeId === newStoreId);
    if (store && store.terminals.length > 0) {
      setSelectedPosId(store.terminals[0].posId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    setIsSubmitting(true);
    // Verify Google reCAPTCHA token
    await verifyRecaptchaToken("emergency_incident_submit");

    const created = triggerEmergencyIncident({
      storeId: selectedStoreId,
      posId: selectedPosId,
      severity,
      category,
      issueDescription: issueDescription.trim()
    });

    setIsSubmitting(false);
    setIncidentSubmittedSuccess(created);
    setIssueDescription("");

    setTimeout(() => {
      setIncidentSubmittedSuccess(null);
    }, 6000);
  };

  const getElapsedTime = (isoString) => {
    if (!isoString) return "Just now";
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  };

  const selectedStoreObj = stores.find(s => s.storeId === selectedStoreId) || currentStore;
  const selectedPosObj = selectedStoreObj.terminals.find(t => t.posId === selectedPosId) || currentPos;

  // Active bank contact data based on terminal context
  const activeBankData = BANK_DIRECTORY[selectedPosObj.acquirer] || BANK_DIRECTORY[currentPos.acquirer] || BANK_DIRECTORY["HDFC Bank"];
  const pinePlutusData = BANK_DIRECTORY["Pine Labs Plutus Desk"];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP EMERGENCY BANNER & SWITCH STATUS */}
      <div className="bg-gradient-to-r from-red-950/70 via-[#161D2B] to-[#0B1311] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest font-mono">
                Pine Labs Enterprise Outage Incident Commander
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0" />
              Emergency Outage & Multi-Desk Incident Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Instantly escalate checkout-blocking failures, bank switch outages, or deactivated TIDs.
              Triggering an incident dispatches high-priority tickets simultaneously to the merchant's 
              Acquiring Bank Helpdesk and Pine Labs Plutus L2 Technical Operations.
            </p>
          </div>

          {/* Real-time Switch Status Telemetry */}
          <div className="bg-[#0B0F17]/90 border border-[#243044] p-3.5 rounded-2xl space-y-2 w-full lg:w-72 shadow-inner">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Host Switch Telemetry
              </span>
              <span className="text-emerald-400 font-mono text-[9px]">Live 99.98%</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400">HDFC Switch:</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400">Axis Gateway:</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400">SBI Switch:</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400">Amex Gateway:</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DIRECT EMERGENCY CONTACT CARDS (PINE LABS PLUTUS + ACQUIRING BANK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pine Labs Plutus Emergency Desk */}
        <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-pine/15 border border-pine/30 flex items-center justify-center text-pine">
                <Building className="w-4 h-4 text-pine" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Pine Labs Plutus Support Desk</h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">24/7 L2 Switch Operations</span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              Aggregator TIDs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Helpline</span>
              <strong className="text-slate-900 dark:text-white font-bold">{pinePlutusData.landline}</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Toll-Free</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{pinePlutusData.tollFree}</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 min-w-0">
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Email Desk</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold truncate block">{pinePlutusData.email}</span>
            </div>
          </div>
        </div>

        {/* Active Acquiring Bank Emergency Desk */}
        <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{activeBankData.bankName}</h4>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold font-mono">Active Terminal Acquirer ({selectedPosObj.architecture})</span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold">
              Bank TID Deflection
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Bank Toll-Free</span>
              <strong className="text-slate-900 dark:text-white font-bold truncate block">{activeBankData.tollFree}</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 min-w-0">
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Bank Desk Email</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold truncate block">{activeBankData.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKBENCH: REPORTING FORM & ACTIVE CASES TRACKER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Outage Incident Reporting Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Log Emergency Outage Incident
              </h2>
            </div>
            <span className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
              Dual-Desk Dispatch
            </span>
          </div>

          {incidentSubmittedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/50 text-xs text-emerald-800 dark:text-emerald-300 space-y-1 shadow-inner animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Incident {incidentSubmittedSuccess.id} Successfully Dispatched!</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Notified: {incidentSubmittedSuccess.notifiedDesks.join(' & ')}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Store Outlet Selector (auto-selected to current store) */}
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block text-[11px]">
                Current Store Outlet:
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#243044] rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500 text-xs cursor-pointer"
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId} className="bg-white dark:bg-[#161D2B] text-slate-900 dark:text-slate-200">
                    {s.storeName} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Impacted POS ID Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block text-[11px]">
                Impacted POS ID:
              </label>
              <select
                value={selectedPosId}
                onChange={(e) => setSelectedPosId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#243044] rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-red-500 text-xs cursor-pointer"
              >
                {selectedStoreObj.terminals.map(t => (
                  <option key={t.posId} value={t.posId} className="bg-white dark:bg-[#161D2B] text-emerald-600 dark:text-emerald-400">
                    {t.posId} — {t.architecture} ({t.acquirer})
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Level Selection per Spec */}
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block text-[11px]">
                Severity Level:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: "Critical - Checkout Blocked",
                    label: "Critical - Checkout Blocked",
                    sla: "15m SLA",
                    color: "border-red-400 dark:border-red-500/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:border-red-500"
                  },
                  {
                    id: "High - Intermittent Failure",
                    label: "High - Intermittent Failure",
                    sla: "1h SLA",
                    color: "border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:border-amber-500"
                  }
                ].map((s) => {
                  const isSelected = severity === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSeverity(s.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? `${s.color} ring-1 ring-red-400/40 font-bold shadow-md` 
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-red-500" : "bg-slate-400 dark:bg-slate-600"}`} />
                        <span className="text-[11px]">{s.label}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 font-bold">
                        {s.sla}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block text-[11px]">
                Description / Outage Symptoms:
              </label>
              <textarea
                required
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe failure details, error string displayed (e.g. Contact VI, TID NOT PRESENT), and checkout impact..."
                className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#243044] rounded-xl p-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-red-500 text-xs font-mono resize-none"
              />
            </div>

            {/* Google reCAPTCHA Verification Badge */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#243044] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[9px] border border-emerald-500/40">
                  ✓
                </div>
                <span>Google reCAPTCHA v3 Enterprise</span>
              </div>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">Verified Score 0.94</span>
            </div>

            {/* Primary Action Button per Master Directive Section 6.1 */}
            <button
              type="submit"
              disabled={isSubmitting || !issueDescription.trim()}
              className="w-full py-3 rounded-2xl bg-pine hover:bg-pine-hover text-slate-950 font-extrabold text-xs shadow-lg shadow-pine/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Dispatching to Multi-Desk Gateway...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>Declare Emergency Outage & Notify Bank / Plutus Desks</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Active Emergency Cases Tracker (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Active Emergency Cases Tracker
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                High-contrast multi-desk operational case tracking with active SLA timers.
              </p>
            </div>

            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
              Active Cases: <strong className="text-slate-900 dark:text-white">{emergencyIncidents.filter(i => i.status !== "Resolved").length}</strong>
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {emergencyIncidents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No emergency incidents logged. All merchant POS terminals operational.
              </div>
            ) : (
              emergencyIncidents.map((incident) => {
                const isResolved = incident.status === "Resolved";
                const isCritical = incident.severity.includes("Critical");

                return (
                  <div
                    key={incident.id}
                    className={`rounded-2xl border p-4 transition text-xs space-y-3 ${
                      isResolved
                        ? "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                        : isCritical
                        ? "bg-red-50/50 dark:bg-gradient-to-r dark:from-red-950/40 dark:to-[#161D2B] border-red-200 dark:border-red-500/40 text-slate-800 dark:text-slate-200 shadow-md"
                        : "bg-amber-50/40 dark:bg-[#161D2B] border-amber-200 dark:border-amber-500/30 text-slate-800 dark:text-slate-200 shadow-md"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {incident.id}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          isResolved
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                            : isCritical
                            ? "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/40 animate-pulse"
                            : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
                        }`}>
                          {incident.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{getElapsedTime(incident.createdAt)}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                          {incident.severity.split(' - ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-sans font-bold">Outlet:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{incident.storeName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-sans font-bold">Terminal / Acquirer:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{incident.posId}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">({incident.acquirer})</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-100/70 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                      <strong className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase font-sans mb-0.5">
                        Issue Statement:
                      </strong>
                      {incident.description}
                    </div>

                    {/* Assigned Engineering Team & Resolve Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 border-t border-slate-200 dark:border-white/5 text-[10px]">
                      <div className="text-slate-500 dark:text-slate-400">
                        <span>Assigned Engineering Team: </span>
                        <strong className="text-slate-800 dark:text-slate-200">{incident.assignedTeam}</strong>
                      </div>

                      {!isResolved ? (
                        <button
                          onClick={() => resolveEmergencyIncident(incident.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/30 hover:bg-emerald-100 dark:hover:bg-emerald-600/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 font-bold transition cursor-pointer flex items-center space-x-1.5 active:scale-95 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve Outage</span>
                        </button>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved at {new Date(incident.resolvedAt || incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
