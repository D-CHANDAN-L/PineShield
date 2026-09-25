export const ERROR_TYPES = {
  ACQUIRING_BANK: "ACQUIRING_BANK",
  AGGREGATOR_INTERNAL: "AGGREGATOR_INTERNAL",
  CUSTOMER_ISSUER: "CUSTOMER_ISSUER",
  CARD_UNCONFIGURED: "CARD_UNCONFIGURED"
};

export const SOP_RULES = {
  RULE_1: {
    id: "RULE_1",
    name: "Rule 1 (Bank-Managed TID Deactivation)",
    summary: "100% Zero-Touch Deflection to Acquiring Bank Helpdesk",
    description: "IF a transaction fails due to a deactivated TID and the POS is configured with a Non-Aggregator TID, THEN execute 100% Zero-Touch Deflection to the merchant's acquiring bank helpdesk. Do NOT route them to Pine Labs support."
  },
  RULE_2: {
    id: "RULE_2",
    name: "Rule 2 (Pine Labs-Managed Aggregator TID)",
    summary: "Pine Labs Internal L2 Priority Resolution",
    description: "IF a transaction fails on an Aggregator TID, DO NOT deflect to any bank! Pine Labs is the master merchant. Pine Labs Plutus L2 Operations creates an internal priority ticket to re-route the switch or lift the LMS limit."
  },
  RULE_3: {
    id: "RULE_3",
    name: "Rule 3 (Specific Card Unconfigured - e.g., Amex)",
    summary: "Acquiring Bank RM / Amex Scheme Provisioning",
    description: "IF a transaction fails because a particular bank card TID is not configured or shows Term Inactive-Amex, THEN instruct the merchant to contact their acquiring bank RM or American Express directly to activate that scheme."
  },
  RULE_4: {
    id: "RULE_4",
    name: "Rule 4 (Customer Card Issuer Restrictions)",
    summary: "Card Issue - Terminal Fully Functional",
    description: "IF a transaction fails due to fund or service restrictions, THEN confirm the terminal is completely healthy and instruct the merchant to inform the customer to contact their card-issuing bank."
  }
};

export const MASTER_ERROR_RECORDS = [
  // 1. Errors with resolution when TID issue with Acquiring bank (Rules 1, 2, 3)
  {
    id: 1,
    errorIssue: "Contact VI",
    type: ERROR_TYPES.ACQUIRING_BANK,
    defaultRule: "RULE_1",
    reasonOfOccurrence: "TID deactivated",
    solution: "Merchant should contact Acquiring bank",
    deflectBank: true,
    category: "Acquiring Bank TID"
  },
  {
    id: 2,
    errorIssue: "TID NOT PRESENT",
    type: ERROR_TYPES.ACQUIRING_BANK,
    defaultRule: "RULE_1",
    reasonOfOccurrence: "TID deactivated",
    solution: "Merchant should contact Acquiring bank",
    aggregatorSolution: "Pine Labs L2 internal re-initialization (internal ticket created)",
    deflectBank: true,
    category: "Acquiring Bank TID"
  },
  {
    id: 3,
    errorIssue: "Invalid Merchant",
    type: ERROR_TYPES.ACQUIRING_BANK,
    defaultRule: "RULE_1",
    reasonOfOccurrence: "TID deactivated",
    solution: "Merchant should contact Acquiring bank",
    deflectBank: true,
    category: "Acquiring Bank TID"
  },
  {
    id: 4,
    errorIssue: "Term Inactive-Amex",
    type: ERROR_TYPES.ACQUIRING_BANK,
    defaultRule: "RULE_3",
    reasonOfOccurrence: "TID deactivated / Amex unconfigured",
    solution: "Merchant should contact Acquiring bank / Amex Support",
    detailedReason: "Amex scheme / card type not provisioned on acquiring bank switch or terminal TID",
    detailedSolution: "Merchant should contact their acquiring bank RM or American Express directly to activate that scheme.",
    deflectBank: true,
    category: "Acquiring Bank TID"
  },
  {
    id: 5,
    errorIssue: "Invalid Transaction",
    type: ERROR_TYPES.ACQUIRING_BANK,
    defaultRule: "RULE_1",
    reasonOfOccurrence: "TID deactivated",
    solution: "Merchant should contact Acquiring bank",
    aggregatorSolution: "Pine Labs L2 switch re-route and profile update",
    deflectBank: true,
    category: "Acquiring Bank TID"
  },
  {
    id: 13,
    errorIssue: "Transaction not permitted on Terminal",
    type: ERROR_TYPES.AGGREGATOR_INTERNAL,
    defaultRule: "RULE_2",
    reasonOfOccurrence: "TID deactivated / Aggregator switch re-route required",
    solution: "Pine Labs L2 Operations creates internal priority ticket",
    deflectBank: false,
    category: "Pine Labs Aggregator"
  },
  {
    id: 14,
    errorIssue: "Decline #99",
    type: ERROR_TYPES.AGGREGATOR_INTERNAL,
    defaultRule: "RULE_2",
    reasonOfOccurrence: "Aggregator switch limit cap (RBL velocity cap)",
    solution: "Pine Labs Plutus L2 lifts velocity cap on switch",
    deflectBank: false,
    category: "Pine Labs Aggregator"
  },

  // 2. Errors with resolution when Customer card related issue with Issuer bank (Rule 4)
  {
    id: 6,
    errorIssue: "Card Decline",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  },
  {
    id: 7,
    errorIssue: "Pick Up Card",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  },
  {
    id: 8,
    errorIssue: "Do Not Honor",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  },
  {
    id: 9,
    errorIssue: "Card Help TR",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  },
  {
    id: 10,
    errorIssue: "Card Help NS",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  },
  {
    id: 11,
    errorIssue: "Please Call Referral",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  },
  {
    id: 12,
    errorIssue: "CALL ISSUER/CALL HELP CC",
    type: ERROR_TYPES.CUSTOMER_ISSUER,
    defaultRule: "RULE_4",
    reasonOfOccurrence: "Issue is with card due to Fund/Services restriction",
    solution: "Merchant to inform customer to contact card issuer bank for better clarification.",
    deflectBank: false,
    category: "Customer Card Issuer"
  }
];
