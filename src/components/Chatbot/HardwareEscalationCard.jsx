import React from 'react';
import { Wrench } from 'lucide-react';
import { BANK_ESCALATION_DIRECTORY } from '../../data/bankContacts';

export default function HardwareEscalationCard({ sopRule }) {
  const pineContacts = BANK_ESCALATION_DIRECTORY["Pine Labs Internal"];

  return (
    <div className="mt-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-purple-400"/>
          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wide">
            Escalation to Pine Labs Plutus Desk
          </h4>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Internal Ticket (HITL &lt; 88%)
        </span>
      </div>

      <p className="text-xs text-slate-300">{sopRule?.explanation || "Requires internal Pine Labs technical operations intervention."}</p>

      <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-400">Plutus Desk Priority Line:</span>
          <div className="font-mono text-emerald-400 font-bold mt-0.5">{pineContacts.supportPhone}</div>
          <div className="text-[9px] text-slate-500">Toll-Free: {pineContacts.tollFree}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400">L2 TechOps Email:</span>
          <div className="font-mono text-sky-400 text-[11px] truncate mt-0.5">{pineContacts.supportEmail}</div>
          <div className="text-[9px] text-slate-500">Lead: {pineContacts.leadContact}</div>
        </div>
      </div>
    </div>
  );
}
