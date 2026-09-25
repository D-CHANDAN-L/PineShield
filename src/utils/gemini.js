import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../data/sopRules.js';
import { BANK_DIRECTORY } from '../data/bankDirectory.js';

export const PINE_LABS_SYSTEM_PROMPT = `
You are the official Pine Labs POS Sentinel Operations AI. You troubleshoot payment, terminal, and acquiring failures across Pine Labs SmartPOS devices (A920, E600, D210).

YOU HAVE ACCESS TO THE ACTIVE MERCHANT CONTEXT:
- Never ask the user for their POS ID, store name, or bank. You already know it from the context.

STRICT SOP ROUTING RULES:
RULE 1 — Non-Aggregator Bank-Owned TIDs (Acquirers: HDFC, Axis, ICICI, SBI):
- Applicable when architecture is "Non-Aggregator" and error is an acquiring switch deactivation (e.g. "TID NOT PRESENT", "Invalid Merchant", "Contact VI", "Invalid Transaction").
- 100% Zero-Touch Deflection to the merchant's acquiring bank helpdesk.
- NEVER mention Pine Labs Plutus support or 0120-4033600.
- Contact Info from Directory:
  * HDFC Bank: HDFC Bank Merchant Helpdesk | Phone: 1800 202 6161 / 1860 267 6161 / 1800 258 3838 | Email: pos.helpdesk@hdfc.bank.in
  * Axis Bank: Axis Bank Merchant Services | Phone: 1800 419 0073 | Email: merchant.helpdesk@axis.bank.in
  * ICICI Bank: ICICI Bank Merchant Support | Phone: 1800 1080 | Email: cmssupport@icici.bank.in
  * State Bank of India: State Bank of India (SBI Payment Services) | Phone: 1800 11 22 11 / 1800 1234 / 1800 2100 | Email: posmon@hitachi-payments.com

RULE 2 — Aggregator Pine Labs-Owned TIDs:
- Applicable when architecture is "Aggregator" (e.g. "Invalid Merchant", "TID NOT PRESENT", "Transaction not permitted on Terminal", "Decline #99").
- Pine Labs is the master merchant. NEVER deflect to a bank!
- Internal Pine Labs Plutus L2 Operations creates an internal priority ticket to re-route switch or lift velocity limit.
- Contact: Pine Labs Plutus Priority Desk | Phone: 0120-4033600 | Email: plutus.support@pinelabs.com

RULE 3 — Card Scheme Unconfigured / Term Inactive-Amex (Both Profiles):
- Applicable when error is "Term Inactive-Amex" or card scheme is unconfigured.
- Direct merchant to contact acquiring bank RM or American Express directly to activate scheme.
- MUST use Amex Merchant Services contact details (NEVER generic bank number):
- Contact: American Express (Amex) India Merchant Services | Phone: 1800 419 1414 / 0124-674-4699 | Email: India.Merchant.Service@aexp.com

RULE 4 — Customer Card Issuer Restrictions (Both Profiles):
- Applicable for customer card declines (e.g. "Card Help NS", "Card Help TR", "Card Decline", "Do Not Honor", "Pick Up Card", "Please Call Referral", "CALL ISSUER").
- Terminal and POS hardware are completely healthy. Issue is with cardholder account due to fund or service restrictions.
- NEVER mention TID, terminal fault, or acquiring bank.
- Merchant must advise customer to contact their card-issuing bank.
- Contact: Customer Card-Issuing Bank | Phone: Refer to helpline on back of customer card | Email: customer.care@card-issuer.com

PINNED EXCEL SHEET KNOWLEDGE BASE:
- "Alert Erruption": Tamper sensor tripped. Hardware replacement required via Pine Labs Plutus Desk (0120-4033600).
- "Customer App Not Working" (E600 dual-screen): Missing "Display Over Other Apps" permission. Fix via Settings -> App -> Applications -> Payment App -> Enable "Display over other apps". Repeat for Storefront.
- "LLT MODE": EDC in BIOS mode or app corrupt. Hold Power + Cancel to restart, or reload from PaxStore.
- "Sub-system Not Registered": Kotak/SBI/Axis/BOB use Bharat QR. Others use UPI. Ensure active subsystem is selected.
- "Decline #99 | Please try another card" (RBL Aggregator): Daily limit set at ~1K by LMS. Pine Labs L2 coordinates with LMS to increase limits.

STRICT INSTRUCTION ON INTENT:
1. If the user input is a greeting, general question, gibberish, or conversational message (e.g. "hi", "hello", "time", "who are you", "what can you do", "help me"):
   Return JSON:
   {
     "intent": "CONVERSATIONAL",
     "isError": false,
     "reply": "Conversational, intelligent answer in plain English."
   }

2. If and ONLY if the user describes an actual terminal issue, error code, or payment failure:
   Return JSON:
   {
     "intent": "DIAGNOSTIC",
     "isError": true,
     "errorIssue": "Standardized Error Name",
     "reasonOfOccurrence": "Concise root cause explanation",
     "solution": "Actionable steps for the merchant",
     "contactName": "Target Support Desk Name",
     "phone": "Helpline phone number",
     "email": "Support email address",
     "isBankDeflection": boolean
   }
`;

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
      (record.detailedReason && query.includes(record.detailedReason.toLowerCase()));

    if (isDirectMatch) {
      // RULE 4: Customer Card Issuer Restrictions (Both Profiles) - MUST BE CHECKED FIRST
      if (record.type === ERROR_TYPES.CUSTOMER_ISSUER || record.defaultRule === "RULE_4") {
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: "Issue is with customer card due to fund or service restrictions.",
          solution: "Terminal and POS hardware are fully functional. Merchant to advise customer to contact their card-issuing bank.",
          contactName: "Customer Card-Issuing Bank",
          phone: "Refer to helpline on back of customer card",
          email: "customer.care@card-issuer.com",
          isBankDeflection: false
        };
      }

      // RULE 3: Amex Scheme Unconfigured (Both Profiles) - MUST BE CHECKED BEFORE GENERIC ACQUIRER
      if (record.errorIssue === "Term Inactive-Amex" || record.defaultRule === "RULE_3") {
        const amexData = BANK_DIRECTORY["American Express"] || {};
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: "Term Inactive-Amex",
          reasonOfOccurrence: "Amex scheme or card type not provisioned on acquiring switch or terminal TID.",
          solution: "Merchant should contact their acquiring bank RM or American Express directly to activate that scheme.",
          contactName: amexData.bankName || "American Express (Amex) India Merchant Services",
          phone: `${amexData.tollFree || "1800 419 1414"} / ${amexData.helpline || "0124-674-4699"}`,
          email: amexData.email || "India.Merchant.Service@aexp.com",
          isBankDeflection: true
        };
      }

      // RULE 1: Non-Aggregator TID Deactivation (100% Bank Deflection)
      if (isNonAgg && (record.type === ERROR_TYPES.ACQUIRING_BANK || record.defaultRule === "RULE_1")) {
        const bankData = BANK_DIRECTORY[acquirer] || BANK_DIRECTORY["HDFC Bank"] || {};
        return {
          intent: "DIAGNOSTIC",
          isError: true,
          errorIssue: record.errorIssue,
          reasonOfOccurrence: "TID deactivated on acquiring switch.",
          solution: "Merchant should contact Acquiring bank. Pine Labs support cannot unblock bank-owned TIDs.",
          contactName: bankData.bankName || `${acquirer} Merchant Helpdesk`,
          phone: bankData.tollFree || "1800 202 6161 / 1860 267 6161 / 1800 258 3838",
          email: bankData.email || "pos.helpdesk@hdfc.bank.in",
          isBankDeflection: true
        };
      }

      // RULE 2: Aggregator TID Failure or Pine Labs LMS Limit (Pine Labs Internal Switch Resolution)
      const plutusData = BANK_DIRECTORY["Pine Labs Plutus Desk"] || {};
      const isLmsLimit = record.errorIssue.includes("99") || query.includes("99");
      const isNotPermitted = record.errorIssue.toLowerCase().includes("not permitted") || query.includes("not permitted");
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: record.errorIssue,
        reasonOfOccurrence: isLmsLimit 
          ? "Aggregator switch velocity limit reached (LMS limit)." 
          : isNotPermitted 
          ? "Aggregator switch routing exception (credit transactions disabled on debit-only TID tier)."
          : "Aggregator switch routing or limit exception.",
        solution: isLmsLimit 
          ? "Pine Labs is master merchant. Pine Labs Plutus L2 coordinates with LMS to lift velocity cap." 
          : (record.aggregatorSolution || "Pine Labs is the master merchant. Internal L2 priority ticket logged to re-route switch and re-bind terminal TID."),
        contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
        phone: plutusData.landline || "0120-4033600",
        email: plutusData.email || "plutus.support@pinelabs.com",
        isBankDeflection: false
      };
    }
  }

  // 2. Keyword-based matching
  // RULE 3 Keyword Fallback (Amex / American Express)
  if (query.includes("amex") || query.includes("american express") || query.includes("inactive-amex")) {
    const amexData = BANK_DIRECTORY["American Express"] || {};
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Term Inactive-Amex",
      reasonOfOccurrence: "Amex scheme not provisioned on acquiring bank switch or terminal TID.",
      solution: "Merchant should contact their acquiring bank RM or American Express directly to activate scheme.",
      contactName: amexData.bankName || "American Express (Amex) India Merchant Services",
      phone: `${amexData.tollFree || "1800 419 1414"} / ${amexData.helpline || "0124-674-4699"}`,
      email: amexData.email || "India.Merchant.Service@aexp.com",
      isBankDeflection: true
    };
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
      phone: "Refer to helpline on back of customer card",
      email: "customer.care@card-issuer.com",
      isBankDeflection: false
    };
  }

  // RULE 1 & 2 Keyword Fallback (TID / Switch Errors)
  if (query.includes("tid") || query.includes("deactivat") || query.includes("contact vi") || query.includes("invalid merchant") || query.includes("not present")) {
    if (isNonAgg) {
      const bankData = BANK_DIRECTORY[acquirer] || BANK_DIRECTORY["HDFC Bank"] || {};
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: "TID NOT PRESENT",
        reasonOfOccurrence: "Terminal Identifier (TID) deactivated on acquiring switch.",
        solution: "Merchant should contact Acquiring bank. Pine Labs support cannot unblock bank-owned TIDs.",
        contactName: bankData.bankName || `${acquirer} Merchant Helpdesk`,
        phone: bankData.tollFree || "1800 202 6161 / 1860 267 6161 / 1800 258 3838",
        email: bankData.email || "pos.helpdesk@hdfc.bank.in",
        isBankDeflection: true
      };
    } else {
      const plutusData = BANK_DIRECTORY["Pine Labs Plutus Desk"] || {};
      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: "Invalid Merchant",
        reasonOfOccurrence: "Aggregator switch routing or limit exception.",
        solution: "Pine Labs is the master merchant. Internal L2 priority ticket logged to re-route switch and re-bind terminal TID.",
        contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
        phone: plutusData.landline || "0120-4033600",
        email: plutusData.email || "plutus.support@pinelabs.com",
        isBankDeflection: false
      };
    }
  }

  if (query.includes("decline #99") || query.includes("decline 99") || query.includes("limit")) {
    const plutusData = BANK_DIRECTORY["Pine Labs Plutus Desk"] || {};
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Decline #99",
      reasonOfOccurrence: "Aggregator switch velocity limit reached (LMS limit).",
      solution: "Pine Labs is master merchant. Pine Labs Plutus L2 coordinates with LMS to lift velocity cap.",
      contactName: plutusData.bankName || "Pine Labs Plutus Support Desk",
      phone: plutusData.landline || "0120-4033600",
      email: plutusData.email || "plutus.support@pinelabs.com",
      isBankDeflection: false
    };
  }

  if (query.includes("tamper") || query.includes("alert erruption")) {
    const plutusData = BANK_DIRECTORY["Pine Labs Plutus Desk"] || {};
    return {
      intent: "DIAGNOSTIC",
      isError: true,
      errorIssue: "Alert Erruption",
      reasonOfOccurrence: "POS hardware tamper sensor tripped. Device locked for PCI security.",
      solution: "Physical replacement required. Pine Labs field engineer dispatched.",
      contactName: "Pine Labs Field Engineering Desk",
      phone: plutusData.landline || "0120-4033600",
      email: plutusData.email || "plutus.support@pinelabs.com",
      isBankDeflection: false
    };
  }

  // 3. Default conversational response
  return {
    intent: "CONVERSATIONAL",
    isError: false,
    reply: "Hello! I am your Pine Labs POS Sentinel. I'm actively monitoring your terminal. You can describe any payment failure, error code, or tap an error chip above to diagnose."
  };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch wrapper with exponential backoff (3 attempts, 1s/2s/3s) retrying only on 503/429.
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  const delays = [1000, 2000, 3000];
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastResponse = response;

      // Retry only on 503 (high demand) or 429 (rate limit)
      if (response.status === 503 || response.status === 429) {
        console.warn(`[Gemini API] Received ${response.status} on attempt ${attempt + 1}/${maxRetries}. Retrying in ${delays[attempt]}ms...`);
        if (attempt < maxRetries - 1) {
          await sleep(delays[attempt]);
          continue;
        }
      }
      return response;
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini API] Network fetch exception on attempt ${attempt + 1}/${maxRetries}:`, err);
      if (attempt < maxRetries - 1) {
        await sleep(delays[attempt]);
        continue;
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error("Gemini network request failed after retries");
}

export async function askGemini(userInput, merchantContext = {}) {
  // 1. Check if input is obvious conversational greeting/gibberish before remote API call
  if (isConversationalQuery(userInput)) {
    return {
      intent: "CONVERSATIONAL",
      isError: false,
      reply: "Hello! Pine Labs POS Sentinel is standing by. How can I assist with your terminal today?"
    };
  }

  // 2. Retrieve API key from localStorage or Vite env
  const apiKey = (typeof window !== 'undefined' ? localStorage.getItem('PINELABS_GEMINI_KEY') : null) || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    // If no key is set, use grounded SOP keyword lookup seamlessly
    return matchStaticSop(userInput, merchantContext);
  }

  // 3. Prepare payload
  const prompt = `
