import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose, isOpen = true }) {
  if (!isOpen || !receipt) return null;
  const isFailed = receipt.status.includes("FAILED");

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xs my-auto rounded-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Jagged Top Tear Effect (SVG Sawtooth) */}
        <div className="w-full overflow-hidden leading-none h-3 text-[#FFFDF7]">
          <svg className="w-full h-3 fill-current" preserveAspectRatio="none" viewBox="0 0 240 12">
            <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 Z" />
          </svg>
        </div>

        {/* Thermal Slip Body */}
        <div className="bg-[#FFFDF7] text-zinc-900 font-mono text-[10.5px] p-5 shadow-2xl relative border-x border-zinc-300">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-800 transition rounded-full hover:bg-zinc-200 cursor-pointer"
            title="Close receipt"
          >
            <X className="w-4 h-4"/>
          </button>

          {/* Thermal Slip Header */}
          <div className="text-center pb-2.5 border-b border-dashed border-zinc-400">
            <div className="font-extrabold text-sm text-[#00843D] tracking-tight uppercase">PINE LABS PLUTUS</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-sans mt-0.5">Autonomous POS Charge Slip</div>
            <div className="font-bold text-xs mt-1 text-zinc-900">{receipt.merchantName}</div>
            <div className="text-[9px] text-zinc-500 font-sans">Merchant Acquirer Interface</div>
          </div>

          {/* Transaction Metadata */}
          <div className="py-3 space-y-1.5 border-b border-dashed border-zinc-400 text-zinc-700">
            <div className="flex justify-between">
              <span>DATE/TIME:</span>
              <span className="font-semibold text-zinc-900">{receipt.date}</span>
            </div>
            <div className="flex justify-between">
              <span>POS ID:</span>
              <span className="font-bold text-zinc-900">{receipt.posId}</span>
            </div>
            <div className="flex justify-between">
              <span>TID:</span>
              <span className="font-bold text-zinc-900">{receipt.tid}</span>
            </div>
            <div className="flex justify-between">
              <span>RRN:</span>
              <span className="font-bold text-zinc-900">{receipt.rrn}</span>
            </div>
            <div className="flex justify-between">
              <span>PAY METHOD:</span>
              <span className="font-semibold text-zinc-900">{receipt.method}</span>
            </div>
          </div>

          {/* Amount & Status */}
          <div className="py-3 text-center bg-zinc-100/70 my-2 rounded border border-zinc-200">
            <div className="text-[10px] text-zinc-500 uppercase font-sans font-bold">Total Amount</div>
            <div className="text-base font-bold text-zinc-900">₹{receipt.amount}</div>
            <div className="mt-2 flex items-center justify-center">
              {isFailed ? (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5"/> {receipt.status}: {receipt.errorCode}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5"/> {receipt.status}
                </span>
              )}
            </div>
          </div>

          {/* Cardholder Copy Footer */}
          <div className="text-center text-[8.5px] text-zinc-500 pt-2 border-t border-dashed border-zinc-400 leading-tight space-y-0.5">
            <div>*** MERCHANT AUDIT COPY ***</div>
            <div>VERIFIED VIA PINELABS.COM HOST GATEWAY</div>
            <div className="font-sans text-[8px] text-zinc-400">PIN VERIFIED • SIGNATURE NOT REQUIRED</div>
          </div>
        </div>

        {/* Jagged Bottom Tear Effect (SVG Sawtooth) */}
        <div className="w-full overflow-hidden leading-none h-3 text-[#FFFDF7]">
          <svg className="w-full h-3 fill-current" preserveAspectRatio="none" viewBox="0 0 240 12">
            <path d="M0,0 L10,12 L20,0 L30,12 L40,0 L50,12 L60,0 L70,12 L80,0 L90,12 L100,0 L110,12 L120,0 L130,12 L140,0 L150,12 L160,0 L170,12 L180,0 L190,12 L200,0 L210,12 L220,0 L230,12 L240,0 Z" />
          </svg>
        </div>

        {/* Close Button below modal */}
        <div className="text-center mt-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            Close Charge Slip
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
