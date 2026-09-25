import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import TerminalScreen from './TerminalScreen';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';
import { Nfc, Zap, FileText, ChevronRight, X } from 'lucide-react';

export default function PaxTerminal() {
  const {
    currentPos,
    triggerTerminalTransaction,
    printedReceipt,
    activeSimulatedError,
    setTerminalStatus,
    setPrintedReceipt
  } = useMerchant();

  const [selectedError, setSelectedError] = useState(null);
  const [showReceiptOverlay, setShowReceiptOverlay] = useState(false);

  const handleProcess = () => {
    triggerTerminalTransaction(selectedError?.errorIssue || null);
  };

  const handleReset = () => {
    setSelectedError(null);
    setTerminalStatus("IDLE");
    setPrintedReceipt(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full">
      {/* 1. AUTHENTIC WHITE PINE LABS SMARTPOS CHASSIS */}
      <div className="w-[300px] sm:w-[320px] bg-[#F1F3F5] rounded-[36px] p-3 shadow-2xl border-2 border-slate-300 relative flex flex-col items-center flex-shrink-0">
        
        {/* Top Thermal Printer Bay */}
        <div className="w-full bg-[#E4E7EB] rounded-t-[28px] pt-3 pb-2 px-4 border-b border-slate-300 flex flex-col items-center relative shadow-inner">
          {/* Thermal Paper Chute Cutout */}
          <div className="w-44 h-1.5 bg-slate-700 rounded-full mb-2 shadow-inner" />
          
          {/* Official Pine Labs Green Branding */}
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-[#00843D] text-sm tracking-tight font-sans">pine labs</span>
          </div>

          {/* Contactless Wave Logo & 4 Android Status LEDs */}
          <div className="w-full flex justify-between items-center mt-2 px-2">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </div>
            <div className="flex items-center text-slate-500 space-x-0.5" title="Contactless Reader Active">
              <Nfc className="w-3.5 h-3.5 text-slate-600"/>
            </div>
          </div>
        </div>

        {/* Smart Touch Display Container */}
        <div className="w-full bg-white rounded-b-2xl shadow-md border-x border-b border-slate-200 overflow-hidden relative">
          <TerminalScreen onReset={handleReset} onStartPayment={handleProcess}/>
        </div>

        {/* Bottom Card Insertion Lip */}
        <div className="w-full pt-2.5 pb-1 flex flex-col items-center">
          <div className="w-32 h-1 bg-slate-300 rounded-full border border-slate-400/60" />
          <span className="text-[8px] font-bold text-slate-400 tracking-wider mt-1 uppercase">
            Chip & Contactless Slot
          </span>
        </div>

        {/* View Receipt Popover Button (if receipt available) */}
        {printedReceipt && (
          <button
            onClick={() => setShowReceiptOverlay(true)}
            className="mt-2 w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-slate-200 text-[10px] font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400"/>
            <span>View Charge Slip Receipt ({printedReceipt.errorCode})</span>
          </button>
        )}
      </div>

      {/* 2. ERROR INJECTION CONTROLS PANEL */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-pine-surface/90 border border-pine-border rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-pine-border pb-2.5">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400"/>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                POS Error Simulator
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Select & Test</span>
          </div>

          {/* Group 1: Bank TID Deactivation Errors */}
          <div>
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">
              1. Acquiring Bank TID Issues
            </div>
            <div className="space-y-1">
              {MASTER_ERROR_RECORDS.filter(e => e.type === ERROR_TYPES.ACQUIRING_BANK).map((err) => (
                <button
                  key={err.id}
                  onClick={() => setSelectedError(err)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex justify-between items-center border cursor-pointer ${
                    selectedError.id === err.id
                      ? "bg-rose-950/60 border-rose-500 text-rose-300 font-bold"
                      : "bg-pine-card/60 border-pine-border text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <span>{err.errorIssue}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500"/>
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: Customer Card / Issuer Limits */}
          <div>
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 pt-1">
              2. Customer Card / Issuer Limits
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {MASTER_ERROR_RECORDS.filter(e => e.type === ERROR_TYPES.CUSTOMER_ISSUER).slice(0, 4).map((err) => (
                <button
                  key={err.id}
                  onClick={() => setSelectedError(err)}
                  className={`text-left px-2 py-1.5 rounded-lg text-[10px] font-mono transition border truncate cursor-pointer ${
                    selectedError.id === err.id
                      ? "bg-amber-950/60 border-amber-500 text-amber-300 font-bold"
                      : "bg-pine-card/60 border-pine-border text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {err.errorIssue}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Transaction Button */}
          <button
            onClick={handleReset}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 transition cursor-pointer"
          >
            ✓ Reset to Clean State
          </button>
        </div>
      </div>

      {/* 3. RECEIPT OVERLAY MODAL (Avoids Vertical Stretching) */}
      {showReceiptOverlay && printedReceipt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs my-auto bg-[#FFFDF7] text-zinc-900 font-mono text-[10px] p-5 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto border border-zinc-300">
            <button
              onClick={() => setShowReceiptOverlay(false)}
              className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4"/>
            </button>

            <div className="text-center pb-2 border-b border-dashed border-zinc-400">
              <div className="font-extrabold text-xs text-[#00843D] uppercase">PINE LABS PLUTUS</div>
              <div className="text-[9px] text-zinc-600">Merchant Charge Slip</div>
              <div className="font-bold mt-1">{printedReceipt.storeName}</div>
            </div>

            <div className="py-2.5 space-y-1 border-b border-dashed border-zinc-400 text-zinc-700">
              <div className="flex justify-between"><span>DATE:</span><span>{printedReceipt.date}</span></div>
              <div className="flex justify-between"><span>POS ID:</span><span>{printedReceipt.posId}</span></div>
              <div className="flex justify-between"><span>TID:</span><span>{printedReceipt.tid}</span></div>
              <div className="flex justify-between"><span>RRN:</span><span>{printedReceipt.rrn}</span></div>
              <div className="flex justify-between"><span>METHOD:</span><span>{printedReceipt.method}</span></div>
            </div>

            <div className="py-3 text-center">
              <div className="text-xs font-bold">TOTAL: INR {printedReceipt.amount}</div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-red-700 bg-red-100 border border-red-300">
                {printedReceipt.status}: {printedReceipt.errorCode}
              </div>
            </div>

            <div className="text-center text-[8px] text-zinc-500 pt-2 border-t border-dashed border-zinc-400">
              *** CARDHOLDER COPY ***
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
