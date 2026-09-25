import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff, Mic, Volume2, ShieldCheck, User } from 'lucide-react';

export default function CallSimulatorModal({ isOpen, onClose, bankName, phoneNumber, storeData }) {
  const [seconds, setSeconds] = useState(0);
  const [callState, setCallState] = useState('ringing'); // ringing, connected, ended

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      setCallState('ringing');
      return;
    }

    const connectTimeout = setTimeout(() => {
      setCallState('connected');
    }, 2200);

    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm my-auto bg-[#111B21] border border-[#222E35] rounded-2xl p-6 text-center text-white shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Caller Info */}
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Phone className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#E9EDEF]">
              {bankName || "Acquiring Bank Helpdesk"}
            </h3>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">
              {phoneNumber || "1800 202 6161"}
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#8696A0]">
            {callState === 'ringing' ? (
              <span className="text-amber-400 animate-pulse">Dialing Bank IVR Desk...</span>
            ) : (
              <span className="text-emerald-400">Connected ({formatTimer(seconds)})</span>
            )}
          </div>
        </div>

        {/* Store Context Box */}
        <div className="bg-[#202C33] p-3 rounded-2xl border border-[#2A3942] text-left text-xs space-y-1 font-mono">
          <div className="text-[10px] uppercase font-bold text-[#8696A0] font-sans">
            Store Manager Terminal Line:
          </div>
          <div className="text-slate-200">
            <strong>Caller:</strong> {storeData?.managerName} ({storeData?.managerPhone})
          </div>
          <div className="text-slate-200">
            <strong>Outlet:</strong> {storeData?.storeName}
          </div>
          <div className="text-[10px] text-emerald-400 pt-1 border-t border-[#2A3942]">
            Priority Route: TID Escalation Direct Desk
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center items-center space-x-6">
          <button className="w-10 h-10 rounded-full bg-[#202C33] text-[#AEBAC1] flex items-center justify-center hover:text-white transition">
            <Mic className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button className="w-10 h-10 rounded-full bg-[#202C33] text-[#AEBAC1] flex items-center justify-center hover:text-white transition">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
