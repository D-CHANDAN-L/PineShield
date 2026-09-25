import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../data/sopRules.js';
import { BANK_DIRECTORY } from '../data/bankDirectory.js';
export { PINE_LABS_SYSTEM_PROMPT } from './geminiPrompt.js';

/**
 * Deterministic detection for greetings, small talk, and raw non-diagnostic tokens.
 */
export function isConversationalQuery(text) {
  if (!text || typeof text !== 'string') return true;
  const t = text.trim().toLowerCase();
  const conversationalTokens = [
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
    'test', 'ping', 'who are you', 'what can you do', 'help', 'time', 'status', 'yo', 'hola', 'thanks', 'thank you'
  ];
  if (conversationalTokens.includes(t)) return true;
  // Very short strings without numbers that are not specific POS acronyms
  if (t.length <= 4 && !/\d/.test(t) && !['tid', 'pos', 'amex'].includes(t)) return true;
  // Raw hashes, API keys, or long unbroken non-error tokens
  if (/^[a-zA-Z0-9_.-]{20,}$/.test(t) && !t.includes(' ') && !t.includes('error')) return true;
  return false;
}

/**
 * Resilient static SOP keyword match when Gemini is unavailable or at capacity (503/429).
 */
export function matchStaticSop(userInput, merchantContext = {}) {
  const query = (userInput || '').toLowerCase();
  const isNonAgg = (merchantContext.architecture || 'Non-Aggregator') === 'Non-Aggregator';
  const acquirer = merchantContext.acquirer || 'HDFC Bank';

  // Clean query for fuzzy token matching
  const cleanQuery = query.replace(/[#\-_]/g, ' ').replace(/\s+/g, ' ').trim();

  // Helper for bank contact data
  const bankData = BANK_DIRECTORY[acquirer] || BANK_DIRECTORY["HDFC Bank"] || {};
  const plutusData = BANK_DIRECTORY["Pine Labs Plutus Desk"] || {};

  // 1. Direct match in master records
  for (const record of MASTER_ERROR_RECORDS) {
    const errorIssue = record.errorIssue.toLowerCase();
    const cleanIssue = errorIssue.replace(/[#\-_]/g, ' ').replace(/\s+/g, ' ').trim();

    const isDirectMatch = 
      query.includes(errorIssue) || 
      errorIssue.includes(query) ||
      cleanQuery.includes(cleanIssue) ||
      cleanIssue.includes(cleanQuery) ||
      (cleanQuery.includes("not permitted") && cleanIssue.includes("not permitted")) ||
      (cleanQuery.includes("decline 99") && cleanIssue.includes("decline 99")) ||
      (cleanQuery.includes("call help re") && cleanIssue.includes("call help re")) ||
      (cleanQuery.includes("key exchange") && cleanIssue.includes("key exchange")) ||
      (cleanQuery.includes("pvt error") && cleanIssue.includes("pvt error")) ||
      (cleanQuery.includes("helpdesk") && cleanIssue.includes("helpdesk")) ||
      (cleanQuery.includes("call help fe") && cleanIssue.includes("call help fe")) ||
      (cleanQuery.includes("format error") && cleanIssue.includes("format error")) ||
      (cleanQuery.includes("inoperative") && cleanIssue.includes("inoperative")) ||
      (cleanQuery.includes("inactive amex") && cleanIssue.includes("inactive amex")) ||
      (record.detailedReason && query.includes(record.detailedReason.toLowerCase()));

    if (isDirectMatch) {
      // RULE 4: Customer Card Issuer Restrictions (Both Profiles) - CHECKED FIRST
      if (record.type === ERROR_TYPES.CUSTOMER_ISSUER || record.defaultRule === "RULE_4") {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: "Issue is with customer card due to fund or service restrictions.",
          solution: "Terminal and POS hardware are fully functional. Merchant to advise customer to contact their card-issuing bank.",
          contactName: "Customer Card-Issuing Bank",
          phone: ["Refer to helpline on back of customer card"],
          email: "customer.care@card-issuer.com",
          isBankDeflection: false,
          noContactNeeded: false,
          requiresRetryFirst: false
        };
      }

      // Special Flag: noContactNeeded (e.g., ISSUER/SWITCH INOPERATIVE)
      if (record.noContactNeeded || record.errorIssue.includes("INOPERATIVE") || query.includes("inoperative")) {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: record.reasonOfOccurrence || "Issue occurs if there is some issue with switch (e.g. SBI Debit switch)",
          solution: record.solution || "Once switch is up, it will start working automatically.",
          noContactNeeded: true,
          requiresRetryFirst: false,
          isBankDeflection: false
        };
      }

      // Special Flag: requiresRetryFirst (e.g., Call Help RE / Key Exchange Failed)
      if (record.requiresRetryFirst || record.errorIssue.includes("Call Help RE") || record.errorIssue.includes("Key Exchange") || query.includes("call help re") || query.includes("key exchange")) {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: record.reasonOfOccurrence || "TLE/ TSS/ PineKey mismatch",
          solution: record.solution || "1. Need to ask merchant to try transaction with different card.\n2. If still issue persists, needs to hit 5 transaction with same/different cards to get same issue notified/resolved automaticallly at acquirer within 48 Hours.",
          requiresRetryFirst: true,
          noContactNeeded: false,
          isBankDeflection: false
        };
      }

      // PART 2: Term Inactive-Amex joins same bucket as Contact VI / TID NOT PRESENT / Invalid Merchant / Invalid Transaction
      // Rule 1 for Non-Aggregator (Acquiring Bank), Rule 2 for Aggregator (Pine Labs)
      const isDeactivatedTidGroup = 
        record.errorIssue === "Contact VI" ||
        record.errorIssue === "TID NOT PRESENT" ||
        record.errorIssue === "Invalid Merchant" ||
        record.errorIssue === "Invalid Transaction" ||
        record.errorIssue === "Term Inactive-Amex";

      if (isDeactivatedTidGroup) {
        if (isNonAgg) {
          return {
            intent: "DIAGNOSTIC",
            isError: true,
            errorIssue: record.errorIssue,
            reasonOfOccurrence: "TID deactivated on acquiring switch",
            solution: "Merchant should contact Acquiring bank",
            contactName: bankData.bankName || `${acquirer} Merchant Helpdesk`,
            phone: Array.isArray(bankData.phone) ? bankData.phone : [bankData.tollFree || "1800 202 6161"],
            email: bankData.email || "pos.helpdesk@hdfc.bank.in",
            isBankDeflection: true,
            noContactNeeded: false,
            requiresRetryFirst: false
          };
        } else {
          return {
            intent: "DIAGNOSTIC",
            isError: true,
            errorIssue: record.errorIssue,
            reasonOfOccurrence: "TID deactivated on acquiring switch",
            solution: "Pine Labs is the master merchant. Internal L2 priority ticket logged to re-route switch and re-bind terminal TID.",
            contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
            phone: Array.isArray(plutusData.phone) ? plutusData.phone : ["0120-4033600"],
            email: plutusData.email || "plutus.support@pinelabs.com",
            isBankDeflection: false,
            noContactNeeded: false,
            requiresRetryFirst: false
          };
        }
      }

      // PVT Error 97/99 (Dedicated Pine Labs internal key management)
      if (record.errorIssue.includes("PVT Error")) {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: "PVT Error 97/99",
          reasonOfOccurrence: "PineKey reset required on TID",
          solution: "Pine Labs is coordinating with your acquiring bank to reset the security keys (PineKeys) on this terminal. No action needed from you — we'll notify you once resolved.",
          contactName: "Pine Labs Plutus Support Desk",
          phone: ["0120-4033600"],
          email: "plutus.support@pinelabs.com",
          isBankDeflection: false,
          noContactNeeded: false,
          requiresRetryFirst: false
        };
      }

      // Error Call Helpdesk / CALL HELP FE / FORMAT ERROR (Dedicated Pine Labs backend re-initialization)
      if (record.errorIssue === "Error Call Helpdesk" || record.errorIssue === "CALL HELP FE" || record.errorIssue === "FORMAT ERROR") {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: record.reasonOfOccurrence || "PineKey Mismatch",
          solution: "Once your bank confirms the key update, Pine Labs will re-initialize this terminal from our backend automatically. No merchant action required.",
          contactName: "Pine Labs Plutus Support Desk",
          phone: ["0120-4033600"],
          email: "plutus.support@pinelabs.com",
          isBankDeflection: false,
          noContactNeeded: false,
          requiresRetryFirst: false
        };
      }

      // Transaction not permitted on Terminal (Dedicated Pine Labs Smart Routing)
      if (record.errorIssue.includes("Transaction not permitted")) {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: "Transaction not permitted on Terminal",
          reasonOfOccurrence: "Some specific card type txns not allowed at acquirer end. Generally occurred on aggregator TID where credit card txns not allowed.",
          solution: "Pine Labs is rerouting these transactions to another acquirer on your terminal. No merchant action required — this is handled automatically on our end.",
          contactName: "Pine Labs Plutus Support Desk",
          phone: ["0120-4033600"],
          email: "plutus.support@pinelabs.com",
          isBankDeflection: false,
          noContactNeeded: false,
          requiresRetryFirst: false
        };
      }

      // Decline #99 (Aggregator velocity limit)
      if (record.errorIssue.includes("99")) {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: "Decline #99",
          reasonOfOccurrence: "Aggregator switch limit cap (RBL velocity cap)",
          solution: "Pine Labs Plutus L2 lifts velocity cap on switch",
          contactName: "Pine Labs Plutus Support Desk",
          phone: ["0120-4033600"],
          email: "plutus.support@pinelabs.com",
          isBankDeflection: false,
          noContactNeeded: false,
          requiresRetryFirst: false
        };
      }

      // General Rule 1: Non-Aggregator TID Deactivation
      if (isNonAgg && (record.type === ERROR_TYPES.ACQUIRING_BANK || record.defaultRule === "RULE_1")) {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: record.reasonOfOccurrence || "TID deactivated on acquiring switch",
          solution: record.solution || "Merchant should contact Acquiring bank",
          contactName: bankData.bankName || `${acquirer} Merchant Helpdesk`,
          phone: Array.isArray(bankData.phone) ? bankData.phone : [bankData.tollFree || "1800 202 6161"],
          email: bankData.email || "pos.helpdesk@hdfc.bank.in",
          isBankDeflection: true,
          noContactNeeded: false,
          requiresRetryFirst: false
        };
      }

      // General Rule 2: Aggregator TID
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: record.errorIssue,
        reasonOfOccurrence: record.reasonOfOccurrence || "Aggregator switch routing or limit exception.",
        solution: record.aggregatorSolution || record.solution || "Pine Labs is the master merchant. Internal L2 priority ticket logged to re-route switch.",
        contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
        phone: Array.isArray(plutusData.phone) ? plutusData.phone : ["0120-4033600"],
        email: plutusData.email || "plutus.support@pinelabs.com",
        isBankDeflection: false,
        noContactNeeded: false,
        requiresRetryFirst: false
      };
    }
  }

  // 2. Keyword-based matching
  // SWITCH INOPERATIVE keyword match
  if (query.includes("inoperative") || query.includes("switch inoperative") || query.includes("issuer inoperative")) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "ISSUER/SWITCH INOPERATIVE",
      reasonOfOccurrence: "Issue occurs if there is some issue with switch (e.g. SBI Debit switch)",
      solution: "Once switch is up, it will start working automatically.",
      noContactNeeded: true,
      requiresRetryFirst: false,
      isBankDeflection: false
    };
  }

  // Call Help RE / Key Exchange Failed keyword match
  if (query.includes("call help re") || query.includes("key exchange")) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: query.includes("key exchange") ? "Key Exchange Failed" : "Call Help RE",
      reasonOfOccurrence: "TLE/ TSS/ PineKey mismatch",
      solution: "1. Need to ask merchant to try transaction with different card.\n2. If still issue persists, needs to hit 5 transaction with same/different cards to get same issue notified/resolved automaticallly at acquirer within 48 Hours.",
      requiresRetryFirst: true,
      noContactNeeded: false,
      isBankDeflection: false
    };
  }

  // PVT Error keyword match (Dedicated Pine Labs internal key management)
  if (query.includes("pvt error") || query.includes("pvt 97") || query.includes("pvt 99")) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "PVT Error 97/99",
      reasonOfOccurrence: "PineKey reset required on TID",
      solution: "Pine Labs is coordinating with your acquiring bank to reset the security keys (PineKeys) on this terminal. No action needed from you — we'll notify you once resolved.",
      contactName: "Pine Labs Plutus Support Desk",
      phone: ["0120-4033600"],
      email: "plutus.support@pinelabs.com",
      isBankDeflection: false,
      noContactNeeded: false,
      requiresRetryFirst: false
    };
  }

  // Error Call Helpdesk / Format Error keyword match (Dedicated Pine Labs backend re-initialization)
  if (query.includes("call helpdesk") || query.includes("call help fe") || query.includes("format error")) {
    const issueName = query.includes("format error") ? "FORMAT ERROR" : query.includes("call help fe") ? "CALL HELP FE" : "Error Call Helpdesk";
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: issueName,
      reasonOfOccurrence: "PineKey Mismatch",
      solution: "Once your bank confirms the key update, Pine Labs will re-initialize this terminal from our backend automatically. No merchant action required.",
      contactName: "Pine Labs Plutus Support Desk",
      phone: ["0120-4033600"],
      email: "plutus.support@pinelabs.com",
      isBankDeflection: false,
      noContactNeeded: false,
      requiresRetryFirst: false
    };
  }

  // Transaction not permitted on Terminal keyword match (Dedicated Pine Labs Smart Routing)
  if (query.includes("not permitted") || query.includes("transaction not permitted")) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Transaction not permitted on Terminal",
      reasonOfOccurrence: "Some specific card type txns not allowed at acquirer end. Generally occurred on aggregator TID where credit card txns not allowed.",
      solution: "Pine Labs is rerouting these transactions to another acquirer on your terminal. No merchant action required — this is handled automatically on our end.",
      contactName: "Pine Labs Plutus Support Desk",
      phone: ["0120-4033600"],
      email: "plutus.support@pinelabs.com",
      isBankDeflection: false,
      noContactNeeded: false,
      requiresRetryFirst: false
    };
  }

  // Term Inactive-Amex keyword match (Option A: routes to acquiring bank on Non-Agg, Pine Labs on Agg)
  if (query.includes("term inactive amex") || query.includes("inactive amex") || query.includes("inactive-amex")) {
    if (isNonAgg) {
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: "Term Inactive-Amex",
        reasonOfOccurrence: "TID deactivated on acquiring switch",
        solution: "Merchant should contact Acquiring bank",
        contactName: bankData.bankName || `${acquirer} Merchant Helpdesk`,
        phone: Array.isArray(bankData.phone) ? bankData.phone : [bankData.tollFree || "1800 202 6161"],
        email: bankData.email || "pos.helpdesk@hdfc.bank.in",
        isBankDeflection: true,
        noContactNeeded: false,
        requiresRetryFirst: false
      };
    } else {
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: "Term Inactive-Amex",
        reasonOfOccurrence: "TID deactivated on acquiring switch",
        solution: "Pine Labs is the master merchant. Internal L2 priority ticket logged to re-route switch and re-bind terminal TID.",
        contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
        phone: Array.isArray(plutusData.phone) ? plutusData.phone : ["0120-4033600"],
        email: plutusData.email || "plutus.support@pinelabs.com",
        isBankDeflection: false,
        noContactNeeded: false,
        requiresRetryFirst: false
      };
    }
  }

  // RULE 4 Keyword Fallback (Customer Card Issuer Declines)
  if (
    query.includes("card help") ||
    query.includes("card decline") ||
    query.includes("pick up card") ||
    query.includes("do not honor") ||
    query.includes("referral") ||
    query.includes("call issuer")
  ) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Card Decline",
      reasonOfOccurrence: "Issue is with customer card due to fund or service restrictions.",
      solution: "Terminal and POS hardware are fully functional. Merchant to advise customer to contact their card-issuing bank.",
      contactName: "Customer Card-Issuing Bank",
      phone: ["Refer to helpline on back of customer card"],
      email: "customer.care@card-issuer.com",
      isBankDeflection: false,
      noContactNeeded: false,
      requiresRetryFirst: false
    };
  }

  // RULE 1 & 2 Keyword Fallback (TID / Switch Errors)
  if (query.includes("tid") || query.includes("deactivat") || query.includes("contact vi") || query.includes("invalid merchant") || query.includes("not present")) {
    if (isNonAgg) {
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: "TID NOT PRESENT",
        reasonOfOccurrence: "TID deactivated on acquiring switch",
        solution: "Merchant should contact Acquiring bank",
        contactName: bankData.bankName || `${acquirer} Merchant Helpdesk`,
        phone: Array.isArray(bankData.phone) ? bankData.phone : [bankData.tollFree || "1800 202 6161"],
        email: bankData.email || "pos.helpdesk@hdfc.bank.in",
        isBankDeflection: true,
        noContactNeeded: false,
        requiresRetryFirst: false
      };
    } else {
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: "Invalid Merchant",
        reasonOfOccurrence: "TID deactivated on acquiring switch",
        solution: "Pine Labs is the master merchant. Internal L2 priority ticket logged to re-route switch and re-bind terminal TID.",
        contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
        phone: Array.isArray(plutusData.phone) ? plutusData.phone : ["0120-4033600"],
        email: plutusData.email || "plutus.support@pinelabs.com",
        isBankDeflection: false,
        noContactNeeded: false,
        requiresRetryFirst: false
      };
    }
  }

  if (query.includes("decline #99") || query.includes("decline 99") || query.includes("limit")) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Decline #99",
      reasonOfOccurrence: "Aggregator switch limit cap (RBL velocity cap)",
      solution: "Pine Labs Plutus L2 lifts velocity cap on switch",
      contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
      phone: Array.isArray(plutusData.phone) ? plutusData.phone : ["0120-4033600"],
      email: plutusData.email || "plutus.support@pinelabs.com",
      isBankDeflection: false,
      noContactNeeded: false,
      requiresRetryFirst: false
    };
  }

  if (query.includes("tamper") || query.includes("alert erruption")) {
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Alert Erruption",
      reasonOfOccurrence: "POS hardware tamper sensor tripped. Device locked for PCI security.",
      solution: "Physical replacement required. Pine Labs field engineer dispatched.",
      contactName: "Pine Labs Field Engineering Desk",
      phone: Array.isArray(plutusData.phone) ? plutusData.phone : ["0120-4033600"],
      email: plutusData.email || "plutus.support@pinelabs.com",
      isBankDeflection: false,
      noContactNeeded: false,
      requiresRetryFirst: false
    };
  }

  // 3. Default conversational response
  return {
    intent: "CONVERSATIONAL",
    isError: false,
    reply: "Hello! I am PineShield. I'm actively monitoring your terminal. You can describe any payment failure, error code, or tap an error chip above to diagnose."
  };
}

