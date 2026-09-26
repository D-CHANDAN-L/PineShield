import React, { useState } from 'react';
import {
  CheckCircle2,
  CheckCheck
} from 'lucide-react';
import { BANK_DIRECTORY } from '../../data/bankDirectory';
import { BANK_ESCALATION_DIRECTORY } from '../../data/bankContacts';

// Safely parse markdown links e.g. [1800 202 6161](tel:18002026161) or plain text into interactive JSX
function renderClickableText(text) {
  if (!text || typeof text !== 'string') return text;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1];
    const target = match[2];
    parts.push(
      <a
        key={match.index}
        href={target}
        className="text-[#53BDEB] hover:underline font-mono"
        target={target.startsWith('http') ? '_blank' : undefined}
        rel={target.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {label}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Extract clean display label and action link for phone items
function parsePhoneItem(item) {
  if (!item) return null;
  const str = String(item).trim();
  const mdMatch = str.match(/\[([^\]]+)\]\((?:tel:)?([^)]+)\)/);
  if (mdMatch) {
    const display = mdMatch[1].trim();
    const cleanTel = mdMatch[2].replace(/[^0-9+]/g, '');
    return { display, href: `tel:${cleanTel}` };
  }
  const cleanTel = str.replace(/[^0-9+]/g, '');
  return { display: str, href: `tel:${cleanTel}` };
}

// Extract clean display label and action link for email items
function parseEmailItem(item) {
  if (!item) return null;
  const str = String(item).trim();
  const mdMatch = str.match(/\[([^\]]+)\]\((?:mailto:)?([^)]+)\)/);
  if (mdMatch) {
    const display = mdMatch[1].trim();
    const mailto = mdMatch[2].trim();
    return { display, href: `mailto:${mailto}` };
  }
  return { display: str, href: `mailto:${str}` };
}

