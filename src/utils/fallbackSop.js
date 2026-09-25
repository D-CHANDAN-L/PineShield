/**
 * Pine Labs POS Sentinel — Local Grounded Fallback Knowledge Base
 * Mirrors the exact Gemini SOP grounding rules extracted from:
 * 1. Errors_Issue_and_their_resolution_steps.xlsx
 * 2. Key_RT_Pain_Points___SOP.xlsx
 *
 * Ensures 100% graceful degradation if VITE_GEMINI_API_KEY is not set or network fails.
 */

const BANK_CONTACTS = {
  "HDFC Bank": {
    name: "HDFC Bank Merchant Helpdesk",
    phone: "1800 202 6161 / 1800 258 3838",
    email: "pos.helpdesk@hdfc.bank.in"
  },
  "Axis Bank": {
    name: "Axis Bank Merchant Helpdesk",
    phone: "1800 419 0073",
    email: "merchant.helpdesk@axis.bank.in"
  },
  "ICICI Bank": {
    name: "ICICI Bank Merchant Helpdesk",
    phone: "1800 1080",
    email: "cmssupport@icici.bank.in"
  },
  "State Bank of India": {
    name: "SBI Merchant Helpdesk (Hitachi)",
    phone: "1800 11 22 11 / 1800 1234",
    email: "posmon@hitachi-payments.com"
  },
  "American Express": {
    name: "American Express (Amex) India Merchant Services",
    phone: "1800 419 1414 / 0124-674-4699",
    email: "India.Merchant.Service@aexp.com"
  },
  "Pine Labs Plutus": {
    name: "Pine Labs Plutus Support Desk",
    phone: "0120-4033600",
    email: "plutus.support@pinelabs.com"
  }
};