export async function askGemini(userInput, merchantContext = {}) {
  // 1. Short-circuit obvious greetings before any network call
  if (isConversationalQuery(userInput)) {
    return {
      intent: "CONVERSATIONAL",
      isError: false,
      reply: "Hello! PineShield is standing by. How can I assist with your terminal today?"
    };
  }

  // 2. Call server-side proxy
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, merchantContext })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn(`[Gemini Proxy] Status ${response.status}:`, errData.error);
      return matchStaticSop(userInput, merchantContext);
    }

    const parsed = await response.json();

    if (parsed.intent === 'CONVERSATIONAL' || parsed.isError === false) {
      return {
        intent: "CONVERSATIONAL",
        isError: false,
        reply: parsed.reply || "PineShield is ready. Let me know if you experience any transaction or terminal issues."
      };
    }

    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: parsed.errorIssue || "POS Incident",
      reasonOfOccurrence: parsed.reasonOfOccurrence || "TID deactivated on acquiring switch",
      solution: parsed.solution || "Merchant should contact Acquiring bank",
      contactName: parsed.contactName || "Acquiring Bank Helpdesk",
      phone: Array.isArray(parsed.phone) ? parsed.phone : [parsed.phone || "1800 202 6161"],
      email: parsed.email || "pos.helpdesk@bank.in",
      isBankDeflection: typeof parsed.isBankDeflection === 'boolean' ? parsed.isBankDeflection : true,
      noContactNeeded: Boolean(parsed.noContactNeeded),
      requiresRetryFirst: Boolean(parsed.requiresRetryFirst)
    };
  } catch (err) {
    console.warn("[Gemini Proxy] Network/system failure — activating SOP fallback:", err);
    return matchStaticSop(userInput, merchantContext);
  }
}

// Backward-compatible aliases for existing callers
export async function askGeminiSentinel(userMessage, merchantContext = {}) {
  return askGemini(userMessage, merchantContext);
}

export async function queryGeminiTriage(userQuery, activeContext = {}) {
  return askGemini(userQuery, activeContext);
}
