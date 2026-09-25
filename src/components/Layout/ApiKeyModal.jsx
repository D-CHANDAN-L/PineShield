import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ShieldCheck, X, Server, Lock } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose }) {
  const cardRef = useRef(null);

  useGSAP(() => {
    if (isOpen && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: -8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div ref={cardRef} className="relative w-full max-w-md my-auto bg-[#161D2B] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4"/> Gemini AI — Secured
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 mb-1">API Key is securely configured</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Gemini API key is stored as a <span className="text-emerald-400 font-mono">server-side environment variable</span>.
              It never reaches your browser — no one can read it from DevTools or the page source.
            </p>
          </div>

          <div className="w-full bg-[#0B0F17] border border-slate-700/60 rounded-xl p-3 flex items-start gap-3 text-left">
            <Server className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              All AI requests are routed through <span className="text-sky-300 font-medium">/api/gemini</span> — a Vercel serverless function that calls Google on the server and returns only the result to the UI.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}

