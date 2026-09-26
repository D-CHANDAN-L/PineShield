import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { MERCHANT_STORES, ORGANIZATION_DATA, DEMO_PROFILES } from '../data/merchantData';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../data/sopRules';
import { BANK_DIRECTORY } from '../data/bankDirectory';
import { playAudioChime } from '../components/WhatsApp/useAudioChime';
import { trackGTMEvent, trackVWOEvent } from '../services/integrations';
import { formatWhatsAppMessage, sendAutomatedWhatsApp } from '../utils/whatsapp';
import { queryGeminiTriage, matchStaticSop, isConversationalQuery } from '../utils/gemini';

const MerchantContext = createContext();

export const MerchantProvider = ({ children }) => {
  const [organization] = useState(ORGANIZATION_DATA);
  const [stores] = useState(MERCHANT_STORES);
  const [demoProfiles] = useState(DEMO_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState("PROFILE_NON_AGG");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isConsultingAi, setIsConsultingAi] = useState(false);

  // Active Demo Profile derived directly from state
  const currentProfile = useMemo(() => {
    return demoProfiles.find(p => p.profileId === activeProfileId) || demoProfiles[0];
  }, [demoProfiles, activeProfileId]);

  // Dynamic Custom Test Phone Number state (for automated WhatsApp dispatch)
  const [customPhoneNumber, setCustomPhoneNumberState] = useState(currentProfile.managerPhone);
  const [hasCustomPhoneOverride, setHasCustomPhoneOverride] = useState(false);

  const setCustomPhoneNumber = (num) => {
    setCustomPhoneNumberState(num);
    setHasCustomPhoneOverride(true);
  };

  const resetCustomPhoneNumber = () => {
    setCustomPhoneNumberState(currentProfile.managerPhone);
    setHasCustomPhoneOverride(false);
  };

  // WhatsApp Gateway Engine State (Automated Background Dispatch)
  const [gatewayMode, setGatewayMode] = useState('auto'); // 'auto', 'twilio', 'green_api', 'ultramsg', 'mock'
  const [isDispatchingWhatsApp, setIsDispatchingWhatsApp] = useState(false);
  const [lastDispatchResult, setLastDispatchResult] = useState(null);

  const [selectedStoreId, setSelectedStoreId] = useState(currentProfile.storeId);
  const [selectedPosId, setSelectedPosId] = useState(currentProfile.posId);

  // Theme Management (Light / Dark with LocalStorage persistence)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinelabs_theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pinelabs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Active Tab state (strictly 3 tabs)
  const [activeTab, setActiveTab] = useState('simulator');

  // POS State
  const [terminalAmount, setTerminalAmount] = useState("4500.00");
  const [terminalPaymentMethod, setTerminalPaymentMethod] = useState("Cards");
  const [terminalStatus, setTerminalStatus] = useState("IDLE"); // IDLE, PROCESSING, FAILED, SUCCESS
  const [activeSimulatedError, setActiveSimulatedError] = useState(null);
  const [printedReceipt, setPrintedReceipt] = useState(null);

  // Chat State pre-bound to currentProfile with zero POS ID intake prompts (clean empty landing state)
  const [chatMessages, setChatMessages] = useState([]);

  // Transient Toast Notification on Context / Profile Switch
  const [contextToast, setContextToast] = useState(null);
  const contextToastTimerRef = useRef(null);

  // WhatsApp State
  const [whatsAppMessages, setWhatsAppMessages] = useState([]);
  const [hasUnreadAlert, setHasUnreadAlert] = useState(false);

  // Internal Plutus Tickets State
  const [plutusTickets, setPlutusTickets] = useState([]);

  // Selectors
  const currentStore = useMemo(() => {
    return stores?.find(s => s.storeId === currentProfile?.storeId) || stores?.[0] || {
      storeName: 'Croma Indiranagar',
      managerName: 'Rajesh Kumar',
      city: 'Bengaluru',
      terminals: [{ posId: 'POS-IND-01', model: 'Android Smart POS A920' }]
    };
  }, [stores, currentProfile]);

  const currentPos = useMemo(() => {
    return currentStore?.terminals?.find(t => t.posId === currentProfile?.posId) || currentStore?.terminals?.[0] || {
      posId: 'POS-IND-01',
      model: 'Android Smart POS A920'
    };
  }, [currentStore, currentProfile]);

  // 1-Click Demo Profile Switcher
  const switchDemoProfile = (targetProfileId) => {
    const target = demoProfiles.find(p => p.profileId === targetProfileId) || demoProfiles[0];
    setActiveProfileId(target.profileId);
    setSelectedStoreId(target.storeId);
    setSelectedPosId(target.posId);
    setTerminalStatus("IDLE");
    setActiveSimulatedError(null);
    setPrintedReceipt(null);
    setIsProfileModalOpen(false);

    if (!hasCustomPhoneOverride) {
      setCustomPhoneNumberState(target.managerPhone);
    }

    // Set transient toast notification (auto-dismiss after 3.5s) instead of pushing a chat bubble
    const posLabel = target.posId.startsWith('POS_') ? target.posId : `POS_${target.posId.replace('POS-', '')}`;
    setContextToast(`Context switched to ${target.managerName} at ${target.storeName} (${target.architecture} • ${target.acquirer} • ${posLabel})`);
    if (contextToastTimerRef.current) {
      clearTimeout(contextToastTimerRef.current);
    }
    contextToastTimerRef.current = setTimeout(() => {
      setContextToast(null);
    }, 3500);

    trackGTMEvent('demo_profile_switched', {
      profileId: target.profileId,
      architecture: target.architecture,
      posId: target.posId
    });
  };

  const toggleDemoProfile = () => {
    const nextId = activeProfileId === "PROFILE_NON_AGG" ? "PROFILE_AGG" : "PROFILE_NON_AGG";
    switchDemoProfile(nextId);
  };

  // Reset Terminal to Idle
  const resetTerminal = () => {
    setTerminalStatus("IDLE");
    setActiveSimulatedError(null);
    setIsDispatchingWhatsApp(false);
    isDispatchingAlertRef.current = false;
  };

  // Auto WhatsApp Dispatcher with In-Flight Guard & Double-Click Throttle
  const isDispatchingAlertRef = useRef(false);
  const lastDispatchTimestampRef = useRef(0);
  const lastDispatchedAlertRef = useRef({ key: '', time: 0 });

  const dispatchAutoWhatsAppAlert = (errorRecordOrData, appliedRule, appliedRuleId, deflectionTarget, bankDetails, solution, reason, ticketRef = null) => {
    const isNonAggregator = currentProfile.architecture === "Non-Aggregator";
    const activePhone = customPhoneNumber || currentProfile.managerPhone;

    // Handle single object parameter signature vs legacy positional arguments
    const isObjectParam = errorRecordOrData && typeof errorRecordOrData === 'object' && !appliedRule;
    const rawIssueName = (isObjectParam 
      ? (errorRecordOrData.errorIssue || errorRecordOrData.errorIdentified) 
      : errorRecordOrData?.errorIssue) || "POS Issue";

    // SINGLE SOURCE OF TRUTH: Ground routing authority directly in matchStaticSop
    const sopAuthority = matchStaticSop(rawIssueName, currentProfile) || {};
    const errorIssueName = sopAuthority.errorIssue || rawIssueName;

    const targetDeflection = sopAuthority.contactName || (isObjectParam ? errorRecordOrData.contactName : deflectionTarget) || (isNonAggregator ? `${currentProfile.acquirer} Merchant Helpdesk` : "Pine Labs Plutus Support Desk");
    const targetPhoneStr = sopAuthority.phone || (isObjectParam ? (errorRecordOrData.bankPhone || errorRecordOrData.phone) : (bankDetails?.tollFree || bankDetails?.phone)) || "1800 202 6161";
    const targetEmailStr = sopAuthority.email || (isObjectParam ? (errorRecordOrData.bankEmail || errorRecordOrData.email) : bankDetails?.email) || "pos.helpdesk@hdfc.bank.in";

    const cleanReason = (isObjectParam ? errorRecordOrData.reasonOfOccurrence : reason) || sopAuthority.reasonOfOccurrence || errorRecordOrData?.reasonOfOccurrence || "Diagnostic exception flagged on payment switch.";
    const cleanSolution = (isObjectParam ? errorRecordOrData.solution : solution) || sopAuthority.solution || errorRecordOrData?.solution || "Consult Pine Labs Operations.";

    const isBankDeflect = Boolean(sopAuthority.isBankDeflection);
    const resolvedRuleId = isBankDeflect ? "RULE_1" : "RULE_2";
    const resolvedRule = isBankDeflect ? "Rule 1 (Bank Deflect)" : "Rule 2 (Pine Labs Aggregator)";

    const caseReference = (isObjectParam ? errorRecordOrData.ticketRef : ticketRef) || ticketRef || (!isBankDeflect && currentProfile.architecture === "Aggregator" ? `PL-AGG-${Math.floor(1000 + Math.random() * 9000)}` : `PL-AUTO-${Math.floor(10000 + Math.random() * 90000)}`);

    // IN-FLIGHT REQUEST GUARD & ACCIDENTAL DOUBLE-CLICK THROTTLE:
    // Replaces the 2.5s time-based window. Scales with in-flight duration, only suppressing <400ms accidental double-clicks.
    const now = Date.now();
    const dedupeKey = `${currentProfile.posId}_${errorIssueName}_${targetDeflection}`;

    // Suppress accidental sub-400ms double-clicks (e.g. StrictMode double-fire or instant re-clicks <200ms)
    if (now - lastDispatchTimestampRef.current < 400 && lastDispatchedAlertRef.current?.key === dedupeKey) {
      console.warn(`[WhatsApp Dispatcher] Suppressed accidental rapid double-fire (<400ms) for ${errorIssueName}`);
      return;
    }

    // Suppress if another dispatch is actively in flight
    if (isDispatchingAlertRef.current) {
      console.warn(`[WhatsApp Dispatcher] Suppressed dispatch while previous alert is actively in flight for ${errorIssueName}`);
      return;
    }

    // Mark as in-flight immediately
    isDispatchingAlertRef.current = true;
    lastDispatchTimestampRef.current = now;
    lastDispatchedAlertRef.current = { key: dedupeKey, time: now };

    const realWhatsAppText = formatWhatsAppMessage({
      storeName: (isObjectParam ? errorRecordOrData.storeName : null) || currentProfile.storeName,
      posId: (isObjectParam ? errorRecordOrData.posId : null) || currentProfile.posId,
      model: currentProfile.modelBadge,
      architecture: currentProfile.architecture,
      errorIssue: errorIssueName,
      reasonOfOccurrence: cleanReason,
      solution: cleanSolution,
      appliedRule: resolvedRule,
      appliedRuleId: resolvedRuleId,
      deflectionTarget: targetDeflection,
      contactName: targetDeflection,
      phone: targetPhoneStr,
      bankTollFree: targetPhoneStr,
      bankPhone: targetPhoneStr,
      bankEmail: targetEmailStr,
      caseRef: caseReference,
      ticketRef: caseReference,
      noContactNeeded: Boolean(sopAuthority.noContactNeeded || errorRecordOrData?.noContactNeeded),
      requiresRetryFirst: Boolean(sopAuthority.requiresRetryFirst || errorRecordOrData?.requiresRetryFirst)
    });

    const nowTimestamp = Date.now();
    const newAlert = {
      id: `wa_${nowTimestamp}`,
      createdAt: nowTimestamp,
      timestamp: new Date(nowTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      storeName: (isObjectParam ? errorRecordOrData.storeName : null) || currentProfile.storeName,
      city: currentProfile.city,
      managerName: currentProfile.managerName,
      managerPhone: activePhone,
      targetPhone: activePhone,
      realWhatsAppText: realWhatsAppText,
      posId: (isObjectParam ? errorRecordOrData.posId : null) || currentProfile.posId,
      architecture: currentProfile.architecture,
      modelBadge: currentProfile.modelBadge,
      acquirer: currentProfile.acquirer,
      tid: currentProfile.tid,
      errorIssue: errorIssueName,
      reasonOfOccurrence: cleanReason,
      solution: cleanSolution,
      appliedRule: resolvedRule,
      appliedRuleId: resolvedRuleId,
      deflectionTarget: targetDeflection,
      contactName: targetDeflection,
      phone: targetPhoneStr,
      bankTollFree: targetPhoneStr,
      bankHelpline: targetPhoneStr,
      bankAuth24x7: bankDetails?.auth24x7 || null,
      bankEmail: targetEmailStr,
      deflectBank: isBankDeflect,
      prefilledEmail: (isObjectParam ? errorRecordOrData.prefilledEmail : null) || null,
      caseRef: caseReference,
      ticketRef: caseReference,
      isResolved: false,
      dispatchStatus: 'Sending via API Gateway...',
      deliveryMode: gatewayMode,
      noContactNeeded: Boolean(sopAuthority.noContactNeeded || errorRecordOrData?.noContactNeeded),
      requiresRetryFirst: Boolean(sopAuthority.requiresRetryFirst || errorRecordOrData?.requiresRetryFirst)
    };

    setWhatsAppMessages(prev => [...prev, newAlert]);
    setHasUnreadAlert(true);

    // AUTOMATED BACKGROUND DISPATCH (No manual wa.me clicks)
    setIsDispatchingWhatsApp(true);

    const safetyTimer = setTimeout(() => {
      if (isDispatchingAlertRef.current) {
        console.warn("[WhatsApp Dispatcher] In-flight safety timeout cleared");
        isDispatchingAlertRef.current = false;
        setIsDispatchingWhatsApp(false);
      }
    }, 4000);

    sendAutomatedWhatsApp({
      to: activePhone,
      message: realWhatsAppText,
      gateway: gatewayMode,
      metadata: {
        storeName: currentProfile.storeName,
        posId: currentProfile.posId,
        errorIssue: errorIssueName,
        appliedRule: resolvedRule,
        caseRef: caseReference
      }
    }).then(result => {
      clearTimeout(safetyTimer);
      isDispatchingAlertRef.current = false;
      setIsDispatchingWhatsApp(false);
      setLastDispatchResult(result);
      setWhatsAppMessages(prev => prev.map(m => m.id === newAlert.id ? {
        ...m,
        dispatchStatus: result.success ? `Delivered via API (${result.mode || 'automated'})` : 'Local Delivered',
        dispatchResult: result
      } : m));
    }).catch(err => {
      clearTimeout(safetyTimer);
      isDispatchingAlertRef.current = false;
      setIsDispatchingWhatsApp(false);
      console.warn("Background dispatch error:", err);
    });

    trackGTMEvent('whatsapp_auto_dispatched', {
      errorIssue: errorIssueName,
      appliedRuleId: resolvedRuleId,
      posId: currentProfile.posId
    });

    trackVWOEvent('whatsapp_resolution_delivered', {
      errorIssue: errorIssueName
    });
    
    // Play Native Web Audio Chime synthesizer (~800Hz / ~1200Hz)
    try {
      playAudioChime();
    } catch (e) {
      console.warn("Chime error:", e);
    }
  };

  // Re-send WhatsApp Alert automatically via API with Web Audio chime
  const resendWhatsAppAlert = async (diagnosticMsg) => {
    if (!diagnosticMsg) return false;
    const errorIssue = diagnosticMsg.errorRecord?.errorIssue || diagnosticMsg.errorIssue;
    if (!errorIssue) return false;

    // Reset dedupe & in-flight guard so intentional user resend is always dispatched
    isDispatchingAlertRef.current = false;
    lastDispatchTimestampRef.current = 0;
    lastDispatchedAlertRef.current = { key: '', time: 0 };

    const sop = matchStaticSop(errorIssue, currentProfile);
    dispatchAutoWhatsAppAlert({
      errorIssue: sop.errorIssue,
      reasonOfOccurrence: sop.reasonOfOccurrence,
      solution: sop.solution,
      contactName: sop.contactName,
      bankPhone: sop.phone,
      bankEmail: sop.email,
      storeName: currentProfile.storeName,
      posId: currentProfile.posId,
      ticketRef: diagnosticMsg.ticketRef
    });
    return true;
  };

  // Explicit Manual API Dispatch Trigger
  const triggerManualApiDispatch = async (phone = null, messageText = null, meta = {}) => {
    const targetPhone = phone || customPhoneNumber || currentProfile.managerPhone;
    setIsDispatchingWhatsApp(true);
    try {
      const msg = messageText || formatWhatsAppMessage({
        storeName: currentProfile.storeName,
        posId: currentProfile.posId,
        model: currentProfile.modelBadge,
        architecture: currentProfile.architecture,
        errorIssue: "Manual Sentinel Dispatch",
        caseRef: `PL-AUTO-${Math.floor(10000 + Math.random() * 90000)}`
      });

      const result = await sendAutomatedWhatsApp({
        to: targetPhone,
        message: msg,
        gateway: gatewayMode,
        metadata: meta
      });

      setLastDispatchResult(result);
      setIsDispatchingWhatsApp(false);
      try { playAudioChime(); } catch (e) {}
      return result;
    } catch (e) {
      setIsDispatchingWhatsApp(false);
      throw e;
    }
  };

  // Create Pine Labs Internal Plutus Ticket (for Rule 2 Aggregator)
  const createPlutusTicket = (errorIssue, details = "") => {
    const ticketId = `PL-AGG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket = {
      ticketId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      posId: currentProfile.posId,
      storeName: currentProfile.storeName,
      managerName: currentProfile.managerName,
      errorIssue,
      details: details || "Switch velocity cap / aggregator TID re-route initialized by Plutus L2 TechOps",
      status: "Dispatched to L2 Engineering",
      eta: "15 minutes"
    };

    setPlutusTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  // Dual-Engine Triage Processor (Deterministic SOP + Gemini 3.8 Flash)
  const processTriageDiagnosis = async (queryText) => {
    const q = (queryText || "").trim();
    if (!q) return null;

    // Check conversational intent ("hi", "hello", small talk)
    if (isConversationalQuery(q)) {
      const agentMsg = {
        id: `agt_${Date.now()}`,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "Hello! PineShield is online. Let me know if your terminal experiences any transaction failure or error code.",
        isConversational: true
      };
      setChatMessages(prev => [...prev, agentMsg]);
      return agentMsg;
    }

    // 1. FAST PATH: Instant Local SOP Match via matchStaticSop (< 5ms Latency)
    const sopResult = matchStaticSop(q, currentProfile);
    if (sopResult && sopResult.isError) {
      const isAggregator = currentProfile.architecture === "Aggregator";
      const ticketRef = (!sopResult.isBankDeflection && isAggregator)
        ? `PL-AGG-${Math.floor(1000 + Math.random() * 9000)}`
        : null;

      const realWhatsAppText = formatWhatsAppMessage({
        storeName: currentProfile.storeName,
        posId: currentProfile.posId,
        model: currentProfile.modelBadge,
        architecture: currentProfile.architecture,
        errorIssue: sopResult.errorIssue,
        reasonOfOccurrence: sopResult.reasonOfOccurrence,
        solution: sopResult.solution,
        contactName: sopResult.contactName,
        phone: sopResult.phone,
        bankPhone: sopResult.phone,
        bankEmail: sopResult.email,
        caseRef: ticketRef,
        ticketRef: ticketRef,
        noContactNeeded: sopResult.noContactNeeded,
        requiresRetryFirst: sopResult.requiresRetryFirst
      });

      const agentMsg = {
        id: `agt_${Date.now()}`,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        errorRecord: {
          errorIssue: sopResult.errorIssue,
          reasonOfOccurrence: sopResult.reasonOfOccurrence,
          solution: sopResult.solution,
          contactName: sopResult.contactName,
          phone: sopResult.phone,
          email: sopResult.email,
          isBankDeflection: sopResult.isBankDeflection
        },
        appliedRule: sopResult.isBankDeflection ? "Bank Deflect" : "Pine Labs Aggregator",
        appliedRuleId: sopResult.isBankDeflection ? "RULE_1" : "RULE_2",
        deflectionTarget: sopResult.contactName,
        bankDetails: {
          bankName: sopResult.contactName,
          tollFree: sopResult.phone,
          phone: sopResult.phone,
          email: sopResult.email
        },
        ticketRef: ticketRef,
        architecture: currentProfile.architecture,
        modelBadge: currentProfile.modelBadge,
        acquirer: currentProfile.acquirer,
        autoDispatched: true,
        realWhatsAppText: realWhatsAppText,
        engine: "deterministic",
        isGemini: false
      };

      setChatMessages(prev => [...prev, agentMsg]);
      dispatchAutoWhatsAppAlert({
        errorIssue: sopResult.errorIssue,
        reasonOfOccurrence: sopResult.reasonOfOccurrence,
        solution: sopResult.solution,
        contactName: sopResult.contactName,
        bankPhone: sopResult.phone,
        bankEmail: sopResult.email,
        storeName: currentProfile.storeName,
        posId: currentProfile.posId,
        ticketRef: ticketRef,
        isBankDeflection: sopResult.isBankDeflection
      });

      trackGTMEvent('triage_diagnosis_executed', {
        errorIssue: sopResult.errorIssue,
        posId: currentProfile.posId,
        engine: 'deterministic'
      });
      return agentMsg;
    }

    // 2. GEMINI API DEEP PATH (EXCEL SOP KNOWLEDGE GROUNDING)
    // Any other error / query: Alert Erruption, LLT MODE, Customer App Not Working, Sub-system Not Registered, etc.
    const loadingId = `loading_${Date.now()}`;
    setChatMessages(prev => [
      ...prev,
      {
        id: loadingId,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true,
        text: "Consulting Pine Labs Sentinel AI (Gemini 2.5 Flash)..."
      }
    ]);
    setIsConsultingAi(true);

    try {
      const geminiResult = await queryGeminiTriage(queryText, currentProfile);

      if (geminiResult) {
        // Handle conversational response (e.g. "hi", "hello", general inquiry, or API error messages)
        // STRICT: DO NOT dispatch to WhatsApp and DO NOT create an error ticket
        if (geminiResult.isError === false || geminiResult.type === "conversational" || geminiResult.reply || geminiResult.replyText) {
          const agentMsg = {
            id: `agt_${Date.now()}`,
            sender: "agent",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: geminiResult.reply || geminiResult.replyText || "Hello! How can I assist you with your terminal operations today?",
            isConversational: true
          };
          setChatMessages(prev => prev.map(m => m.id === loadingId ? agentMsg : m));
          setIsConsultingAi(false);
          return agentMsg;
        }

        let appliedRule = geminiResult.appliedRule || (isNonAggregator ? "Rule 1 (Bank Deflect)" : "Rule 2 (Pine Labs Aggregator)");
        let appliedRuleId = "RULE_1";

        if (appliedRule.includes("Rule 2") || (isAggregator && !appliedRule.includes("Rule 4") && !appliedRule.includes("Hardware Depot"))) {
          appliedRuleId = "RULE_2";
        } else if (appliedRule.includes("Rule 3") || geminiResult.errorIdentified?.toLowerCase().includes("amex") || geminiResult.errorIssue?.toLowerCase().includes("amex")) {
          appliedRuleId = "RULE_3";
        } else if (appliedRule.includes("Rule 4") || geminiResult.category === "CARD_ISSUER") {
          appliedRuleId = "RULE_4";
        } else if (appliedRule.includes("Hardware") || geminiResult.category === "HARDWARE") {
          appliedRuleId = "HARDWARE_DEPOT";
        } else if (appliedRule.includes("Internal Ops") || geminiResult.category === "UPI") {
          appliedRuleId = "INTERNAL_OPS";
        } else if (isNonAggregator && geminiResult.isBankDeflection) {
          appliedRuleId = "RULE_1";
        }

        const isNonAggBankDeflect = isNonAggregator && geminiResult.isBankDeflection && appliedRuleId !== "RULE_4";

        const deflectionTarget = geminiResult.contactName || geminiResult.actionContact?.name || 
          (appliedRuleId === "RULE_2" 
            ? "Pine Labs Plutus Support Desk (Internal L2 Operations)" 
            : appliedRuleId === "RULE_4" 
            ? "Customer Card-Issuing Bank" 
            : `${currentProfile.acquirer} Merchant Helpdesk`);

        const bankDetails = {
          bankName: geminiResult.contactName || geminiResult.actionContact?.name || (appliedRuleId === "RULE_2" ? "Pine Labs Plutus Desk" : currentProfile.acquirer),
          tollFree: geminiResult.phone || geminiResult.actionContact?.phone || (appliedRuleId === "RULE_2" ? "0120-4033600" : "1800 202 6161 / 1800 258 3838"),
          helpline: geminiResult.phone || geminiResult.actionContact?.phone || null,
          email: geminiResult.email || geminiResult.actionContact?.email || (appliedRuleId === "RULE_2" ? "plutus.support@pinelabs.com" : "pos.helpdesk@hdfc.bank.in")
        };

        const ticketRef = (appliedRuleId === "RULE_2" || appliedRuleId === "INTERNAL_OPS") 
          ? `PL-AGG-${Math.floor(1000 + Math.random() * 9000)}` 
          : null;

        const errorRecord = {
          id: `gem_${Date.now()}`,
          errorIssue: geminiResult.errorIssue || geminiResult.errorIdentified || queryText,
          category: geminiResult.category || "GENERAL",
          reasonOfOccurrence: geminiResult.reasonOfOccurrence || "Diagnostic exception flagged on payment switch.",
          solution: geminiResult.solution || "Follow operational guidelines",
          deflectBank: isNonAggBankDeflect,
          isBankDeflection: Boolean(geminiResult.isBankDeflection),
          actionContact: geminiResult.actionContact,
          prefilledEmail: geminiResult.prefilledEmail
        };

        const realWhatsAppText = formatWhatsAppMessage({
          storeName: currentProfile.storeName,
          posId: currentProfile.posId,
          model: currentProfile.modelBadge,
          architecture: currentProfile.architecture,
          errorIssue: errorRecord.errorIssue,
          reasonOfOccurrence: errorRecord.reasonOfOccurrence,
          solution: errorRecord.solution,
          appliedRuleId: appliedRuleId,
          appliedRule: appliedRule,
          deflectionTarget: deflectionTarget,
          contactName: deflectionTarget,
          phone: bankDetails?.tollFree,
          bankTollFree: bankDetails?.tollFree,
          bankEmail: bankDetails?.email,
          caseRef: ticketRef,
          ticketRef: ticketRef,
          noContactNeeded: Boolean(geminiResult.noContactNeeded),
          requiresRetryFirst: Boolean(geminiResult.requiresRetryFirst)
        });

        const agentMsg = {
          id: `agt_${Date.now()}`,
          sender: "agent",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          errorRecord: errorRecord,
          appliedRule: appliedRule,
          appliedRuleId: appliedRuleId,
          deflectionTarget: deflectionTarget,
          bankDetails: bankDetails,
          ticketRef: ticketRef,
          architecture: currentProfile.architecture,
          modelBadge: currentProfile.modelBadge,
          acquirer: currentProfile.acquirer,
          autoDispatched: true,
          realWhatsAppText: realWhatsAppText,
          engine: geminiResult._engine || "gemini-3.8-flash",
          isGemini: true,
          category: geminiResult.category,
          prefilledEmail: geminiResult.prefilledEmail
        };

        // Replace loading message with final diagnostic card
        setChatMessages(prev => prev.map(m => m.id === loadingId ? agentMsg : m));
        setIsConsultingAi(false);

        // AUTOMATED BACKGROUND WHATSAPP DISPATCH
        dispatchAutoWhatsAppAlert(
          errorRecord,
          appliedRule,
          appliedRuleId,
          deflectionTarget,
          bankDetails,
          errorRecord.solution,
          errorRecord.reasonOfOccurrence,
          ticketRef
        );

        trackGTMEvent('gemini_triage_executed', {
          errorIssue: errorRecord.errorIssue,
          appliedRuleId,
          posId: currentProfile.posId,
          engine: agentMsg.engine
        });

        return agentMsg;
      }
    } catch (err) {
      console.error("Gemini deep triage error:", err);
      setChatMessages(prev => prev.map(m => m.id === loadingId ? {
        id: `agt_${Date.now()}`,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Error processing query: ${err.message}. Please select an error chip below.`
      } : m));
      setIsConsultingAi(false);
    }
  };

  // Execute Transaction Simulation
  const triggerTerminalTransaction = (errorIssueName = null) => {
    if (terminalStatus === "PROCESSING" || isDispatchingWhatsApp) return;
    setTerminalStatus("PROCESSING");
    if (errorIssueName) {
      setIsDispatchingWhatsApp(true);
    }
    trackGTMEvent('pos_transaction_initiated', {
      amount: terminalAmount,
      method: terminalPaymentMethod,
      posId: currentProfile.posId
    });

    setTimeout(() => {
      if (errorIssueName) {
        const sopRecord = matchStaticSop(errorIssueName, currentProfile);
        const errorRecord = MASTER_ERROR_RECORDS.find(r => r.errorIssue.toLowerCase() === errorIssueName.toLowerCase()) || {
          id: 99,
          errorIssue: sopRecord?.errorIssue || errorIssueName,
          type: sopRecord?.isBankDeflection ? ERROR_TYPES.ACQUIRING_BANK : ERROR_TYPES.AGGREGATOR_INTERNAL,
          reasonOfOccurrence: sopRecord?.reasonOfOccurrence || "Diagnostic exception flagged on payment switch.",
          solution: sopRecord?.solution || "Follow operational guidelines.",
          deflectBank: Boolean(sopRecord?.isBankDeflection)
        };

        setActiveSimulatedError(errorRecord);
        setTerminalStatus("FAILED");

        const receiptData = {
          rrn: `PL${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          date: new Date().toLocaleString(),
          merchantName: currentProfile.storeName,
          posId: currentProfile.posId,
          tid: currentProfile.tid,
          amount: terminalAmount,
          method: terminalPaymentMethod,
          status: "TRANSACTION FAILED",
          errorCode: errorRecord.errorIssue
        };
        setPrintedReceipt(receiptData);

        // Auto post to Chatbot and Auto-Dispatch to WhatsApp
        processTriageDiagnosis(errorRecord.errorIssue);
      } else {
        // Clean Success
        setActiveSimulatedError(null);
        setTerminalStatus("SUCCESS");
        setIsDispatchingWhatsApp(false);
        setPrintedReceipt({
          rrn: `PL${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          date: new Date().toLocaleString(),
          merchantName: currentProfile.storeName,
          posId: currentProfile.posId,
          tid: currentProfile.tid,
          amount: terminalAmount,
          method: terminalPaymentMethod,
          status: "TRANSACTION APPROVED",
          errorCode: "AUTH_OK"
        });

        trackGTMEvent('pos_transaction_approved', {
          amount: terminalAmount,
          posId: currentProfile.posId
        });
      }
    }, 350);
  };

  const value = {
    organization,
    stores,
    demoProfiles,
    activeProfileId,
    currentProfile,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isPhoneModalOpen,
    setIsPhoneModalOpen,
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    customPhoneNumber,
    setCustomPhoneNumber,
    testPhoneNumber: customPhoneNumber,
    setTestPhoneNumber: setCustomPhoneNumber,
    resetCustomPhoneNumber,
    switchDemoProfile,
    toggleDemoProfile,
    currentStore,
    currentPos,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    terminalAmount,
    setTerminalAmount,
    terminalPaymentMethod,
    setTerminalPaymentMethod,
    terminalStatus,
    setTerminalStatus,
    activeSimulatedError,
    setActiveSimulatedError,
    printedReceipt,
    setPrintedReceipt,
    chatMessages,
    setChatMessages,
    whatsAppMessages,
    setWhatsAppMessages,
    whatsAppAlerts: whatsAppMessages, // alias for backward compatibility
    setWhatsAppAlerts: setWhatsAppMessages,
    hasUnreadAlert,
    setHasUnreadAlert,
    dispatchAutoWhatsAppAlert,
    plutusTickets,
    createPlutusTicket,
    triggerTerminalTransaction,
    processTriageDiagnosis,
    isConsultingAi,
    setIsConsultingAi,
    resendWhatsAppAlert,
    triggerManualApiDispatch,
    gatewayMode,
    setGatewayMode,
    isDispatchingWhatsApp,
    lastDispatchResult,
    resetTerminal,
    contextToast,
    setContextToast
  };

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = () => useContext(MerchantContext);
