import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Send, 
  Mic, 
  User, 
  Trash2,
  RefreshCw,
  Bot,
  Layers,
  ChevronDown,
  X,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';
import TriageResultCard from './TriageResultCard';
import EmailDraftModal from './EmailDraftModal';
import CallSimulatorModal from '../WhatsApp/CallSimulatorModal';
import { askGemini } from '../../utils/gemini';
import { useRouter } from '../../hooks/useRouter';

// Common Cashier Triage Questions from SOP
const CASHIER_QUESTIONS = [
  {
    id: "q_tid_present",
    question: 'Why does terminal show "TID NOT PRESENT"?',
    query: "TID NOT PRESENT",
    badge: "Bank TID FAQ",
    subtext: "Acquiring bank TID deactivation diagnosis"
  },
  {
    id: "q_contact_vi",
    question: 'What does "Contact VI" mean on HDFC terminal?',
    query: "Contact VI",
    badge: "Bank TID FAQ",
    subtext: "Acquiring bank TID deactivation diagnosis"
  },
  {
    id: "q_card_decline",
    question: 'Is our terminal faulty when "Card Decline" occurs?',
    query: "Card Decline",
    badge: "Card Issuer FAQ",
    subtext: "Customer card fund/service restrictions (Terminal OK)"
  },
  {
    id: "q_amex_setup",
    question: "How to activate American Express on this POS?",
    query: "Term Inactive-Amex",
    badge: "Amex FAQ",
    subtext: "OptBlue scheme onboarding & Amex merchant desk"
  }
];

