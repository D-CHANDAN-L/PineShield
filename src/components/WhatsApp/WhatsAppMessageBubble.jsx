import React, { useState } from 'react';
import { 
  PhoneCall, 
  Mail, 
  CheckCircle2, 
  CheckCheck, 
  Zap, 
  Check, 
  RefreshCw,
  Phone,
  Building2
} from 'lucide-react';
import EmailDraftModal from '../Chatbot/EmailDraftModal';
import CallSimulatorModal from './CallSimulatorModal';
import { BANK_DIRECTORY } from '../../data/bankDirectory';
import { BANK_ESCALATION_DIRECTORY } from '../../data/bankContacts';
import { sendAutomatedWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';

export default function WhatsAppMessageBubble({ 
  alert = {}, 
  store, 
  posData, 
  storeData,
  currentProfile,
  customPhoneNumber,
  isResolved: controlledIsResolved,
  onToggleResolved,
  onCall,
  onCallAlert,
  onOpenEmail,
  onEmailAlert
}) {
  const [internalResolved, setInternalResolved] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isSendingApi, setIsSendingApi] = useState(false);
  const [apiSentSuccess, setApiSentSuccess] = useState(false);

  const isResolved = controlledIsResolved !== undefined ? controlledIsResolved : internalResolved;
  const toggleResolved = onToggleResolved || (() => setInternalResolved(prev => !prev));

  // Safe fallback bank directory lookup
  const safeAlert = alert && typeof alert === 'object' ? alert : {};
  const acquirerKey = typeof safeAlert.acquirer === 'string' ? safeAlert.acquirer : (currentProfile?.acquirer || "HDFC Bank");
  const bankDetails = (BANK_DIRECTORY && BANK_DIRECTORY[acquirerKey])
    || (BANK_ESCALATION_DIRECTORY && BANK_ESCALATION_DIRECTORY[acquirerKey])
    || (BANK_DIRECTORY && BANK_DIRECTORY["HDFC Bank"])
    || (BANK_ESCALATION_DIRECTORY && BANK_ESCALATION_DIRECTORY["HDFC Bank"])
    || {
      bankName: "HDFC Bank Merchant Helpdesk",
      tollFree: "1800 202 6161 / 1860 267 6161 / 1800 258 3838",
      email: "pos.helpdesk@hdfc.bank.in",
      tat: "24 Hours"
    };

  const rawStoreName = safeAlert.storeName || store?.storeName || storeData?.storeName || currentProfile?.storeName || 'Croma Electronics - Indiranagar';
  const storeName = typeof rawStoreName === 'object' ? (rawStoreName?.storeName || 'Croma Electronics - Indiranagar') : String(rawStoreName || 'Croma Electronics - Indiranagar');

  const rawPosId = safeAlert.posId || posData?.posId || currentProfile?.posId || 'POS_992144';
  const posId = typeof rawPosId === 'object' ? (rawPosId?.posId || 'POS_992144') : String(rawPosId || 'POS_992144');

  const rawIssue = safeAlert.errorIssue || safeAlert.errorCode || 'TID NOT PRESENT';
  const errorIssue = typeof rawIssue === 'object' ? (rawIssue?.errorIssue || rawIssue?.name || 'TID NOT PRESENT') : String(rawIssue || 'TID NOT PRESENT');

  const rawReason = safeAlert.reasonOfOccurrence || safeAlert.reason;
  const reasonText = typeof rawReason === 'object'
    ? (rawReason?.reason || JSON.stringify(rawReason))
    : String(rawReason || (errorIssue.toLowerCase().includes('tid') ? 'TID deactivated on acquiring bank switch.' : 'POS diagnostic exception flagged on payment switch.'));

  const rawSolution = safeAlert.solution;
  const solutionText = typeof rawSolution === 'object'
    ? (rawSolution?.solution || JSON.stringify(rawSolution))
    : String(rawSolution || 'Merchant should contact Acquiring bank to reactivate terminal. Pine Labs support cannot unblock bank-owned TIDs.');

  const rawContact = safeAlert.deflectionTarget || safeAlert.targetEntity || safeAlert.contactName || bankDetails?.bankName || "HDFC Bank Merchant Helpdesk";
  const contactName = typeof rawContact === 'object' ? (rawContact?.name || rawContact?.bankName || "HDFC Bank Merchant Helpdesk") : String(rawContact || "HDFC Bank Merchant Helpdesk");

  const rawPhone = safeAlert.bankTollFree || safeAlert.bankPhone || safeAlert.phone || bankDetails?.tollFree || bankDetails?.supportDeskPhone || "1800 202 6161";
  const bankPhone = typeof rawPhone === 'object' ? (rawPhone?.phone || rawPhone?.tollFree || "1800 202 6161") : String(rawPhone || "1800 202 6161");

  const rawEmail = safeAlert.bankEmail || safeAlert.email || bankDetails?.email || bankDetails?.emailL1 || "pos.helpdesk@hdfc.bank.in";
  const bankEmail = typeof rawEmail === 'object' ? (rawEmail?.email || "pos.helpdesk@hdfc.bank.in") : String(rawEmail || "pos.helpdesk@hdfc.bank.in");

  const timestamp = typeof safeAlert.timestamp === 'string' ? safeAlert.timestamp : 'Just now';
  const rawTargetPhone = customPhoneNumber || safeAlert.targetPhone || currentProfile?.managerPhone || '+91 98765 43210';
  const targetPhone = typeof rawTargetPhone === 'string' ? rawTargetPhone : '+91 98765 43210';

  const rawCaseId = safeAlert.ticketRef || safeAlert.caseRef || safeAlert.caseId || `PL-AUTO-${Math.floor(10000 + Math.random() * 90000)}`;
  const caseId = String(rawCaseId || '').replace(/^#+/, '');

  const handleCallAction = () => {
    if (onCall) {
      onCall();
    } else if (onCallAlert) {
      onCallAlert({
        ...alert,
        bankTollFree: bankPhone,
        deflectionTarget: contactName
      });
    } else {
      setShowCallModal(true);
    }
  };

  const handleEmailAction = () => {
    if (onOpenEmail) {
      onOpenEmail();
    } else if (onEmailAlert) {
      onEmailAlert({
        ...alert,
        errorIssue,
        bankEmail,
        bankTollFree: bankPhone,
        deflectionTarget: contactName
      });
    } else {
      setShowEmailModal(true);
    }
  };

  const handleApiReDispatch = async () => {
    setIsSendingApi(true);
    setApiSentSuccess(false);
    try {
      const text = formatWhatsAppMessage({
        storeName,
        posId,
        errorIssue,
        reasonOfOccurrence: reasonText,
        solution: solutionText,
        deflectionTarget: contactName,
        bankTollFree: bankPhone,
        bankEmail,
        caseId
      });
      await sendAutomatedWhatsApp({
        to: targetPhone,
        message: text,
        metadata: {
          storeName,
          posId,
          errorIssue,
          caseRef: caseId
        }
      });
      setApiSentSuccess(true);
      setTimeout(() => setApiSentSuccess(false), 3000);
    } catch (e) {
      console.warn("Re-dispatch error:", e);
    } finally {
      setIsSendingApi(false);
    }
  };

  return (
    <div className={`bg-[#202C33] border rounded-2xl rounded-tl-none p-4 max-w-[92%] sm:max-w-[85%] text-xs text-[#E9EDEF] space-y-3 shadow-md select-text transition-all ${
      isResolved ? "border-emerald-500/50 bg-[#1F2C34]/95" : "border-[#2A3942]"
    }`}>
      {/* Alert Header */}
      <div className="flex justify-between items-center pb-2 border-b border-[#2A3942]">
        <span className="font-bold text-rose-400 text-[12px] flex items-center gap-1.5">
          🚨 Pine Labs POS Alert
        </span>
        <span className="text-[10px] text-[#8696A0] font-mono">Store: {storeName} | POS: {posId}</span>
      </div>

      {/* 1. Problem Section */}
      <div className="bg-[#111B21] p-3 rounded-xl border border-[#222E35] space-y-1">
        <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
          <span>📌 PROBLEM:</span>
        </div>
        <div className="text-[11.5px] text-[#D1D7DB]">
          <span className="text-[#8696A0]">Error: </span>
          <span className="font-mono font-bold text-white">{errorIssue}</span>
        </div>
        <div className="text-[11.5px] text-[#D1D7DB] pt-0.5">
          <span className="text-[#8696A0]">Reason: </span>
          <span className="font-medium text-rose-200">{reasonText}</span>
        </div>
      </div>

      {/* 2. Solution Section */}
      <div className="bg-[#111B21] p-3 rounded-xl border border-[#222E35] space-y-1">
        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
          <span>🛠️ SOLUTION:</span>
        </div>
        <div className="text-[11.5px] font-semibold text-slate-100 leading-snug">
          {solutionText}
        </div>
      </div>

      {/* 3. Whom to Contact Section */}
      <div className="bg-[#182229] p-3 rounded-xl border border-[#222E35] space-y-2">
        <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1">
          <span>📞 WHOM TO CONTACT:</span>
        </div>
        <div className="text-[11.5px] text-slate-300">
          <span className="text-[#8696A0]">Contact: </span>
          <span className="font-bold text-white">{contactName}</span>
        </div>
        <div className="text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-[#222E35]">
          <span className="text-[#8696A0]">Phone:</span>
          <span className="font-mono font-bold text-emerald-400 text-[11.5px]">{bankPhone}</span>
        </div>
        <div className="text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-[#8696A0]">Email:</span>
          <span className="font-mono text-sky-300 select-all text-[11px]">{bankEmail}</span>
        </div>
      </div>

      {/* Quick-Reply Action Buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          onClick={handleCallAction}
          className="flex-1 min-w-[100px] py-1.5 px-2 bg-[#111B21] hover:bg-[#2A3942] border border-[#2A3942] rounded-xl text-[10.5px] font-semibold text-emerald-400 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          title="Direct Dial Bank Helpdesk"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call Desk</span>
        </button>

        {bankEmail && (
          <button
            onClick={handleEmailAction}
            className="flex-1 min-w-[120px] py-1.5 px-2 bg-[#111B21] hover:bg-[#2A3942] border border-[#2A3942] rounded-xl text-[10.5px] font-semibold text-sky-300 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Open Pre-Filled Bank Escalation Email"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Pre-Filled Email</span>
          </button>
        )}

        <button
          onClick={handleApiReDispatch}
          disabled={isSendingApi}
          className="py-1.5 px-2.5 bg-[#111B21] hover:bg-[#2A3942] border border-[#2A3942] rounded-xl text-[10.5px] font-semibold text-emerald-300 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
          title="Trigger background API dispatch via POST /api/send-whatsapp"
        >
          {isSendingApi ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              <span>Sending...</span>
            </>
          ) : apiSentSuccess ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Sent!</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-emerald-400 fill-current" />
              <span>Re-Dispatch</span>
            </>
          )}
        </button>

        <button
          onClick={toggleResolved}
          className={`py-1.5 px-2.5 rounded-xl text-[10.5px] font-semibold transition border flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
            isResolved
              ? "bg-emerald-950/70 border-emerald-500 text-emerald-400"
              : "bg-[#111B21] hover:bg-[#2A3942] border-[#2A3942] text-[#8696A0] hover:text-[#D1D7DB]"
          }`}
          title="Mark this alert as resolved"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{isResolved ? "Resolved ✓" : "Resolve"}</span>
        </button>
      </div>

      {/* Timestamp & Double Blue Ticks */}
      <div className="flex items-center justify-between text-[9px] text-[#8696A0] pt-0.5 border-t border-[#2A3942]/50 font-mono">
        <span>Ref: #{caseId} | Powered by Pine Labs POS Sentinel</span>
        <div className="flex items-center space-x-1">
          <span>{timestamp}</span>
          <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]"/>
        </div>
      </div>

      {/* Standalone fallback modals */}
      {showEmailModal && (
        <EmailDraftModal
          isOpen={true}
          onClose={() => setShowEmailModal(false)}
          bankDetails={{
            bankName: contactName,
            email: bankEmail,
            tollFree: bankPhone
          }}
          posData={{ posId }}
          storeData={{ storeName }}
          errorCode={errorIssue}
          errorIssue={errorIssue}
        />
      )}

      {showCallModal && (
        <CallSimulatorModal
          isOpen={true}
          onClose={() => setShowCallModal(false)}
          bankName={contactName}
          phoneNumber={bankPhone}
          storeData={{ storeName }}
        />
      )}
    </div>
  );
}