export default function WhatsAppMessageBubble({
  alert = {},
  store,
  posData,
  storeData,
  currentProfile,
  isResolved: controlledIsResolved,
  onToggleResolved
}) {
  const [internalResolved, setInternalResolved] = useState(false);

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
    phone: ["1800 202 6161", "1860 267 6161", "1800 258 3838"],
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
    : String(rawReason || (errorIssue.toLowerCase().includes('tid') ? 'TID deactivated on acquiring switch' : 'POS diagnostic exception flagged on payment switch.'));

  const rawSolution = safeAlert.solution;
  const solutionText = typeof rawSolution === 'object'
    ? (rawSolution?.solution || JSON.stringify(rawSolution))
    : String(rawSolution || 'Merchant should contact Acquiring bank');

  const noContactNeeded = Boolean(safeAlert.noContactNeeded || errorIssue.toLowerCase().includes("inoperative"));
  const requiresRetryFirst = Boolean(safeAlert.requiresRetryFirst || errorIssue.toLowerCase().includes("call help re") || errorIssue.toLowerCase().includes("key exchange"));

  const rawContact = safeAlert.deflectionTarget || safeAlert.targetEntity || safeAlert.contactName || bankDetails?.bankName || "HDFC Bank Merchant Helpdesk";
  const contactName = typeof rawContact === 'object' ? (rawContact?.name || rawContact?.bankName || "HDFC Bank Merchant Helpdesk") : String(rawContact || "HDFC Bank Merchant Helpdesk");

  // Normalize phone numbers to array
  const rawPhone = safeAlert.phone || safeAlert.bankPhone || safeAlert.bankTollFree || bankDetails?.phone || bankDetails?.tollFree;
  let phoneList = [];
  if (Array.isArray(rawPhone)) {
    phoneList = rawPhone.map(p => String(p).trim()).filter(Boolean);
  } else if (typeof rawPhone === 'string') {
    phoneList = rawPhone.split(/\s*[\/\n]\s*/).map(p => p.trim()).filter(Boolean);
  }
  if (phoneList.length === 0 && !noContactNeeded && !requiresRetryFirst) {
    phoneList = ["1800 202 6161"];
  }

  const rawEmail = safeAlert.bankEmail || safeAlert.email || bankDetails?.email || "pos.helpdesk@hdfc.bank.in";
  const bankEmail = typeof rawEmail === 'object' ? (rawEmail?.email || "pos.helpdesk@hdfc.bank.in") : String(rawEmail || "pos.helpdesk@hdfc.bank.in");

  const timestamp = typeof safeAlert.timestamp === 'string' ? safeAlert.timestamp : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const rawCaseId = safeAlert.ticketRef || safeAlert.caseRef || safeAlert.caseId || `PL-AUTO-${Math.floor(10000 + Math.random() * 90000)}`;
  const caseId = String(rawCaseId || '').replace(/^#+/, '');

  return (
    <div className="relative flex justify-start my-2">
      {/* Real WhatsApp Chat Bubble (7.5px rounded, left-aligned received message) */}
      <div 
        className={`relative bg-[#202C33] rounded-[7.5px] rounded-tl-none max-w-[92%] sm:max-w-[76%] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[#E9EDEF] select-text transition-all ${
          isResolved ? "opacity-85 ring-1 ring-[#00A884]/40" : ""
        }`}
      >
        {/* Native WhatsApp Left-Side Bubble Tail */}
        <span className="absolute -left-2 top-0 text-[#202C33] pointer-events-none select-none">
          <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
            <path d="M1.533 3.568L8 12.193V0H2.812C1.042 0 .474 2.156 1.533 3.568z" />
          </svg>
        </span>

        {/* Message Body: Minimal, formal standard WhatsApp Business alert layout */}
        <div className="px-3.5 pt-3 pb-2 text-[14px] leading-[19px] space-y-2.5 font-sans">
          
          {/* Header row: Plain *Pine Labs POS Alert* */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white text-[14.5px]">
              *Pine Labs POS Alert*
            </span>
            {isResolved && (
              <span className="text-[11px] font-medium text-[#00A884] bg-[#00A884]/15 px-2 py-0.5 rounded-[4px] border border-[#00A884]/30 select-none">
                Resolved ✓
              </span>
            )}
          </div>

          {/* Context Line */}
          <div className="text-[13px] text-[#8696A0]">
            Store: <span className="text-white">{storeName}</span> | POS: <span className="text-white font-mono">{posId}</span>
          </div>

          {/* Issue & Reason */}
          <div className="text-[13.5px] space-y-0.5">
            <div>
              <span className="text-[#8696A0]">Issue: </span>
              <span className="text-white font-medium">{renderClickableText(errorIssue)}</span>
            </div>
            <div>
              <span className="text-[#8696A0]">Reason: </span>
              <span className="text-white">{renderClickableText(reasonText)}</span>
            </div>
          </div>

          {/* Resolution */}
          <div className="text-[13.5px]">
            <span className="text-[#8696A0]">Resolution: </span>
            <span className="text-white whitespace-pre-line">{renderClickableText(solutionText)}</span>
          </div>

          {/* Contact or Action section */}
          {noContactNeeded ? (
            <div className="text-[13.5px] text-[#00A884] font-medium">
              No action required — this will resolve automatically.
            </div>
          ) : requiresRetryFirst ? (
            <div className="text-[13.5px] text-amber-300 font-medium">
              Please retry the transaction as advised above.
            </div>
          ) : (
            <div className="text-[13.5px] space-y-0.5">
              <div className="text-[#8696A0]">Please contact:</div>
              <div className="text-white font-medium">{renderClickableText(contactName)}</div>
              {phoneList.map((num, idx) => {
                const parsed = parsePhoneItem(num);
                if (!parsed) return null;
                return (
                  <div key={idx} className="text-[#8696A0]">
                    Phone: <a href={parsed.href} className="text-[#53BDEB] hover:underline font-mono">{parsed.display}</a>
                  </div>
                );
              })}
              {bankEmail && (() => {
                const parsedEmail = parseEmailItem(bankEmail);
                if (!parsedEmail) return null;
                return (
                  <div className="text-[#8696A0]">
                    Email: <a href={parsedEmail.href} className="text-[#53BDEB] hover:underline font-mono">{parsedEmail.display}</a>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Bottom metadata with caseRef, timestamp, and read ticks */}
          <div className="pt-1.5 flex items-center justify-between text-[11px] text-[#8696A0] select-none">
            <span className="font-mono">
              Ref: #{caseId}
            </span>
            <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
              <span className="text-[11px]">{timestamp}</span>
              <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
            </div>
          </div>
        </div>

        {/* Single Call-to-Action Element: Mark as Resolved */}
        <div className="border-t border-[#2A3942] rounded-b-[7.5px] overflow-hidden">
          <button
            type="button"
            id={`btn-resolve-${caseId}`}
            onClick={toggleResolved}
            className={`w-full h-10 px-4 flex items-center justify-center gap-2 text-[13.5px] font-medium hover:bg-[#182229]/70 active:bg-[#182229] transition cursor-pointer select-none ${
              isResolved ? "text-[#53BDEB]" : "text-[#00A884]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isResolved ? "Mark as Unresolved" : "Mark as Resolved"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
