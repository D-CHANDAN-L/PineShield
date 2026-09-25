import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Send, 
  Mic, 
  User, 
  Trash2,
  RefreshCw,
  Bot
} from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';
import TriageResultCard from './TriageResultCard';
import EmailDraftModal from './EmailDraftModal';
import CallSimulatorModal from '../WhatsApp/CallSimulatorModal';
import { askGemini } from '../../utils/gemini';

export default function GeminiTriageStudio({ onNavigateToWhatsApp, onNavigateToSimulator }) {
  const {
    chatMessages,
    setChatMessages,
    currentProfile,
    currentStore,
    currentPos,
    customPhoneNumber,
    setIsPhoneModalOpen,
    processTriageDiagnosis,
    dispatchAutoWhatsAppAlert,
    resendWhatsAppAlert,
    createPlutusTicket,
    isDispatchingWhatsApp
  } = useMerchant();

  const [inputText, setInputText] = useState("");
  const [activeEmailModal, setActiveEmailModal] = useState(null);
  const [activeCallModal, setActiveCallModal] = useState(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [resentMessageId, setResentMessageId] = useState(null);
  const [createdTicketsMap, setCreatedTicketsMap] = useState({});
  const [inFlightQuery, setInFlightQuery] = useState(null);
  
  // Conversational Branching State: null (Level 1), "BANK_TID" (Level 2), "CARD_RESTRICTION" (Level 2), "AMEX_SCHEME" (Level 2)
  const [activeCategory, setActiveCategory] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isNonAgg = currentProfile?.architecture === "Non-Aggregator";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isSendingRef = useRef(false);
  const lastSendTimeRef = useRef(0);
  const hasProcessedUrlParamRef = useRef(false);

  const handleSendMessage = async (userText) => {
    if (!userText || !userText.trim()) return;
    const now = Date.now();
    // Guard against accidental double-clicks (<400ms) or active in-flight requests
    if (now - lastSendTimeRef.current < 400 || isSendingRef.current || isDispatchingWhatsApp) {
      console.warn(`[Triage Studio] Suppressed concurrent or rapid dispatch for "${userText}"`);
      return;
    }

    isSendingRef.current = true;
    lastSendTimeRef.current = now;
    setInFlightQuery(userText.trim());

    try {
      // Add user message to UI chat
      const userMsg = {
        id: `usr_${Date.now()}`,
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const loadingId = `load_${Date.now()}`;
      const loadingMsg = {
        id: loadingId,
        sender: 'assistant',
        isLoading: true,
        text: 'Consulting Google Gemini 3.8 Flash...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, userMsg, loadingMsg]);

      // Call real Gemini API
      const result = await askGemini(userText, currentProfile);

      // CASE 1: Conversational / Non-Error ("hi", "time", general questions)
      if (!result.isError) {
        const aiReplyMsg = {
          id: `agt_${Date.now()}`,
          sender: 'assistant',
          isCard: false,
          text: result.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages((prev) => prev.map(m => m.id === loadingId ? aiReplyMsg : m));
        // DO NOT DISPATCH TO WHATSAPP. DO NOT GENERATE AN INCIDENT TICKET.
        return;
      }

      // CASE 2: Legitimate POS Technical Failure / Error Code
      const incidentCardMsg = {
        id: `agt_${Date.now()}`,
        sender: 'assistant',
        isCard: true,
        errorIssue: result.errorIssue,
        reasonOfOccurrence: result.reasonOfOccurrence,
        solution: result.solution,
        contactName: result.contactName,
        phone: result.phone,
        email: result.email,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        errorRecord: {
          errorIssue: result.errorIssue,
          reasonOfOccurrence: result.reasonOfOccurrence,
          solution: result.solution,
          contactName: result.contactName,
          phone: result.phone,
          email: result.email,
          isBankDeflection: result.isBankDeflection
        }
      };
      setChatMessages((prev) => prev.map(m => m.id === loadingId ? incidentCardMsg : m));

      // Automatically dispatch to WhatsApp only when an actual error occurred
      dispatchAutoWhatsAppAlert({
        errorIssue: result.errorIssue,
        reasonOfOccurrence: result.reasonOfOccurrence,
        solution: result.solution,
        contactName: result.contactName,
        bankPhone: result.phone,
        bankEmail: result.email,
        storeName: currentProfile?.storeName,
        posId: currentProfile?.posId
      });
    } finally {
      isSendingRef.current = false;
      setInFlightQuery(null);
    }
  };

  // Auto-populate & trigger diagnostic from URL query parameters (e.g. ?error=TID+NOT+PRESENT)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasProcessedUrlParamRef.current) return;

    const hash = window.location.hash || '';
    if (hash.includes('?')) {
      const [, queryStr] = hash.split('?');
      const params = new URLSearchParams(queryStr);
      const errorParam = params.get('error');
      if (errorParam && errorParam.trim()) {
        hasProcessedUrlParamRef.current = true;
        try {
          window.history.replaceState(null, '', window.location.pathname + '#triage');
        } catch (_) {}
        handleSendMessage(errorParam.trim());
      }
    }
  }, []);

  // Autocomplete matching against official error records
  const autocompleteSuggestions = inputText.trim()
    ? MASTER_ERROR_RECORDS.filter(r => 
        r.errorIssue.toLowerCase().includes(inputText.toLowerCase().trim())
      )
    : [];

  const handleSelectChip = (errorIssueName) => {
    setShowAutocomplete(false);
    setInputText("");
    handleSendMessage(errorIssueName);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    setShowAutocomplete(false);
    handleSendMessage(text);
  };

  const handleClearChat = () => {
    setChatMessages([chatMessages[0]]);
    setActiveCategory(null);
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResendAlert = (msg) => {
    resendWhatsAppAlert(msg);
    setResentMessageId(msg.id);
    setTimeout(() => setResentMessageId(null), 3000);
  };

  const handleCreateTicketAction = (msg) => {
    const ticket = createPlutusTicket(msg.errorRecord.errorIssue);
    setCreatedTicketsMap(prev => ({ ...prev, [msg.id]: ticket }));
  };

  const handleDiagnoseAnother = () => {
    setActiveCategory(null);
    inputRef.current?.focus();
  };

  const toggleMic = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      setTimeout(() => {
        setInputText("TID NOT PRESENT");
        setIsListening(false);
        setShowAutocomplete(true);
      }, 1200);
    }
  };

  // Subtle single-line ghost suggestion text pills per spec
  const ghostSuggestions = [
    "TID NOT PRESENT",
    "Contact VI",
    "Card Decline",
    "Term Inactive-Amex",
    "Card Help TR"
  ];

  const hasConversations = chatMessages.length > 1;

  // Level 2 Specific Error Collections per Category
  const bankOrAggregatorErrors = MASTER_ERROR_RECORDS.filter(e => 
    (e.type === ERROR_TYPES.ACQUIRING_BANK || e.type === ERROR_TYPES.AGGREGATOR_INTERNAL) && 
    e.errorIssue !== "Term Inactive-Amex"
  );
  const cardRestrictionErrors = MASTER_ERROR_RECORDS.filter(e => 
    e.type === ERROR_TYPES.CUSTOMER_ISSUER
  );
  const amexErrors = MASTER_ERROR_RECORDS.filter(e => 
    e.errorIssue === "Term Inactive-Amex"
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[680px] transition-colors relative">
      
      {/* Subtle Top Metadata Context Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-pine animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            AI Triage Studio
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
            isNonAgg
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
          }`}>
            {isNonAgg ? "100% Zero-Touch Deflection" : "Pine Labs Switch Authority"}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono">
          {onNavigateToSimulator && (
            <button
              onClick={onNavigateToSimulator}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium transition flex items-center gap-1 cursor-pointer mr-1"
            >
              <span>← Back to POS Simulator</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isNonAgg ? "bg-rose-500" : "bg-emerald-500"}`} />
            <span className="text-slate-400">Pre-Bound: </span>
            <strong className="text-slate-800 dark:text-slate-200">{currentProfile.posId}</strong>
            <span className="text-slate-400">({currentProfile.architecture})</span>
          </div>

          {hasConversations && (
            <button
              onClick={handleClearChat}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 space-y-5 mb-6 overflow-y-auto">
        
        {/* Centered Ambient Greeting & Initial Gemini View (Pre-Bound with Zero POS ID Prompts) */}
        <div className="text-center py-6 sm:py-8 px-4 max-w-xl mx-auto space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex p-2.5 rounded-3xl bg-pine/10 border border-pine/20 text-pine mb-1">
            <Sparkles className="w-7 h-7 text-pine" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Hi <span className="bg-gradient-to-r from-[#00A859] via-emerald-500 to-teal-400 bg-clip-text text-transparent">{currentProfile.managerName}</span>, what's the issue with <span className="font-mono text-emerald-600 dark:text-emerald-400">POS_{currentProfile.posId.replace('POS_', '')}</span>?
            </h1>
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-pine" />
              <span>[{currentProfile.modelBadge} • {currentProfile.acquirer}]</span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed pt-1">
            Paste or type any POS error for instant root-cause analysis and automated WhatsApp dispatch.
          </p>
        </div>

        {/* Dynamic Conversational Sub-Options & Category Branching (Level 1 & Level 2) */}
        <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-4 sm:p-5 shadow-lg space-y-3.5 transition-colors">
          
          {/* Header & Category Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-pine" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Diagnostic Sub-Options
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeCategory ? `— Filtering ${activeCategory === "BANK_TID" ? "Bank/Aggregator TIDs" : activeCategory === "CARD_RESTRICTION" ? "Card Declines" : "Amex Setup"}` : "— Select an operational category"}
              </span>
            </div>

            {/* Quick Category Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl text-[11px] font-semibold border border-slate-200 dark:border-slate-800">
              <button
                id="cat-tab-bank"
                onClick={() => setActiveCategory(activeCategory === "BANK_TID" ? null : "BANK_TID")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeCategory === "BANK_TID"
                    ? isNonAgg
                      ? "bg-rose-600 text-white shadow-sm font-bold"
                      : "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{isNonAgg ? "🏦" : "⚡"}</span>
                <span>{isNonAgg ? "Bank TID" : "Aggregator"}</span>
              </button>

              <button
                id="cat-tab-card"
                onClick={() => setActiveCategory(activeCategory === "CARD_RESTRICTION" ? null : "CARD_RESTRICTION")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeCategory === "CARD_RESTRICTION"
                    ? "bg-amber-600 text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>💳</span>
                <span>Card Decline</span>
              </button>

              <button
                id="cat-tab-amex"
                onClick={() => setActiveCategory(activeCategory === "AMEX_SCHEME" ? null : "AMEX_SCHEME")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  activeCategory === "AMEX_SCHEME"
                    ? "bg-sky-600 text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>🛍️</span>
                <span>Amex</span>
              </button>

              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer text-[10px]"
                  title="View all categories"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Level 1: Category Branching Cards (When no category is selected) */}
          {!activeCategory ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  id="cat-btn-bank"
                  onClick={() => setActiveCategory("BANK_TID")}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5 shadow-sm group active:scale-98 ${
                    isNonAgg
                      ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-900/30 text-rose-800 dark:text-rose-200"
                      : "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <span className="text-base">{isNonAgg ? "🏦" : "⚡"}</span>
                    <span>{isNonAgg ? "Bank TID Errors" : "Aggregator Switch / TID"}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                    {isNonAgg 
                      ? "TID deactivations requiring 100% direct bank deflection."
                      : "Pine Labs master merchant switch re-routes & limits."}
                  </p>
                  <span className="text-[10px] font-mono font-semibold pt-1">
                    {isNonAgg ? "HDFC Bank Desk" : "Plutus Priority Desk"} →
                  </span>
                </button>

                <button
                  id="cat-btn-card"
                  onClick={() => setActiveCategory("CARD_RESTRICTION")}
                  className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-left transition cursor-pointer flex flex-col justify-between space-y-1.5 shadow-sm group active:scale-98"
                >
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <span className="text-base">💳</span>
                    <span>Customer Card Issues</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                    Fund restrictions, daily caps & referral responses. Terminal is 100% OK.
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold pt-1">
                    Card Issuer Guidance →
                  </span>
                </button>

                <button
                  id="cat-btn-amex"
                  onClick={() => setActiveCategory("AMEX_SCHEME")}
                  className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/70 dark:hover:bg-sky-900/30 text-sky-800 dark:text-sky-200 text-left transition cursor-pointer flex flex-col justify-between space-y-1.5 shadow-sm group active:scale-98"
                >
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <span className="text-base">🛍️</span>
                    <span>Amex Scheme Setup</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                    American Express OptBlue enablement & mid-tier onboarding.
                  </p>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold pt-1">
                    Amex Merchant Desk →
                  </span>
                </button>
              </div>

              {/* Quick Natural Language Inquiries */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="text-[10.5px] uppercase font-bold text-slate-400 font-mono">
                  Common Cashier Triage Inquiries:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSelectChip("TID NOT PRESENT")}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>❓</span>
                    <span>Why does terminal show <strong>"TID NOT PRESENT"</strong>?</span>
                  </button>
                  <button
                    onClick={() => handleSelectChip("Contact VI")}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>❓</span>
                    <span>What does <strong>"Contact VI"</strong> mean on HDFC terminal?</span>
                  </button>
                  <button
                    onClick={() => handleSelectChip("Card Decline")}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>❓</span>
                    <span>Is our terminal faulty when <strong>"Card Decline"</strong> occurs?</span>
                  </button>
                  {(() => {
                    const isAmexActive = (inFlightQuery === "Term Inactive-Amex" || (isDispatchingWhatsApp && inFlightQuery?.toLowerCase().includes("amex")));
                    return (
                      <button
                        disabled={Boolean(inFlightQuery || isDispatchingWhatsApp)}
                        onClick={() => handleSelectChip("Term Inactive-Amex")}
                        className={`px-3 py-1.5 rounded-xl border text-xs transition flex items-center gap-1.5 ${
                          isAmexActive
                            ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 text-amber-900 dark:text-amber-100 cursor-wait animate-pulse"
                            : inFlightQuery || isDispatchingWhatsApp
                            ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500"
                            : "bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                        }`}
                      >
                        <span>{isAmexActive ? "⏳" : "❓"}</span>
                        <span>{isAmexActive ? "Sending Amex alert..." : <>How to activate <strong>American Express</strong> on this POS?</>}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* Level 2: Expanded Specific Error Sub-Options with Rich Meta */
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>
                  {activeCategory === "BANK_TID" && (isNonAgg ? "Select Acquiring Bank Error for Instant Deflection:" : "Select Aggregator Switch Error for Internal L2 Routing:")}
                  {activeCategory === "CARD_RESTRICTION" && "Select Customer Card Restriction (Confirm Terminal Uptime):"}
                  {activeCategory === "AMEX_SCHEME" && "Select American Express Provisioning Exception:"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Click to trigger instant diagnosis</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCategory === "BANK_TID" && bankOrAggregatorErrors.map((err) => (
                  <button
                    key={err.id}
                    disabled={Boolean(inFlightQuery || isDispatchingWhatsApp)}
                    onClick={() => handleSelectChip(err.errorIssue)}
                    className={`p-2.5 rounded-2xl border text-left transition shadow-sm flex flex-col justify-between space-y-1 ${
                      inFlightQuery || isDispatchingWhatsApp
                        ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-500"
                        : isNonAgg
                        ? "bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800 cursor-pointer active:scale-98"
                        : "bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 cursor-pointer active:scale-98"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs">{err.errorIssue}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        isNonAgg ? "bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100" : "bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100"
                      }`}>
                        {isNonAgg ? "Bank Deflect" : "Pine Labs L2"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                      {err.reasonOfOccurrence}
                    </span>
                  </button>
                ))}

                {activeCategory === "CARD_RESTRICTION" && cardRestrictionErrors.map((err) => (
                  <button
                    key={err.id}
                    disabled={Boolean(inFlightQuery || isDispatchingWhatsApp)}
                    onClick={() => handleSelectChip(err.errorIssue)}
                    className={`p-2.5 rounded-2xl border text-left transition shadow-sm flex flex-col justify-between space-y-1 ${
                      inFlightQuery || isDispatchingWhatsApp
                        ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-500"
                        : "border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 cursor-pointer active:scale-98"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs">{err.errorIssue}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-bold uppercase">
                        Terminal 100% OK
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                      {err.reasonOfOccurrence}
                    </span>
                  </button>
                ))}

                {activeCategory === "AMEX_SCHEME" && amexErrors.map((err) => {
                  const isThisActive = (inFlightQuery === err.errorIssue || (isDispatchingWhatsApp && inFlightQuery?.toLowerCase().includes("amex")));
                  return (
                    <button
                      key={err.id}
                      disabled={Boolean(inFlightQuery || isDispatchingWhatsApp)}
                      onClick={() => handleSelectChip(err.errorIssue)}
                      className={`p-2.5 rounded-2xl border text-left transition shadow-sm flex flex-col justify-between space-y-1 sm:col-span-2 ${
                        isThisActive
                          ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100 cursor-wait ring-2 ring-amber-400"
                          : inFlightQuery || isDispatchingWhatsApp
                          ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500"
                          : "border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-200 cursor-pointer active:scale-98"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">{err.errorIssue}</span>
                        {isThisActive ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold uppercase animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                            Sending...
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-900/80 text-sky-900 dark:text-sky-100 font-bold uppercase">
                            OptBlue Setup
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                        {err.reasonOfOccurrence} — Direct contact to Amex India Merchant Services (1800 419 1414).
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Message Stream */}
        {chatMessages.map((msg) => {
          const isAgent = msg.sender === "agent" || msg.sender === "assistant";
          if (msg.id.startsWith("init_") && hasConversations) return null;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isAgent ? "justify-start" : "justify-end"} animate-in fade-in duration-150`}
            >
              {isAgent && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00382B] to-[#00A859] text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[95%] sm:max-w-[85%] text-xs transition-all ${
                isAgent
                  ? "w-full text-slate-800 dark:text-slate-200"
                  : "bg-pine text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-sm ml-auto"
              }`}>
                {msg.isCard || msg.errorRecord ? (
                  <TriageResultCard
                    msg={msg}
                    isNonAgg={isNonAgg}
                    currentProfile={currentProfile}
                    customPhoneNumber={customPhoneNumber}
                    createdTicketsMap={createdTicketsMap}
                    copiedKey={copiedKey}
                    resentMessageId={resentMessageId}
                    onCopyText={handleCopyText}
                    onResendAlert={handleResendAlert}
                    onCreateTicket={handleCreateTicketAction}
                    onCallModal={setActiveCallModal}
                    onEmailModal={setActiveEmailModal}
                    onDiagnoseAnother={handleDiagnoseAnother}
                    onNavigateToWhatsApp={onNavigateToWhatsApp}
                  />

                ) : msg.isLoading ? (
                  <div className="bg-white dark:bg-[#161D2B] border border-emerald-500/40 rounded-2xl p-4 shadow-sm flex items-center space-x-3 text-sm text-slate-800 dark:text-slate-200 animate-in fade-in">
                    <RefreshCw className="w-5 h-5 text-pine animate-spin flex-shrink-0" />
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 text-pine">
                        <Sparkles className="w-4 h-4 text-pine animate-pulse" />
                        <span>Consulting Google Gemini 3.8 Flash...</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Analyzing POS incident against Pine Labs Excel SOP Knowledge Base
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-2xl p-4 shadow-sm text-sm">
                    {msg.text}
                  </div>
                )}
              </div>

              {!isAgent && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Gemini-Style Prompt / Search Pill Container */}
      <div className="sticky bottom-4 z-20 pt-2 space-y-2.5">
        
        {/* Live Typeahead Autocomplete Dropdown */}
        {showAutocomplete && autocompleteSuggestions.length > 0 && (
          <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-2.5 shadow-2xl max-h-56 overflow-y-auto space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
              Matching Pine Labs Diagnostic Codes:
            </div>
            {autocompleteSuggestions.map((item) => {
              const ruleBadge = 
                item.errorIssue === "Term Inactive-Amex"
                  ? "Amex Scheme"
                  : item.type === ERROR_TYPES.CUSTOMER_ISSUER
                  ? "Card Issuer"
                  : isNonAgg
                  ? "Bank TID"
                  : "Aggregator Switch";

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectChip(item.errorIssue)}
                  className="px-3.5 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex justify-between items-center transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-pine" />
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{item.errorIssue}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-sm font-sans">
                      — {item.reasonOfOccurrence}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-semibold">
                    {ruleBadge}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Gemini-Style Search & Prompt Pill (rounded-full py-4 px-6) */}
        <form onSubmit={handleSend} className="relative flex items-center shadow-xl rounded-full">
          <div className="relative flex-1 flex items-center bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-full py-3.5 px-5 sm:py-4 sm:px-6 focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/30 transition">
            <Search className="w-5 h-5 text-pine mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onFocus={() => setShowAutocomplete(true)}
              onChange={(e) => {
                setInputText(e.target.value);
                setShowAutocomplete(true);
              }}
              placeholder={`Ask Sentinel or type error for POS #${currentProfile.posId}...`}
              className="bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full font-sans"
            />

            <button
              type="button"
              onClick={toggleMic}
              className={`p-2 rounded-full transition mr-2 cursor-pointer ${
                isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="Simulate Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Circular green send action button (#00A859) */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[#00A859] hover:bg-[#008F4C] text-slate-950 font-bold transition disabled:opacity-30 disabled:hover:bg-[#00A859] cursor-pointer flex items-center justify-center shadow-md active:scale-95 flex-shrink-0"
              title="Diagnose Error"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Clean Ghost Suggestions (When Input is Empty) */}
        {!inputText.trim() && (
          <div className="flex items-center justify-center space-x-2 overflow-x-auto py-1 text-center">
            {ghostSuggestions.map((errorText) => (
              <button
                key={errorText}
                onClick={() => handleSelectChip(errorText)}
                className="px-3 py-1 rounded-full text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-pine dark:hover:text-emerald-300 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer whitespace-nowrap active:scale-95"
              >
                "{errorText}"
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Filled Escalation Email Modal */}
      {activeEmailModal && (
        <EmailDraftModal
          isOpen={true}
          onClose={() => setActiveEmailModal(null)}
          errorIssue={activeEmailModal.errorRecord?.errorIssue || activeEmailModal.errorRecord?.errorIdentified}
          bankDetails={activeEmailModal.bankDetails}
          posData={currentPos}
          storeData={currentStore}
          customDraft={activeEmailModal.prefilledEmail || activeEmailModal.errorRecord?.prefilledEmail}
        />
      )}

      {/* Dialing Feedback Modal */}
      {activeCallModal && (
        <CallSimulatorModal
          isOpen={true}
          onClose={() => setActiveCallModal(null)}
          bankName={activeCallModal.bankName}
          phoneNumber={activeCallModal.phoneNumber}
          storeData={currentStore}
        />
      )}
    </div>
  );
}
