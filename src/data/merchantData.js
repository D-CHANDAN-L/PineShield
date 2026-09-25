export const ORGANIZATION_DATA = {
  orgName: "Croma Electronics India Ltd.",
  mid: "MID_CR_88201",
  tier: "Tier-1 Enterprise Retail",
  headquarters: "Mumbai, Maharashtra, India",
  supportContact: "pos.operations@croma.com"
};

export const DEMO_PROFILES = [
  {
    profileId: "PROFILE_NON_AGG",
    managerName: "Rajesh Kumar",
    managerPhone: "+91 98450 12345",
    storeName: "Croma Electronics - Indiranagar",
    city: "Bengaluru",
    storeId: "STORE_BLR_01",
    posId: "POS_992144",
    model: "PAX Android A920",
    architecture: "Non-Aggregator",
    modelBadge: "Non-Aggregator (Bank-Owned TID)",
    acquirer: "HDFC Bank",
    tid: "TID_HDFC_9910",
    tidStatus: "Inactive",
    vpa: "croma.indr@hdfcbank",
    shortBadge: "Rajesh (Non-Agg: POS_992144)"
  },
  {
    profileId: "PROFILE_AGG",
    managerName: "Pooja Varma",
    managerPhone: "+91 98200 67890",
    storeName: "Croma Express - Bandra West",
    city: "Mumbai",
    storeId: "STORE_BOM_02",
    posId: "POS_992145",
    model: "PAX Android A920",
    architecture: "Aggregator",
    modelBadge: "Aggregator (Pine Labs Master Merchant)",
    acquirer: "Pine Labs Aggregator (RBL / HDFC Aggregator)",
    tid: "TID_PL_AGG_551",
    tidStatus: "Active",
    vpa: "croma.bandra.pl@hdfcbank",
    shortBadge: "Pooja (Agg: POS_992145)"
  }
];

export const MERCHANT_STORES = [
  {
    storeId: "STORE_BLR_01",
    storeName: "Croma Electronics - Indiranagar",
    city: "Bengaluru",
    managerName: "Rajesh Kumar",
    managerPhone: "+91 98450 12345",
    terminals: [
      {
        posId: "POS_992144",
        model: "PAX Android A920",
        serialNumber: "SN-PL-882194",
        architecture: "Non-Aggregator", // Rule 1 & Rule 3 Target
        acquirer: "HDFC Bank",
        tid: "TID_HDFC_9910",
        tidStatus: "Inactive",
        subsystems: [
          { name: "Domestic CC/DC (HDFC)", tid: "TID_HDFC_9910", status: "Inactive" },
          { name: "UPI / Bharat QR", vpa: "croma.indr@hdfcbank", status: "Active" },
          { name: "Brand EMI", dmsCode: "DMS_CR_BLR", status: "Active" },
          { name: "Amex (OptBlue)", tid: "TID_AMEX_1102", status: "Unprovisioned" }
        ]
      }
    ]
  },
  {
    storeId: "STORE_BOM_02",
    storeName: "Croma Express - Bandra West",
    city: "Mumbai",
    managerName: "Pooja Varma",
    managerPhone: "+91 98200 67890",
    terminals: [
      {
        posId: "POS_992145",
        model: "PAX Android A920",
        serialNumber: "SN-PL-882195",
        architecture: "Aggregator", // Rule 2 Target
        acquirer: "Pine Labs Aggregator (RBL / HDFC Aggregator)",
        tid: "TID_PL_AGG_551",
        tidStatus: "Active",
        subsystems: [
          { name: "Aggregator Unified TID", tid: "TID_PL_AGG_551", status: "Active" },
          { name: "UPI Dynamic QR", vpa: "croma.bandra.pl@hdfcbank", status: "Active" },
          { name: "Affordability / EMI", dmsCode: "DMS_PL_AGG_MUM", status: "Active" }
        ]
      }
    ]
  }
];
