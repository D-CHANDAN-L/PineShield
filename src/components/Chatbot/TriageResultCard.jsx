import React, { useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { sendAutomatedWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { useMerchant } from '../../context/MerchantContext';
import { BANK_DIRECTORY } from '../../data/bankDirectory';

export default function TriageResultCard({
  msg = {},
  currentProfile = {},
  customPhoneNumber,
  onResendAlert,
  onNavigateToWhatsApp
}) {
  const { gatewayMode } = useMerchant();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const targetPhone = customPhoneNumber || currentProfile.managerPhone;
  const acquirerKey = currentProfile?.acquirer || "HDFC Bank";
  const defaultBank = BANK_DIRECTORY[acquirerKey] || BANK_DIRECTORY["HDFC Bank"] || {};

  const errorRecord = msg.errorRecord || {};
  const errorIssueName = msg.errorIssue || errorRecord.errorIssue || errorRecord.errorIdentified || "POS Issue";
  const contactName = msg.contactName || msg.deflectionTarget || errorRecord.contactName || defaultBank.bankName || "HDFC Bank Merchant Helpdesk";
  
  const rawPhone = msg.phone || msg.bankPhone || msg.bankDetails?.phone || msg.bankDetails?.tollFree || errorRecord.phone || defaultBank.phone;
  let phoneList = [];
  if (Array.isArray(rawPhone)) {
    phoneList = rawPhone.map(p => String(p).trim()).filter(Boolean);
  } else if (typeof rawPhone === 'string') {
    phoneList = rawPhone.split(/\s*[\/\n]\s*/).map(p => p.trim()).filter(Boolean);
  }

  const bankEmail = msg.email || msg.bankEmail || msg.bankDetails?.email || errorRecord.email || defaultBank.email || "pos.helpdesk@hdfc.bank.in";
  const reasonText = msg.reasonOfOccurrence || errorRecord.reasonOfOccurrence || "TID deactivated on acquiring switch";
  const solutionText = msg.solution || errorRecord.solution || "Merchant should contact Acquiring bank";
  const caseRef = msg.ticketRef || errorRecord.ticketRef || `PL-AUTO-${Math.floor(10000 + Math.random() * 90000)}`;

  const noContactNeeded = Boolean(msg.noContactNeeded || errorRecord.noContactNeeded || errorIssueName.toLowerCase().includes("inoperative"));
  const requiresRetryFirst = Boolean(msg.requiresRetryFirst || errorRecord.requiresRetryFirst || errorIssueName.toLowerCase().includes("call help re") || errorIssueName.toLowerCase().includes("key exchange"));

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      if (onResendAlert) {
        await onResendAlert(msg);
      } else {
        const text = msg.realWhatsAppText || formatWhatsAppMessage({
          storeName: currentProfile.storeName,
          posId: currentProfile.posId,
          errorIssue: errorIssueName,
          reasonOfOccurrence: reasonText,
          solution: solutionText,
          deflectionTarget: contactName,
          phone: phoneList,
          email: bankEmail,
          caseId: caseRef,
          noContactNeeded,
          requiresRetryFirst
        });

        await sendAutomatedWhatsApp({
          to: targetPhone,
          message: text,
          gateway: gatewayMode,
          metadata: {
            storeName: currentProfile.storeName,
            posId: currentProfile.posId,
            errorIssue: errorIssueName,
            caseRef: caseRef
          }
        });
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      console.warn("Resend notification error:", err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-100 font-sans">
      {/* Intro Line */}
      <div>
        Got it — here's what's happening with <strong className="text-slate-900 dark:text-white font-bold">{errorIssueName}</strong>:
      </div>

      {/* What's Wrong */}
      <div>
        <span className="font-bold text-slate-900 dark:text-white">What's wrong: </span>
        <span>{reasonText}</span>
      </div>

      {/* What To Do */}
      <div>
        <span className="font-bold text-slate-900 dark:text-white">What to do: </span>
        <span className="whitespace-pre-line">{solutionText}</span>
      </div>

      {/* Conditional Resolution Advice */}
      {noContactNeeded ? (
        <div className="text-slate-700 dark:text-slate-300 font-medium">
          No action needed — this resolves automatically.
        </div>
      ) : requiresRetryFirst ? (
        <div className="text-slate-700 dark:text-slate-300 font-medium">
          Try the transaction again with a different card first.
        </div>
      ) : (
        <div className="space-y-1 pt-1">
          <div className="font-bold text-slate-900 dark:text-white">
            Contact {contactName}:
          </div>
          {phoneList.map((num, idx) => {
            const cleanNum = String(num).replace(/[^0-9+]/g, '');
            return (
              <div key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="select-none">📞</span>
                <a href={`tel:${cleanNum}`} className="text-sky-600 dark:text-sky-400 hover:underline font-mono">
                  {num}
                </a>
              </div>
            );
          })}
          {bankEmail && (
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="select-none">✉️</span>
              <a href={`mailto:${bankEmail}`} className="text-sky-600 dark:text-sky-400 hover:underline font-mono">
                {bankEmail}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Action Footer: Maximum two simple buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onNavigateToWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer"
          title="View alert message in Store WhatsApp"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Message sent to Store WhatsApp ✓</span>
        </button>

        <button
          type="button"
          id="btn-resend-alert"
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition cursor-pointer disabled:opacity-50 active:scale-95"
          title="Resend notification message"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          <span>{isResending ? 'Sending...' : resendSuccess ? 'Sent ✓' : 'Resend'}</span>
        </button>
      </div>
    </div>
  );
}
