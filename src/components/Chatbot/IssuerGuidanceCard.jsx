import React from 'react';
import { CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function IssuerGuidanceCard({ sopRule }) {
  return (
    <div className="mt-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center space-x-2 border-b border-amber-500/20 pb-2">
        <CreditCard className="w-4 h-4 text-amber-400"/>
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
          Customer Card / Issuer Constraint
        </h4>
      </div>

      <div className="text-xs text-slate-300 space-y-2">
        <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"/>
          <div>
            <strong className="text-emerald-300">Terminal & Pine Labs Gateway Status:</strong>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Machine is completely operational. DO NOT restart the terminal, cancel batches, or request a hardware swap.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"/>
          <div>
            <strong className="text-amber-300">Cashier Counter Script:</strong>
            <p className="text-[11px] text-slate-300 mt-0.5 italic">
              "Sir/Madam, your issuing bank declined this authorization (Response: {sopRule?.code || 'Declined'}). Please verify international/POS usage in your banking app, or we can complete your payment via UPI QR or another card."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