// Helper to determine if input query is conversational greeting
const isGreetingQuery = (text) => {
  const clean = text.trim().toLowerCase();
  return /^(h+i+|h+e+y+|h+e+l+l+o+|h+e+y+a+|howdy|good\s*(morning|afternoon|evening|day)|thanks|thank\s*you|bye|goodbye|namaste|sup)[\s!.]*$/i.test(clean);
};

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
    isDispatchingWhatsApp,
    contextToast,
    setContextToast
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
  const [showBrowseCategories, setShowBrowseCategories] = useState(false);
  
  // Conversational Branching State: null (Level 1), "BANK_TID" (Level 2), "CARD_RESTRICTION" (Level 2), "AMEX_SCHEME" (Level 2)
  const [activeCategory, setActiveCategory] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isNonAgg = currentProfile?.architecture === "Non-Aggregator";
  const hasConversations = chatMessages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isSendingRef = useRef(false);
  const lastSendTimeRef = useRef(0);
  const hasProcessedUrlParamRef = useRef(false);
  const { queryParams } = useRouter();

  useEffect(() => {
    if (queryParams?.error && !hasProcessedUrlParamRef.current) {
      hasProcessedUrlParamRef.current = true;
      setInputText(queryParams.error);
    }
  }, [queryParams]);

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
        noContactNeeded: result.noContactNeeded,
        requiresRetryFirst: result.requiresRetryFirst,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        errorRecord: {
          errorIssue: result.errorIssue,
          reasonOfOccurrence: result.reasonOfOccurrence,
          solution: result.solution,
          contactName: result.contactName,
          phone: result.phone,
          email: result.email,
          noContactNeeded: result.noContactNeeded,
          requiresRetryFirst: result.requiresRetryFirst,
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

  // Contextual live-filtered suggestions from SOP Master Errors & Cashier FAQs
  const autocompleteSuggestions = useMemo(() => {
    const term = inputText.trim().toLowerCase();
    // Must be 2+ characters and NOT a greeting
    if (term.length < 2 || isGreetingQuery(term)) {
      return [];
    }

    const errorMatches = [];
    const faqMatches = [];

    // Match Master Error Records
    MASTER_ERROR_RECORDS.forEach((err) => {
      const issueLower = err.errorIssue.toLowerCase();
      const reasonLower = err.reasonOfOccurrence.toLowerCase();
      const categoryLower = (err.category || "").toLowerCase();

      const issueMatch = issueLower.includes(term);
      const reasonMatch = reasonLower.includes(term);
      const categoryMatch = categoryLower.includes(term);
      const amexMatch = term.includes("amex") && issueLower.includes("amex");
      const tidMatch = term.includes("tid") && (issueLower.includes("tid") || reasonLower.includes("tid"));

      if (issueMatch || reasonMatch || categoryMatch || amexMatch || tidMatch) {
        const badge = 
          err.errorIssue === "Term Inactive-Amex"
            ? "Amex Scheme"
            : err.type === ERROR_TYPES.CUSTOMER_ISSUER
            ? "Card Issuer"
            : isNonAgg
            ? "Bank TID"
            : "Aggregator Switch";

        errorMatches.push({
          id: `err_${err.id}`,
          type: "error",
          errorIssue: err.errorIssue,
          query: err.errorIssue,
          label: err.errorIssue,
          reasonOfOccurrence: err.reasonOfOccurrence,
          badge,
          isExact: issueLower.startsWith(term)
        });
      }
    });

    // Match Cashier FAQs
    CASHIER_QUESTIONS.forEach((faq) => {
      const qLower = faq.question.toLowerCase();
      const queryLower = faq.query.toLowerCase();
      const subLower = faq.subtext.toLowerCase();

      if (qLower.includes(term) || queryLower.includes(term) || subLower.includes(term)) {
        faqMatches.push({
          id: faq.id,
          type: "faq",
          errorIssue: faq.query,
          query: faq.query,
          label: faq.question,
          reasonOfOccurrence: faq.subtext,
          badge: faq.badge,
          isExact: queryLower.startsWith(term)
        });
      }
    });

    // Sort exact prefix matches first, then errors, then FAQs
    errorMatches.sort((a, b) => (b.isExact ? 1 : 0) - (a.isExact ? 1 : 0));

    return [...errorMatches, ...faqMatches].slice(0, 6);
  }, [inputText, isNonAgg]);

  const handleSelectSuggestion = (suggestionQuery) => {
    setShowAutocomplete(false);
    setInputText("");
    handleSendMessage(suggestionQuery);
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
    setChatMessages([]);
    setActiveCategory(null);
    setInputText("");
    setShowAutocomplete(false);
    setShowBrowseCategories(false);
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

  // Level 2 Specific Error Collections per Category (for expandable browsing)
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
    <div className="max-w-3xl mx-auto flex flex-col min-h-[75vh] transition-colors relative">
      
      {/* Transient Context-Switch Toast Notification */}
      {contextToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md border border-slate-700/60 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium">{contextToast}</span>
            </div>
            <button 
              onClick={() => setContextToast && setContextToast(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded-full transition cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Subtle Top Metadata Context Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-pine animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            PineShield
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono">
          {onNavigateToSimulator && (
            <button
              onClick={onNavigateToSimulator}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <span>← Back to POS Simulator</span>
            </button>
          )}

          {hasConversations && (
            <button
              onClick={handleClearChat}
              className="p-1 px-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs"
              title="Reset conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MINIMAL LANDING STATE (when chatMessages is empty)                      */}
      {/* ========================================================================= */}
      {!hasConversations ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] sm:min-h-[70vh] px-4 py-8 max-w-2xl mx-auto w-full text-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Sparkle Icon */}
          <div className="inline-flex p-3 rounded-3xl bg-pine/10 border border-pine/20 text-pine mb-5 shadow-sm">
            <Sparkles className="w-8 h-8 text-pine animate-pulse" />
          </div>

          {/* Personalized Greeting */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 leading-snug">
            Hi <span className="bg-gradient-to-r from-[#00A859] via-emerald-500 to-teal-400 bg-clip-text text-transparent">{currentProfile.managerName}</span>, what's the issue with <span className="font-mono text-emerald-600 dark:text-emerald-400">POS_{currentProfile.posId.replace('POS_', '')}</span>?
          </h1>

          {/* Small Muted Context Line */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 font-mono">
            {currentProfile.architecture} • {currentProfile.acquirer}
          </p>

          {/* Single Centered Input Container with Live Dropdown */}
          <div className="w-full max-w-xl relative">
            
            {/* Live Autocomplete Dropdown (surfaces on 2+ chars, hidden on greetings) */}
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-2.5 shadow-2xl z-30 max-h-64 overflow-y-auto text-left animate-in fade-in duration-150">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 font-mono flex items-center justify-between">
                  <span>Matching SOP Diagnostics:</span>
                  <span className="text-[9px] text-slate-400">Click to diagnose</span>
                </div>
                {autocompleteSuggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSuggestion(item.query)}
                    className="px-3.5 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex justify-between items-center transition group"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden pr-2">
                      <span className="w-2 h-2 rounded-full bg-pine flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                          {item.label}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block font-sans">
                          {item.reasonOfOccurrence}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-semibold flex-shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Centered Gemini-Style Search Input Pill */}
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
                  placeholder={`Ask PineShield or type error for POS #${currentProfile.posId}...`}
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

            {/* Subtle Expandable Browse Trigger */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                id="toggle-browse-categories"
                onClick={() => setShowBrowseCategories(prev => !prev)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer px-3.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showBrowseCategories ? "Hide diagnostic categories" : "Browse SOP categories & FAQs"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showBrowseCategories ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expandable Category & Cashier FAQ Drawer (only visible when toggled) */}
          {showBrowseCategories && (
            <div className="mt-6 w-full text-left bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-4 sm:p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-pine" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Diagnostic Sub-Options
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeCategory ? `— Filtering ${activeCategory === "BANK_TID" ? "Bank/Aggregator TIDs" : activeCategory === "CARD_RESTRICTION" ? "Card Declines" : "Amex Setup"}` : "— Select an operational category"}
                  </span>
                </div>

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

              {/* Level 1: Category Cards */}
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

                  {/* Common Cashier Questions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="text-[10.5px] uppercase font-bold text-slate-400 font-mono">
                      Common Cashier Triage Inquiries:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CASHIER_QUESTIONS.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleSelectSuggestion(q.query)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>❓</span>
                          <span>{q.question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Level 2: Expanded Error Cards */
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
                        onClick={() => handleSelectSuggestion(err.errorIssue)}
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
                        onClick={() => handleSelectSuggestion(err.errorIssue)}
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

                    {activeCategory === "AMEX_SCHEME" && amexErrors.map((err) => (
                      <button
                        key={err.id}
                        disabled={Boolean(inFlightQuery || isDispatchingWhatsApp)}
                        onClick={() => handleSelectSuggestion(err.errorIssue)}
                        className={`p-2.5 rounded-2xl border text-left transition shadow-sm flex flex-col justify-between space-y-1 sm:col-span-2 ${
                          inFlightQuery || isDispatchingWhatsApp
                            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500"
                            : "border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-200 cursor-pointer active:scale-98"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs">{err.errorIssue}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-900/80 text-sky-900 dark:text-sky-100 font-bold uppercase">
                            OptBlue Setup
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                          {err.reasonOfOccurrence} — Direct contact to Amex India Merchant Services (1800 419 1414).
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ACTIVE CONVERSATION STREAM (when chatMessages.length > 0)             */
        /* ========================================================================= */
        <>
          <div className="flex-1 space-y-5 mb-6 overflow-y-auto">
            {chatMessages.map((msg) => {
              const isAgent = msg.sender === "agent" || msg.sender === "assistant";
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

          {/* Sticky Bottom Prompt Pill Container */}
          <div className="sticky bottom-4 z-20 pt-2 space-y-2">
            
            {/* Live Autocomplete Dropdown above input */}
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div className="bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl p-2.5 shadow-2xl max-h-56 overflow-y-auto space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 font-mono">
                  Matching Pine Labs Diagnostic Codes:
                </div>
                {autocompleteSuggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSuggestion(item.query)}
                    className="px-3.5 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex justify-between items-center transition"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden pr-2">
                      <span className="w-2 h-2 rounded-full bg-pine flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                          {item.label}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block font-sans">
                          {item.reasonOfOccurrence}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-semibold flex-shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
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
                  placeholder={`Ask PineShield or type error for POS #${currentProfile.posId}...`}
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
          </div>
        </>
      )}

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