export function getLocalFallbackTriage(userQuery, activeContext = {}) {
  const q = (userQuery || "").toLowerCase().trim();
  const isAggregator = activeContext.architecture === "Aggregator";
  const acquirer = activeContext.acquirer || "HDFC Bank";
  const bankInfo = BANK_CONTACTS[acquirer] || BANK_CONTACTS["HDFC Bank"];
  const plutusInfo = BANK_CONTACTS["Pine Labs Plutus"];
  const amexInfo = BANK_CONTACTS["American Express"];

  const storeName = activeContext.storeName || "Store";
  const posId = activeContext.posId || "POS";
  const tid = activeContext.tid || "TID";

  // 1. HARDWARE: Alert Erruption
  if (q.includes("alert erruption") || q.includes("erruption") || q.includes("tamper")) {
    return {
      errorIdentified: "Alert Erruption",
      category: "HARDWARE",
      reasonOfOccurrence: "Physical anti-tamper sensors fired. Terminal internal security module tripped.",
      solution: "Terminal is faulty and replacement is required. Do not power cycle repeatedly. Immediately log a hardware swap ticket with Pine Labs Plutus Desk.",
      appliedRule: "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: {
        to: plutusInfo.email,
        subject: `Hardware Swap Request - Alert Erruption on ${posId} (${storeName})`,
        body: `Dear Pine Labs Depot Operations,\n\nTerminal ${posId} (TID: ${tid}) at ${storeName} has triggered an Alert Erruption tamper event. Terminal replacement is required urgently.\n\nPlease dispatch an emergency replacement device.\n\nStore Manager: ${activeContext.managerName} (${activeContext.managerPhone})`
      },
      _engine: "local-grounded-sop"
    };
  }

  // 2. HARDWARE / E600: Customer App Not Working
  if (q.includes("customer app not working") || q.includes("customer app") || (q.includes("e600") && q.includes("display"))) {
    return {
      errorIdentified: "Customer App Not Working (E600 Dual Screen)",
      category: "HARDWARE",
      reasonOfOccurrence: "Terminal shows 'Customer App Not Working' error due to missing 'Display Over Other Apps' permissions on PAX E600 dual screens.",
      solution: "1. Settings -> App -> Applications -> Payment App -> Advanced Settings -> Set 'Display over other apps' to Allow, and 'Display over other apps (Customize)' to Allow.\n2. Repeat the same for Storefront and Storefront for Retail.\n3. Repeat the exact same steps on Customer Screen.\n4. Restart the terminal.\n5. Open Payment App -> Activate Settle -> Minimize.\n6. Open Storefront for Retail and start billing.",
      appliedRule: "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 3. HARDWARE: LLT MODE
  if (q.includes("llt mode") || q.includes("llt") || q.includes("bios mode")) {
    return {
      errorIdentified: "LLT MODE",
      category: "HARDWARE",
      reasonOfOccurrence: "EDC entered into BIOS bootloader mode or application binaries corrupted during power drop.",
      solution: "1. Force restart terminal by pressing Power + Cancel buttons simultaneously for 8 seconds.\n2. Allow terminal to boot to desktop.\n3. If LLT MODE persists, reload Payment application from PaxStore / PineLabs App Marketplace.",
      appliedRule: "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 4. HARDWARE: Format the Terminal
  if (q.includes("format the terminal") || q.includes("format terminal") || q.includes("factory reset")) {
    return {
      errorIdentified: "Format the terminal",
      category: "HARDWARE",
      reasonOfOccurrence: "Complete terminal re-flashing requested for persistent corrupt OS or RKI failure.",
      solution: "1. Mandatory: Obtain approval from Rahul Chaturvedi before proceeding with terminal formatting.\n2. Settle all pending batches (do NOT format if open batch exists).\n3. Navigate: Settings -> Backup & Reset -> Factory Data Reset -> Erase Everything.\n4. Wait 30s for reboot -> Connect stable Wi-Fi.\n5. Install Payment App, update PineLabsRKI, and install store applications.\n6. Open Payment App, initialize, and execute test transaction.",
      appliedRule: "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 5. HARDWARE: Module disabled
  if (q.includes("module disabled")) {
    return {
      errorIdentified: "Module disabled",
      category: "HARDWARE",
      reasonOfOccurrence: "EDC hardware security module disabled due to cryptographic sensor failure.",
      solution: "EDC issue - device replacement required. Contact Pine Labs Plutus Desk to dispatch technician / replacement POS.",
      appliedRule: "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 6. HARDWARE: Terminal Not Found
  if (q.includes("terminal not found") || q.includes("hw not configured")) {
    return {
      errorIdentified: "Terminal Not found",
      category: "HARDWARE",
      reasonOfOccurrence: "EDC hardware serial number not configured on PCUI server or Production/UAT IP/port mismatch.",
      solution: "Crosscheck terminal serial number with Pine Labs Backend team. Verify PCUI server configuration and IP settings in POS Network settings.",
      appliedRule: isAggregator ? "Rule 2 (Pine Labs Aggregator)" : "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 7. BATCH / SETTLEMENT: BATCH LOCKED / Batch is open
  if (q.includes("batch locked") || q.includes("batch is open") || q.includes("pos not on tle")) {
    return {
      errorIdentified: q.includes("batch is open") ? "Batch is open, can't initialise" : "BATCH LOCKED",
      category: "HARDWARE",
      reasonOfOccurrence: "Connectivity breakage during settlement or EDC application reloaded while a transaction batch was still open.",
      solution: "1. Verify terminal Wi-Fi / 4G connectivity.\n2. Perform manual Batch Settlement: Terminal Menu -> Settlement -> Settle Batch.\n3. Once batch settles to 0, re-initialize Payment App.",
      appliedRule: "Hardware Depot SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 8. UPI: Sub-system Not Registered
  if (q.includes("sub-system not registered") || q.includes("subsystem not registered") || q.includes("sub system")) {
    return {
      errorIdentified: "Sub-system Not Registered",
      category: "UPI",
      reasonOfOccurrence: "Payment initiated on inactive QR subsystem or wrong QR mode selected on terminal.",
      solution: "1. Verify if UPI or Bharat QR is live. Transactions must be initiated on active subsystem only.\n2. For acquirers Kotak, SBI, Yes Bank, Axis, BOB: select Bharat QR for QR payments.\n3. For other acquirers: select UPI on terminal.\n4. Ensure at least one UPI/BQR acquirer is active in PCUI.",
      appliedRule: "Internal Ops DC",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 9. UPI: UPI Host settlement pending
  if (q.includes("upi host settlement pending") || q.includes("host settlement pending")) {
    return {
      errorIdentified: "UPI Host settlement pending",
      category: "UPI",
      reasonOfOccurrence: "Open batch entry stuck in UPI_TRANSACTION_SUMMARY_TBL (ACQUIRER_HOST_BATCH_STATUS = 1).",
      solution: "1. SRE must inspect open batch entry via DB query: select * from UPI_TRANSACTION_SUMMARY_TBL (nolock) where CLIENT_ID in (...) and ACQUIRER_HOST_BATCH_STATUS = 1.\n2. Contact Pine Labs SRE to raise a Data Correction (DC) ticket for batch closure (ref DC-20168 / DC-14500).",
      appliedRule: "Internal Ops DC",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 10. UPI: Cadex VPA / Invalid UPI ID / Receiver UPI ID
  if (q.includes("upi id") || q.includes("vpa") || q.includes("cadex") || q.includes("unable to scan qr") || q.includes("qr code generation failure")) {
    if (isAggregator) {
      return {
        errorIdentified: "The receiver's UPI ID is not valid (Aggregator VPA)",
        category: "UPI",
        reasonOfOccurrence: "VPA status inactive (Status = I) in HDFC Cadex Master File for Aggregator merchant.",
        solution: "1. Check VPA status in HDFC Agg UPI Cadex File.\n2. If Status = I (Deactivated), send VPA Re-activation Request email to ashutosh.rawat@hdfc.bank.in (CC: poshelpdesk.lead@hdfc.bank.in).\n3. Subject: 'VPA Re-activation Required_[Merchant Name]'.",
        appliedRule: "Rule 2 (Pine Labs Aggregator)",
        actionContact: {
          name: "HDFC Aggregator UPI Desk (Ashutosh Rawat)",
          phone: "0120-4033600",
          email: "ashutosh.rawat@hdfc.bank.in"
        },
        isBankDeflection: false,
        prefilledEmail: {
          to: "ashutosh.rawat@hdfc.bank.in",
          subject: `VPA Re-activation Required_${storeName}_${posId}`,
          body: `Dear Ashutosh,\n\nPlease reactivate the VPA for Aggregator outlet ${storeName} (POS ID: ${posId}, TID: ${tid}). Cadex status shows Inactive (I).\n\nMerchant: ${storeName}\nVPA Status Required for UPI payments.\n\nCC: poshelpdesk.lead@hdfc.bank.in`
        },
        _engine: "local-grounded-sop"
      };
    } else {
      return {
        errorIdentified: "The receiver's UPI ID is not valid (Non-Aggregator VPA)",
        category: "UPI",
        reasonOfOccurrence: "VPA or UPI Host TID deactivated at acquiring bank host.",
        solution: "Merchant must email acquiring bank helpdesk (pos.helpdesk@hdfc.bank.in) with Merchant Name, VPA, UPI Host TID, and MID to request UPI VPA re-activation.",
        appliedRule: "Rule 1 (Bank Deflect)",
        actionContact: bankInfo,
        isBankDeflection: true,
        prefilledEmail: {
          to: bankInfo.email,
          subject: `Urgent: UPI VPA Re-activation Required_${storeName}_${posId}`,
          body: `Dear ${bankInfo.name},\n\nOur UPI VPA is reporting inactive/invalid on POS ${posId} (TID: ${tid}). Please verify and reactivate the UPI Host mapping.\n\nMerchant: ${storeName}\nCity: ${activeContext.city || 'Bangalore'}`
        },
        _engine: "local-grounded-sop"
      };
    }
  }

  // 11. EMI / AFFORDABILITY: Amount not within Range
  if (q.includes("amount not within range") || q.includes("min max") || q.includes("slab")) {
    return {
      errorIdentified: "Amount not within Range",
      category: "EMI",
      reasonOfOccurrence: "Brand manufacturer specifies a strict minimum and maximum price slab for brand EMI eligibility.",
      solution: "Entered transaction amount is outside the brand scheme slab. Check scheme booklet and re-enter an amount within the eligible min-max range for this SKU.",
      appliedRule: "Affordability Brand SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 12. EMI / AFFORDABILITY: INVALID PRODUCT DETAILS (IMEI)
  if (q.includes("imei") || q.includes("product details") || q.includes("serial validation")) {
    return {
      errorIdentified: "INVALID PRODUCT DETAILS (IMEI)",
      category: "EMI",
      reasonOfOccurrence: "IMEI serial number entered failed live validation at OEM host server.",
      solution: "Verify the 15-digit IMEI barcode on the physical product box. Ensure no typo exists and that the handset SKU is mapped to the active brand scheme.",
      appliedRule: "Affordability Brand SOP",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 13. AGGREGATOR: Transaction not permitted on Terminal
  if (q.includes("not permitted on terminal") || q.includes("permitted on terminal")) {
    if (isAggregator) {
      return {
        errorIdentified: "Transaction not permitted on Terminal",
        category: "AGGREGATOR_GATEWAY",
        reasonOfOccurrence: "Specific card type txns (e.g. Credit Cards) disabled on debit-only aggregator TID tier.",
        solution: "Pine Labs Switch Engineers must reconfigure Smart Routing in PCUI to route these credit transactions to an eligible alternate aggregator switch (no bank deflection).",
        appliedRule: "Rule 2 (Pine Labs Aggregator)",
        actionContact: plutusInfo,
        isBankDeflection: false,
        prefilledEmail: null,
        _engine: "local-grounded-sop"
      };
    } else {
      return {
        errorIdentified: "Transaction not permitted on Terminal",
        category: "BANK_TID",
        reasonOfOccurrence: "Acquiring bank host profile does not permit this transaction category on this TID.",
        solution: "Merchant should contact Acquiring bank helpdesk to enable credit/international transactions on the TID.",
        appliedRule: "Rule 1 (Bank Deflect)",
        actionContact: bankInfo,
        isBankDeflection: true,
        prefilledEmail: {
          to: bankInfo.email,
          subject: `Request: Enable Card Permissions on TID ${tid} - ${storeName}`,
          body: `Dear ${bankInfo.name},\n\nTerminal ${posId} (TID: ${tid}) received 'Transaction not permitted on Terminal'. Please enable required card transaction types on this terminal profile.\n\nStore: ${storeName}`
        },
        _engine: "local-grounded-sop"
      };
    }
  }

  // 14. AGGREGATOR: Decline #99 / Velocity Limit
  if (q.includes("decline #99") || q.includes("decline 99") || q.includes("velocity") || q.includes("limit cap") || q.includes("rbl limit")) {
    return {
      errorIdentified: "Decline #99 | Please try another card",
      category: "AGGREGATOR_GATEWAY",
      reasonOfOccurrence: "Aggregator switch velocity limit cap reached (~1K daily limit under RBL LMS rules).",
      solution: "Pine Labs Plutus L2 TechOps coordinates internally with LMS team to increase switch velocity limits. No acquiring bank deflection permitted.",
      appliedRule: "Rule 2 (Pine Labs Aggregator)",
      actionContact: plutusInfo,
      isBankDeflection: false,
      prefilledEmail: null,
      _engine: "local-grounded-sop"
    };
  }

  // 15. AMEX: Term Inactive-Amex / OptBlue
  if (q.includes("amex") || q.includes("american express") || q.includes("optblue")) {
    return {
      errorIdentified: "Term Inactive-Amex",
      category: "BANK_TID",
      reasonOfOccurrence: "TID deactivated / Amex card scheme unconfigured on acquiring terminal profile.",
      solution: "Check if OptBlue is enabled on POS (ICICI, YES Bank, Kotak, SBI support OptBlue without separate Amex TID). For other banks, route to Bank RM or pass to CS VAS for Amex Agg Onboarding post-KYC.",
      appliedRule: "Rule 3 (Amex Setup)",
      actionContact: amexInfo,
      isBankDeflection: true,
      prefilledEmail: {
        to: amexInfo.email,
        subject: `Amex Scheme Provisioning Request_${storeName}_${posId}`,
        body: `Dear Amex Merchant Services,\n\nPlease provision American Express card acceptance on POS ${posId} (TID: ${tid}) at ${storeName}.\n\nManager: ${activeContext.managerName} (${activeContext.managerPhone})`
      },
      _engine: "local-grounded-sop"
    };
  }

  // No match found — return null (never generate fake mock bank deactivation cards for arbitrary text)
  return null;
}