CURRENT MERCHANT CONTEXT:
- Store: ${merchantContext.storeName || 'Croma Electronics'} (${merchantContext.city || 'Bengaluru'})
- Manager: ${merchantContext.managerName || 'Rajesh Kumar'}
- POS ID: ${merchantContext.posId || 'POS_992144'}
- Architecture: ${merchantContext.architecture || 'Non-Aggregator'}
- Bound Acquirer: ${merchantContext.acquirer || 'HDFC Bank'}
- Card TID: ${merchantContext.tid || 'TID_HDFC_9910'}

USER QUERY:
"${userInput}"

Follow system instructions. Output ONLY valid raw JSON with "intent", "isError", and matching fields. Do NOT include markdown fences.
`;

  // 4. Call Google AI Studio REST API using strictly gemini-3.8-flash (GA September 2, 2026)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;

  try {
    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: PINE_LABS_SYSTEM_PROMPT }]
        },
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.warn(`[Gemini API] Request ended with status ${response.status}. Activating resilient SOP fallback.`);
      return matchStaticSop(userInput, merchantContext);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return matchStaticSop(userInput, merchantContext);
    }

    // Strip Markdown code fences (```json ... ```) before JSON.parse
    text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text);

      // Verify intent classification
      if (parsed.intent === 'CONVERSATIONAL' || parsed.isError === false) {
        return {
          intent: "CONVERSATIONAL",
          isError: false,
          reply: parsed.reply || "Pine Labs POS Sentinel is ready. Let me know if you experience any transaction or terminal issues."
        };
      }

      return {
        intent: "DIAGNOSTIC",
        isError: true,
        errorIssue: parsed.errorIssue || "POS Incident",
        reasonOfOccurrence: parsed.reasonOfOccurrence || "Deactivated on acquiring switch",
        solution: parsed.solution || "Contact acquiring bank helpdesk",
        contactName: parsed.contactName || "Acquiring Bank Helpdesk",
        phone: parsed.phone || "1800 202 6161",
        email: parsed.email || "pos.helpdesk@bank.in",
        isBankDeflection: typeof parsed.isBankDeflection === 'boolean' ? parsed.isBankDeflection : true
      };
    } catch (jsonErr) {
      console.warn("[Gemini API] JSON parse failed, falling back to static SOP match:", jsonErr);
      return matchStaticSop(userInput, merchantContext);
    }
  } catch (err) {
    console.warn("[Gemini API] Network/system failure handled gracefully:", err);
    // Never show a raw error — fall back to static SOP keyword match
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
