import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Copy, Check, X } from 'lucide-react';

export default function EmailDraftModal({ isOpen, onClose, errorIssue, bankDetails, posData, storeData, customDraft }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const recipientEmail = customDraft?.to || bankDetails?.email || 'pos.helpdesk@hdfc.bank.in';
  const subject = customDraft?.subject || `Urgent: TID Re-activation Required_${posData?.subsystems?.[0]?.tid || posData?.tid || 'TID'}_${storeData?.storeName || 'Store'}`;
  const emailBody = customDraft?.body || `Dear Merchant Services Desk (${bankDetails?.bankName || 'Acquiring Bank'}),

Our POS terminal has failed with error: "${errorIssue}".
As per Pine Labs Acquiring Architecture guidelines, this terminal is operating under a Non-Aggregator configuration directly provisioned and controlled by ${bankDetails?.bankName || 'the acquiring bank'}.

MERCHANT & TERMINAL DETAILS:
• Merchant Outlet: ${storeData?.storeName || 'N/A'}
• Store City: ${storeData?.city || 'N/A'}
• Store Manager: ${storeData?.managerName || 'N/A'} (${storeData?.managerPhone || 'N/A'})
• POS ID: ${posData?.posId || 'N/A'}
• Impacted TID: ${posData?.subsystems?.[0]?.tid || posData?.tid || 'N/A'}
• Reported Error: ${errorIssue}

REQUEST:
Please reactivate or re-whitelist this Terminal ID on your acquiring switch to restore card processing.

Regards,
${storeData?.managerName || 'Store Operations'}
Store Operations | Powered by PineShield`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${recipientEmail}\nSubject: ${subject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg my-auto bg-white dark:bg-[#161D2B] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white transition-colors space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-emerald-500"/>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Pre-Filled Bank Escalation Email</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer p-1">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="space-y-1.5 text-[11px] bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
          <div><span className="text-slate-400 font-sans font-bold">To:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{recipientEmail}</span></div>
          <div><span className="text-slate-400 font-sans font-bold">Subject:</span> <span className="text-slate-800 dark:text-slate-200">{subject}</span></div>
        </div>

        <textarea
          readOnly
          value={emailBody}
          rows={9}
          className="w-full bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-[11px] text-slate-700 dark:text-slate-300 font-mono resize-none focus:outline-none leading-relaxed"
        />

        <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium">
            Close
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 rounded-xl bg-pine hover:bg-pine-hover text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
            <span>{copied ? "Copied to Clipboard!" : "Copy Email"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
