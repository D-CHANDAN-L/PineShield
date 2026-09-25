import React, { useState } from 'react';
import { PhoneCall, Mail, MessageSquare, Check } from 'lucide-react';
import EmailDraftModal from './EmailDraftModal';
import { useMerchant } from '../../context/MerchantContext';

export default function DeflectionCard({ sopRule, bankDetails, posData, storeData }) {
  const { dispatchWhatsAppAlert } = useMerchant();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [waDispatched, setWaDispatched] = useState(false);
  const [callSimulated, setCallSimulated] = useState(false);

  const handleWhatsAppDispatch = () => {
    dispatchWhatsAppAlert(sopRule, bankDetails);
    setWaDispatched(true);
    setTimeout(() => setWaDispatched(false), 3000);
  };

  const handleSimulateCall = () => {
    setCallSimulated(true);
    setTimeout(() => setCallSimulated(false), 2500);
  };

  return (
    <div className="mt-3 bg-gradient-to-br from-rose-950/40 via-pine-card to-slate-900 border border-rose-500/40 rounded-2xl p-4 shadow-xl space-y-3.5">
      {/* Deflection Header */}
      <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
            100% Zero-Touch Deflection Triggered
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Non-Aggregator TID
        </span>
      </div>

      {/* Explanation Quote */}
      <p className="text-xs text-slate-300 leading-relaxed">
        Terminal ID <span className="font-mono font-bold text-amber-300">{posData?.subsystems?.[0]?.tid || 'TID_9910'}</span> is owned directly by <strong className="text-white">{bankDetails?.acquirerName || 'Acquiring Bank'}</strong>. 
        Pine Labs cannot unblock bank-deactivated TIDs. Please execute the bank resolution actions below:
      </p>

      {/* Primary Contacts Action Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Call Desk */}
        <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Merchant Helpdesk Phone</span>
            <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
              {bankDetails?.supportDeskPhone || '1800 202 6161'}
            </div>
            <div className="text-[10px] text-slate-500">Alt: {bankDetails?.alternatePhone || '1800 258 3838'}</div>
          </div>
          <button
            onClick={handleSimulateCall}
            className="mt-2 w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition flex items-center justify-center space-x-1"
          >
            <PhoneCall className="w-3 h-3"/>
            <span>{callSimulated ? "Connecting to Desk..." : "Simulate Direct Dial"}</span>
          </button>
        </div>

        {/* Email Desk */}
        <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Dedicated Bank SPOC Email</span>
            <div className="font-mono text-xs font-bold text-sky-400 truncate mt-0.5">
              {bankDetails?.emailL1 || 'pos.helpdesk@hdfc.bank.in'}
            </div>
            <div className="text-[10px] text-slate-500">Escalation TAT: ~{bankDetails?.tatHours || 24}h</div>
          </div>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="mt-2 w-full py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-semibold transition flex items-center justify-center space-x-1"
          >
            <Mail className="w-3 h-3"/>
            <span>View Pre-Filled Email Draft</span>
          </button>
        </div>
      </div>

      {/* Omnichannel Dispatch Button */}
      <button
        onClick={handleWhatsAppDispatch}
        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition flex items-center justify-center space-x-2"
      >
        {waDispatched ? <Check className="w-4 h-4"/> : <MessageSquare className="w-4 h-4"/>}
        <span>{waDispatched ? "Alert Dispatched to Store Manager!" : "Dispatch Store Alert via WhatsApp"}</span>
      </button>

      {/* Email Modal */}
      <EmailDraftModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        bankDetails={bankDetails}
        posData={posData}
        storeData={storeData}
        errorCode={sopRule?.code}
      />
    </div>
  );
}
