import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ReceiptPrinter({ receipt, onClose }) {
  const receiptRef = useRef(null);

  useEffect(() => {
    if (receipt && receiptRef.current) {
      // Animate paper feeding out from the terminal printer slot
      gsap.fromTo(
        receiptRef.current,
        { y: 80, opacity: 0, scaleY: 0.2 },
        { y: 0, opacity: 1, scaleY: 1, duration: 0.85, ease: "power3.out" }
      );
    }
  }, [receipt]);

  if (!receipt) return null;

  const isFailed = receipt.status?.includes("FAILED");

  return (
    <div className="relative flex flex-col items-center">
      {/* Printer Bezel Slot */}
      <div className="w-64 h-3 bg-zinc-950 rounded-t-sm border-t-2 border-zinc-800 shadow-inner flex justify-center items-center">
        <div className="w-56 h-0.5 bg-zinc-900 rounded-full" />
      </div>

      {/* Animated Thermal Paper Slip */}
      <div
        ref={receiptRef}
        className="w-64 bg-[#FFFDF7] text-zinc-900 font-mono text-[10px] p-4 shadow-2xl rounded-b-sm border-x border-b border-zinc-300 transform-gpu origin-top"
        style={{
          backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
          backgroundSize: "8px 8px"
        }}
      >
        {/* Tear Off Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-800 transition"
          title="Tear off receipt"
        >
          <X className="w-3.5 h-3.5"/>
        </button>

        {/* Receipt Header */}
        <div className="text-center pb-2 border-b border-dashed border-zinc-400">
          <div className="font-bold text-xs tracking-wider text-emerald-800 uppercase">
            PINE LABS PLUTUS
          </div>
          <div className="text-[9px] text-zinc-600">Merchant Payment Gateway</div>
          <div className="font-semibold mt-1 text-zinc-900">{receipt.merchantName}</div>
          <div className="text-[8px] text-zinc-500 leading-tight">{receipt.storeName}</div>
        </div>

        {/* Transaction Metadata */}
        <div className="py-2 space-y-0.5 border-b border-dashed border-zinc-400 text-zinc-700">
          <div className="flex justify-between">
            <span>DATE / TIME:</span>
            <span className="font-semibold">{receipt.date}</span>
          </div>
          <div className="flex justify-between">
            <span>POS ID:</span>
            <span className="font-semibold">{receipt.posId}</span>
          </div>
          <div className="flex justify-between">
            <span>TERMINAL ID:</span>
            <span className="font-semibold">{receipt.tid}</span>
          </div>
          <div className="flex justify-between">
            <span>RRN:</span>
            <span className="font-semibold">{receipt.rrn}</span>
          </div>
          <div className="flex justify-between">
            <span>METHOD:</span>
            <span>{receipt.method}</span>
          </div>
          <div className="flex justify-between">
            <span>CARD NO:</span>
            <span>**** **** **** 4112</span>
          </div>
        </div>

        {/* Financials & Status */}
        <div className="py-2.5 text-center">
          <div className="text-[11px] font-bold text-zinc-800">
            TOTAL AMOUNT: INR {receipt.amount}
          </div>

          <div className="mt-2 flex items-center justify-center gap-1">
            {isFailed ? (
              <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[9px] border border-red-300">
                <AlertTriangle className="w-2.5 h-2.5"/>
                {receipt.status}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[9px] border border-emerald-300">
                <CheckCircle2 className="w-2.5 h-2.5"/>
                {receipt.status}
              </span>
            )}
          </div>

          {isFailed && (
            <div className="mt-1.5 p-1 bg-zinc-100 rounded border border-zinc-300 text-[8px] text-zinc-600 leading-tight">
              <div>RESPONSE: <span className="font-bold text-red-600">{receipt.errorCode}</span></div>
              <div className="text-[7.5px] text-zinc-500">REF: {receipt.responseCode}</div>
            </div>
          )}
        </div>

        {/* Receipt Footer */}
        <div className="pt-2 border-t border-dashed border-zinc-400 text-center text-[7.5px] text-zinc-500 leading-tight">
          *** PIN VERIFIED TRANSACTION ***<br />
          THANK YOU FOR SHOPPING WITH US<br />
          POWERED BY PINELABS.COM
        </div>

        {/* Jagged Bottom Paper Edge */}
        <div className="absolute -bottom-1 left-0 right-0 h-1.5 overflow-hidden flex">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-[#FFFDF7] transform rotate-45 -translate-y-2 border-r border-b border-zinc-300 flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
