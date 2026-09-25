export const BANK_ESCALATION_DIRECTORY = {
  "HDFC Bank": {
    acquirerName: "HDFC Bank Merchant Helpdesk",
    supportDeskPhone: "1800 202 6161",
    alternatePhone: "1860 267 6161 / 1800 258 3838",
    emailL1: "pos.helpdesk@hdfc.bank.in",
    emailEscalation: "poshelpdesk.lead@hdfc.bank.in",
    emailCC: "poshelpdesk.lead@hdfc.bank.in",
    tatHours: 24,
    notes: "For Non-Aggregator TIDs, merchant must supply Merchant Name, TID, and Store City."
  },
  "Axis Bank": {
    acquirerName: "Axis Bank Merchant Services",
    supportDeskPhone: "1800 419 0073",
    alternatePhone: "1800 419 0073",
    emailL1: "merchant.helpdesk@axis.bank.in",
    emailEscalation: "merchant.helpdesk@axis.bank.in",
    emailCC: "merchant.helpdesk@axis.bank.in",
    tatHours: 48,
    notes: "Routing is managed via Worldline/TPSL gateway partner."
  },
  "ICICI Bank": {
    acquirerName: "ICICI Bank Merchant Support",
    supportDeskPhone: "1800 1080",
    alternatePhone: "1800 1080",
    emailL1: "cmssupport@icici.bank.in",
    emailEscalation: "cmssupport@icici.bank.in",
    emailCC: "cachetapg@icici.bank.in",
    tatHours: 24,
    notes: "Supports OptBlue Amex clearing natively."
  },
  "SBI": {
    acquirerName: "State Bank of India (SBI Payment Services)",
    supportDeskPhone: "1800 11 22 11",
    alternatePhone: "1800 1234 / 1800 2100",
    emailL1: "posmon@hitachi-payments.com",
    emailEscalation: "merchantboarding@hitachi-payments.com",
    emailCC: "MerchantUpdate@hitachi-payments.com",
    tatHours: 48,
    notes: "Managed via Hitachi Payment Services infrastructure."
  },
  "American Express": {
    acquirerName: "American Express (Amex) India Merchant Services",
    supportDeskPhone: "1800 419 1414",
    alternatePhone: "0124-674-4699",
    auth24x7: "0124-673-6767",
    emailL1: "India.Merchant.Service@aexp.com",
    emailEscalation: "onlinemerchantservicing@aexp.com",
    tatHours: 24,
    notes: "Direct Amex Merchant Services for unconfigured TID profiles and OptBlue enablement."
  },
  "Pine Labs Internal": {
    deskName: "Pine Labs Plutus Support Desk",
    supportPhone: "0120-4033600",
    supportEmail: "plutus.support@pinelabs.com",
    l2TechOpsEmail: "cplus_acq_l2techops@pinelabs.com",
    leadContact: "L2 TechOps Switch Team"
  }
};
