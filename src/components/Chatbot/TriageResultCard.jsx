import React, { useState } from 'react';
import { 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  PhoneCall, 
  RefreshCw, 
  Wrench, 
  Mail, 
  Zap,
  SlidersHorizontal,
  Send,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { sendAutomatedWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { useMerchant } from '../../context/MerchantContext';

export default function TriageResultCard({
  msg,
  isNonAgg,
  currentProfile,
  customPhoneNumber,
  createdTicketsMap,
  copiedKey,
  resentMessageId,
  onCopyText,
  onResendAlert,
  onCreateTicket,
  onCallModal,
  onEmailModal,
  onDiagnoseAnother,
  onNavigateToWhatsApp
}) {
  const { setIsPhoneModalOpen, gatewayMode } = useMerchant();
  const [isApiDispatching, setIsApiDispatching] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(false);

  const targetPhone = customPhoneNumber || currentProfile.managerPhone;
  const errorIssueName = msg.errorIssue || msg.errorRecord?.errorIssue || msg.errorRecord?.errorIdentified || "POS Issue";
  const contactName = msg.contactName || msg.deflectionTarget || "HDFC Bank Merchant Helpdesk";
  const bankPhone = msg.phone || msg.bankPhone || msg.bankDetails?.tollFree || msg.bankDetails?.phone || "1800 202 6161 / 1860 267 6161 / 1800 258 3838";
  const bankEmail = msg.email || msg.bankEmail || msg.bankDetails?.email || "pos.helpdesk@hdfc.bank.in";
  const reasonText = msg.reasonOfOccurrence || msg.errorRecord?.reasonOfOccurrence || "Diagnostic exception flagged on payment switch.";
  const solutionText = msg.solution || msg.errorRecord?.solution || "Contact acquiring bank to reactivate terminal.";
  const caseRef = msg.ticketRef || `PL-AUTO-${Math.floor(10000 + Math.random() * 90000)}`;

  const formattedText = msg.realWhatsAppText || formatWhatsAppMessage({
    storeName: currentProfile.storeName,
    posId: currentProfile.posId,
    errorIssue: errorIssueName,
    reasonOfOccurrence: reasonText,
    solution: solutionText,
    deflectionTarget: contactName,
    bankTollFree: bankPhone,
    bankEmail: bankEmail,
    caseId: caseRef
  });

  const handleAutomatedDispatch = async () => {
    setIsApiDispatching(true);
    setApiSuccess(false);
    try {
      await sendAutomatedWhatsApp({
        to: targetPhone,
        message: formattedText,
        gateway: gatewayMode,
        metadata: {
          storeName: currentProfile.storeName,
          posId: currentProfile.posId,
          errorIssue: errorIssueName,
          caseRef: caseRef
        }
      });
      setApiSuccess(true);
      setTimeout(() => setApiSuccess(false), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsApiDispatching(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Diagnostic Header (Zero Jargon) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                Pine Labs Autonomous Triage Record
              </span>
              {msg.isGemini || msg.engine?.includes("gemini") ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Gemini 3.8 Flash Grounded
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ⚡ Local Fast-Path (&lt;5ms)
                </span>
              )}
            </div>
            <h3 className="font-mono font-black text-lg text-slate-900 dark:text-white">
              {errorIssueName}
            </h3>
          </div>
        </div>

        {/* Clean Store & POS Context Badge (Replaced logic/architecture badges) */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
          <span className="px-3 py-1 rounded-full text-[10.5px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            {currentProfile.storeName} • POS #{currentProfile.posId}
          </span>
        </div>
      </div>

      {/* 1. PROBLEM SECTION */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-[10px] uppercase font-bold text-rose-500 flex items-center gap-1.5 tracking-wider">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>📌 1. PROBLEM</span>
        </div>
        <div className="pl-5 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Error Code:</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
              {errorIssueName}
            </span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="text-slate-500 dark:text-slate-400">Cause: </span>
            <span className="font-semibold text-rose-600 dark:text-rose-300">
              {reasonText}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SOLUTION SECTION */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1.5 tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>🛠️ 2. SOLUTION</span>
        </div>
        <div className="pl-5 text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
          {solutionText}
        </div>
      </div>

      {/* 3. WHOM TO CONTACT SECTION */}
      <div className="bg-slate-50/80 dark:bg-[#0B0F17] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sky-500 dark:text-sky-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-sky-500" />
            <span>📞 3. WHOM TO CONTACT</span>
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-xs">
            {contactName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
          {/* Toll-Free Phone */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">Toll-Free Phone</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {bankPhone}
              </span>
            </div>
            <button
              onClick={() => onCopyText(bankPhone, "contact-tf")}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              title="Copy number"
            >
              {copiedKey === "contact-tf" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Support Email */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="min-w-0 pr-1">
              <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">Support Email</span>
              <span className="font-bold text-sky-600 dark:text-sky-400 text-xs truncate block">
                {bankEmail}
              </span>
            </div>
            <button
              onClick={() => onCopyText(bankEmail, "contact-email")}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              title="Copy email"
            >
              {copiedKey === "contact-email" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Internal Ticket Confirmation if Active */}
      {(msg.ticketRef || createdTicketsMap[msg.id]) && (
        <div className="p-3 bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-400 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 font-mono flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Internal Ticket #{msg.ticketRef || createdTicketsMap[msg.id]?.ticketId} Logged & Tracked</span>
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans">TechOps ETA: 15 mins</span>
        </div>
      )}

      {/* Fully Automated Background WhatsApp Dispatch Banner */}
      <div className="bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-inner">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
            <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
            <span>✓ Solution auto-dispatched to Store Manager WhatsApp ({targetPhone})</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 font-extrabold uppercase">
              POST /api/send-whatsapp
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Resolution payload dispatched automatically in the background via API bridge with Web Audio chime (zero manual clicks required).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsPhoneModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Configure Gateway (Twilio / Green-API / UltraMsg / Dev)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Gateway Config</span>
          </button>

          <button
            id="btn-re-dispatch-api"
            onClick={handleAutomatedDispatch}
            disabled={isApiDispatching}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
            title="Re-dispatch automated alert via background API"
          >
            {isApiDispatching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : apiSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Dispatched via API!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>⚡ Re-Dispatch API</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inter-Screen Deep Routing: View Alert in WhatsApp */}
      {onNavigateToWhatsApp && (
        <button
          id="btn-goto-whatsapp"
          onClick={onNavigateToWhatsApp}
          className="w-full py-2.5 bg-[#202C33] hover:bg-[#2A3942] border border-[#2A3942] text-[#00A884] hover:text-[#25D366] font-semibold text-xs rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-98"
        >
          <span>💬 View Alert in Store WhatsApp</span>
          <span className="bg-[#00A884]/20 text-[#00A884] px-1.5 py-0.5 rounded text-[10px] font-bold">1</span>
          <span>→</span>
        </button>
      )}

      {/* Action Sub-Options Buttons */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">
          Immediate Action Sub-Options:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Automated API Background Re-trigger */}
          <button
            onClick={handleAutomatedDispatch}
            disabled={isApiDispatching}
            className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-98"
            title="Dispatch alert payload via POST /api/send-whatsapp"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isApiDispatching ? "Calling API..." : apiSuccess ? "✓ Dispatched via API!" : `⚡ Auto-Dispatch API to ${targetPhone}`}</span>
          </button>

          {/* Action: Direct Dial Helpdesk */}
          <button
            onClick={() => onCallModal({
              bankName: contactName,
              phoneNumber: bankPhone
            })}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-98"
          >
            <PhoneCall className="w-3.5 h-3.5 text-sky-500" />
            <span>📞 Direct Dial Helpdesk</span>
          </button>

          {/* Action: View Pre-Filled Email */}
          <button
            onClick={() => onEmailModal(msg)}
            className="py-2.5 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer border border-sky-200 dark:border-sky-800 active:scale-98"
          >
            <Mail className="w-3.5 h-3.5 text-sky-500" />
            <span>✉️ View Pre-Filled Email</span>
          </button>

          {/* Action: Re-send WhatsApp Alert */}
          <button
            onClick={() => onResendAlert(msg)}
            className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer border border-emerald-200 dark:border-emerald-800 active:scale-98"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>{resentMessageId === msg.id ? "✓ Alert Re-sent with Chime!" : "📲 Re-send Simulator Alert"}</span>
          </button>

          {/* Action: Diagnose Another Error */}
          <button
            onClick={onDiagnoseAnother}
            className="col-span-1 sm:col-span-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>🔄 Diagnose Another Error</span>
          </button>
        </div>
      </div>
    </div>
  );
}
