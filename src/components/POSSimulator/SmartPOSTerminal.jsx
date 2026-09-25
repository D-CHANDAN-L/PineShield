import React, { useState, useEffect } from 'react';
import TerminalDisplay from './TerminalDisplay';
import ReceiptModal from './ReceiptModal';
import ErrorMatrix from './ErrorMatrix';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';
import { Nfc, Zap, FileText, ChevronRight, Check } from 'lucide-react';

export default function SmartPOSTerminal({ onNavigateToTriage }) {
  const {
    triggerTerminalTransaction,
    resetTerminal,
    printedReceipt,
    currentProfile,
    terminalStatus,
    activeSimulatedError,
    isDispatchingWhatsApp,
    isConsultingAi
  } = useMerchant();

  const [selectedError, setSelectedError] = useState(null);
  const [processingErrorId, setProcessingErrorId] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const isProcessing = terminalStatus === "PROCESSING" || isDispatchingWhatsApp || isConsultingAi;

  // Clear processingErrorId once dispatch/terminal processing finishes
  useEffect(() => {
    if (!isProcessing) {
      setProcessingErrorId(null);
    }
  }, [isProcessing]);

  const handleProcess = () => {
    if (isProcessing) return;
    triggerTerminalTransaction(selectedError?.errorIssue || null);
  };

  const handleQuickTrigger = (err) => {
    if (isProcessing) return;
    setProcessingErrorId(err.id);
    setSelectedError(err);
    triggerTerminalTransaction(err.errorIssue);
  };

  const handleReset = () => {
    if (isProcessing) return;
    setSelectedError(null);
    setProcessingErrorId(null);
    resetTerminal();
  };

  const isNonAggregator = currentProfile?.architecture === "Non-Aggregator";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full">
      {/* 1. AUTHENTIC WHITE SMARTPOS CASING (A920 HARDWARE FIDELITY) */}
      <div className="flex flex-col items-center">
        {/* Strictly Fixed Casing to prevent layout shifts */}
        <div className="w-[320px] h-[590px] bg-[#F1F3F5] rounded-[42px] p-3 shadow-2xl border-2 border-slate-300 relative flex flex-col justify-between items-center flex-shrink-0 select-none">
          
          {/* Top Thermal Printer Bay */}
          <div className="w-full bg-[#E4E7EB] rounded-t-[32px] pt-3.5 pb-2 px-4 border-b border-slate-300 flex flex-col items-center shadow-inner flex-shrink-0">
            <div className="w-44 h-1.5 bg-slate-700 rounded-full mb-2" />
            
            {/* Green Pine Labs Branding */}
            <div className="font-extrabold text-[#00843D] text-sm tracking-tight flex items-center gap-1.5">
              <span>pine labs</span>
              <span className="text-[9px] font-mono text-slate-500 font-normal">SmartPOS A920</span>
            </div>

            {/* 4 Android LEDs & NFC Wave Logo */}
            <div className="w-full flex justify-between items-center mt-2 px-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400 animate-pulse" title="Host Switch Link Active"/>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-300" title="Reader Initialized"/>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" title="Power Ready"/>
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-400" title="Security SAM OK"/>
              </div>
              <Nfc className="w-4 h-4 text-slate-600" title="Contactless EMV L1/L2 Active"/>
            </div>
          </div>

          {/* Borderless Color Touchscreen (Strictly Fixed Dimensions) */}
          <div className="w-full h-[450px] bg-white rounded-b-2xl shadow-md border-x border-b border-slate-200 overflow-hidden flex flex-col">
            <TerminalDisplay onProcess={handleProcess} onReset={handleReset}/>
          </div>

          {/* Bottom Contactless / Smart Card EMV Slot (Zero plastic keypad buttons) */}
          <div className="w-full pt-2 pb-1 flex flex-col items-center flex-shrink-0">
            <div className="w-32 h-1.5 bg-slate-300 rounded-full border border-slate-400/60 shadow-inner" />
            <span className="text-[8px] font-bold text-slate-500 tracking-wider mt-0.5 uppercase">
              Smart Card EMV Slot
            </span>
          </div>
        </div>

        {/* Detached Receipt Modal Trigger Button & Inter-Screen Deep Route Button */}
        <div className="w-[320px] mt-3 space-y-2">
          {printedReceipt ? (
            <button
              id="btn-view-charge-slip"
              onClick={() => setIsReceiptOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg border border-slate-700 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-400"/>
              <span>View Thermal Charge Slip ({printedReceipt.errorCode})</span>
            </button>
          ) : (
            <div className="w-full py-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
              Charge slip printed automatically on transaction
            </div>
          )}

          {/* Inter-Screen Deep Routing Action: Navigate to AI Triage Studio */}
          {terminalStatus === "FAILED" && (
            <button
              id="btn-goto-triage"
              onClick={() => {
                const errorName = activeSimulatedError?.errorIssue || printedReceipt?.errorCode || selectedError?.errorIssue || "TID NOT PRESENT";
                if (onNavigateToTriage) {
                  onNavigateToTriage(errorName);
                }
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95 animate-in fade-in duration-200"
            >
              <span>⚡ Diagnose in AI Triage Studio</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ERROR INJECTION CONTROLS PANEL */}
      <ErrorMatrix
        currentProfile={currentProfile}
        selectedError={selectedError}
        processingErrorId={processingErrorId}
        isProcessing={isProcessing}
        onSelectError={handleQuickTrigger}
        onReset={handleReset}
      />

      {/* Charge Slip Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={printedReceipt}
      />
    </div>
  );
}
