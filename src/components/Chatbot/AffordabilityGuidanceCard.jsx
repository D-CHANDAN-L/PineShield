import React from 'react';
import { ShoppingBag, Barcode } from 'lucide-react';

export default function AffordabilityGuidanceCard({ sopRule }) {
  const isImei = sopRule?.code?.includes("IMEI");

  return (
    <div className="mt-3 bg-sky-950/30 border border-sky-500/30 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center space-x-2 border-b border-sky-500/20 pb-2">
        <ShoppingBag className="w-4 h-4 text-sky-400"/>
        <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wide">
          Brand EMI & Affordability Diagnostic
        </h4>
      </div>

      <div className="text-xs text-slate-300 space-y-2">
        <p>{sopRule?.explanation}</p>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
            <Barcode className="w-3.5 h-3.5"/>
            <span>Resolution Steps:</span>
          </div>
          <p className="text-[11px] text-slate-400">{sopRule?.actionInstructions}</p>
        </div>

        {isImei && (
          <div className="text-[10px] text-slate-400 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
            💡 <strong>Pro-Tip:</strong> Pine Labs communicates live with OEM host servers (Apple/Samsung). If the barcode is scanned from an older model or non-participating serial number, the scheme validation will abort.
          </div>
        )}
      </div>
    </div>
  );
}
