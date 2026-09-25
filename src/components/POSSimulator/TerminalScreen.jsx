import React from 'react';
import { Wifi, BatteryMedium, Signal, CreditCard, QrCode, Wallet, ShoppingBag, XCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';

export default function TerminalScreen({ onStartPayment, onReset }) {
  const {
    terminalAmount,
    setTerminalAmount,
    terminalPaymentMethod,
    setTerminalPaymentMethod,
    terminalStatus,
    activeSimulatedError,
    currentPos
  } = useMerchant();

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full h-[400px] bg-white text-slate-800 flex flex-col justify-between overflow-hidden select-none font-sans rounded-b-2xl">
      {/* 1. Android Status Bar */}
      <div className="bg-[#00843D] text-white px-3 py-1 flex justify-between items-center text-[10px] font-semibold">
        <span className="tracking-tight">Pine Labs Plutus</span>
        <span className="font-mono text-[9px]">{currentTime}</span>
        <div className="flex items-center space-x-1.5">
          <Signal className="w-2.5 h-2.5"/>
          <Wifi className="w-2.5 h-2.5"/>
          <BatteryMedium className="w-3 h-3"/>
        </div>
      </div>

      {/* 2. Main Screen Area */}
      <div className="flex-1 flex flex-col p-3 justify-center items-center">
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
              <div className="text-[10.5px] font-bold text-slate-600 mb-2 text-center">
                Select Payment Method:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "UPI", label: "UPI", icon: QrCode },
                  { id: "Cards", label: "Cards", icon: CreditCard },
                  { id: "Wallets", label: "Wallets", icon: Wallet },
                  { id: "EMIs", label: "EMIs", icon: ShoppingBag }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = terminalPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setTerminalPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-[#00A859] text-[#00843D] shadow-sm ring-1 ring-[#00A859]"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1 text-[#00A859]"/>
                      <span className="text-[11px] font-bold">{m.label}</span>
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
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#00A859] animate-spin" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-800">Processing Payment...</div>
              <div className="text-[11px] text-slate-500 mt-1">Please insert, swipe, or tap card</div>
            </div>
            <div className="text-[9px] font-mono text-slate-400">Connecting to Host Switch...</div>
          </div>
        )}

        {/* FAILED ERROR SCREEN (Only shows Error Issue name!) */}
        {terminalStatus === "FAILED" && (
          <div className="w-full flex flex-col items-center justify-center text-center space-y-3 py-4">
            <XCircle className="w-12 h-12 text-red-500 animate-pulse"/>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Transaction Failed
              </div>
              <div className="text-base font-extrabold text-red-600 mt-1 uppercase font-mono px-2">
                {activeSimulatedError?.errorIssue || "TID NOT PRESENT"}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono">
              POS ID: {currentPos?.posId || "POS_992144"}
            </div>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {terminalStatus === "SUCCESS" && (
          <div className="w-full flex flex-col items-center justify-center text-center space-y-3 py-4">
            <CheckCircle className="w-12 h-12 text-[#00A859]"/>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payment Approved
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                ₹{terminalAmount}
              </div>
            </div>
            <div className="text-[10px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-semibold">
              Auth Code: AUTH_{Math.floor(100000 + Math.random() * 900000)}
            </div>
          </div>
        )}
      </div>

      {/* 3. Screen Bottom Action Bar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50">
        {terminalStatus === "IDLE" ? (
          <button
            onClick={onStartPayment}
            className="w-full py-2.5 bg-[#00A859] hover:bg-[#00843D] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Process ₹{terminalAmount}</span>
          </button>
        ) : (
          <button
            onClick={onReset}
            className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3"/>
            <span>Reset Terminal</span>
          </button>
        )}
      </div>

      {/* 4. Android Soft Navigation Bar */}
      <div className="bg-slate-900 text-slate-400 py-1 flex justify-around items-center text-[10px]">
        <span>◁</span>
        <span>⌂</span>
        <span>▢</span>
      </div>
    </div>
  );
}
