import React from 'react';
import { Wifi, BatteryMedium, Signal, CreditCard, QrCode, Wallet, ShoppingBag, CheckCircle, RefreshCcw } from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';

export default function TerminalDisplay({ onProcess, onReset }) {
  const {
    terminalAmount,
    setTerminalAmount,
    terminalPaymentMethod,
    setTerminalPaymentMethod,
    terminalStatus,
    activeSimulatedError,
    printedReceipt,
    currentPos
  } = useMerchant();

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full h-full bg-white text-slate-800 flex flex-col justify-between overflow-hidden select-none font-sans rounded-b-2xl">
      {/* 1. Android Status Bar */}
      <div className="bg-[#00843D] text-white px-3 py-1 flex justify-between items-center text-[10px] font-semibold flex-shrink-0">
        <span className="tracking-tight">Pine Labs Plutus</span>
        <span className="font-mono text-[9px]">{currentTime}</span>
        <div className="flex items-center space-x-1.5">
          <Signal className="w-2.5 h-2.5"/>
          <Wifi className="w-2.5 h-2.5"/>
          <BatteryMedium className="w-3 h-3"/>
        </div>
      </div>

      {/* 2. Main Screen Area (Strict Fixed Geometry) */}
      <div className="flex-1 flex flex-col p-3 justify-center items-center overflow-hidden">
        {/* IDLE SCREEN */}
        {terminalStatus === "IDLE" && (
          <div className="w-full flex flex-col items-center space-y-3">
            <div className="text-center w-full">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sale Amount</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 flex items-center justify-center space-x-1 shadow-inner mt-1">
                <span className="text-slate-400 text-xs font-semibold">₹</span>
                <input
                  type="text"
                  value={terminalAmount}
                  onChange={(e) => setTerminalAmount(e.target.value)}
                  className="text-2xl font-bold font-mono text-slate-900 bg-transparent text-center focus:outline-none w-32"
                />
              </div>
            </div>

            <div className="w-full">
              <div className="text-[10px] font-bold text-slate-500 mb-1 text-center uppercase tracking-wider">
                Select Payment Mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "UPI", label: "UPI", sublabel: "Dynamic QR", icon: QrCode },
                  { id: "Cards", label: "Cards", sublabel: "Domestic / Amex CC", icon: CreditCard },
                  { id: "Wallets", label: "Wallets", sublabel: "Amazon Pay, Sodexo", icon: Wallet },
                  { id: "EMIs", label: "EMIs", sublabel: "Brand Affordability", icon: ShoppingBag }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = terminalPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      id={`pay-mode-${m.id.toLowerCase()}`}
                      onClick={() => setTerminalPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-[#00A859] text-[#00843D] shadow-sm ring-2 ring-[#00A859]/30"
                          : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-0.5 text-[#00A859]"/>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">{m.label}</span>
                      <span className="text-[8.5px] text-slate-500 truncate max-w-[110px]">{m.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING SCREEN */}
        {terminalStatus === "PROCESSING" && (
          <div className="flex flex-col items-center space-y-3 py-6">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#00A859] animate-spin" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-800">Processing Payment...</div>
              <div className="text-[11px] text-slate-500 mt-1">Please insert, swipe, or tap card</div>
            </div>
            <div className="text-[9px] font-mono text-slate-400">Connecting to Host Switch...</div>
          </div>
        )}

        {/* FAILED ERROR SCREEN (Strict Minimalist Presentation per SOP) */}
        {terminalStatus === "FAILED" && (
          <div className="w-full flex flex-col items-center justify-center text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-red-500/40 flex items-center justify-center animate-pulse">
              <span className="text-2xl font-black text-red-600">!</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Transaction Failed
              </div>
              <div className="text-base font-extrabold text-red-600 uppercase font-mono px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                {activeSimulatedError?.errorIssue || "TID NOT PRESENT"}
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {terminalStatus === "SUCCESS" && (
          <div className="w-full flex flex-col items-center justify-center text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500/40 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#00A859]"/>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Payment Approved
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                ₹{terminalAmount}
              </div>
            </div>
            <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
              Auth: {printedReceipt?.rrn ? `AUTH_${printedReceipt.rrn.slice(-6)}` : "AUTH_884910"}
            </div>
          </div>
        )}
      </div>

      {/* 3. Screen Bottom Action Bar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
        {terminalStatus === "IDLE" ? (
          <button
            id="btn-process-payment"
            onClick={onProcess}
            className="w-full py-2.5 bg-[#00A859] hover:bg-[#00843D] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.99]"
          >
            <span>Process ₹{terminalAmount}</span>
          </button>
        ) : (
          <button
            id="btn-reset-terminal"
            onClick={onReset}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.99]"
          >
            <RefreshCcw className="w-3.5 h-3.5"/>
            <span>Reset Terminal</span>
          </button>
        )}
      </div>

      {/* 4. Android Soft Navigation Bar */}
      <div className="bg-slate-900 text-slate-400 py-1 flex justify-around items-center text-[10px] flex-shrink-0">
        <span className="cursor-pointer hover:text-white">◁</span>
        <span className="cursor-pointer hover:text-white">⌂</span>
        <span className="cursor-pointer hover:text-white">▢</span>
      </div>
    </div>
  );
}
