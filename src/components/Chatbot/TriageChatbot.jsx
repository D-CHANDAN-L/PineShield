import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  RefreshCcw, 
  CheckCheck, 
  Mail, 
  PhoneCall, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  Phone
} from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS } from '../../data/sopRules';
import EmailDraftModal from './EmailDraftModal';
import CallSimulatorModal from '../WhatsApp/CallSimulatorModal';

export default function TriageChatbot() {
  const {
    chatMessages,
    setChatMessages,
    currentProfile,
    currentStore,
    currentPos,
    customPhoneNumber,
    processTriageDiagnosis,
    isConsultingAi
  } = useMerchant();

  const [inputText, setInputText] = useState("");
  const [activeEmailModal, setActiveEmailModal] = useState(null);
  const [activeCallModal, setActiveCallModal] = useState(null);
  const messagesEndRef = useRef(null);

  const targetPhone = customPhoneNumber || currentProfile.managerPhone;
  const isNonAgg = currentProfile.architecture === "Non-Aggregator";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isConsultingAi]);

  const handleSelectChip = (errorIssueName) => {
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: errorIssueName
    };
    setChatMessages(prev => [...prev, userMsg]);
    processTriageDiagnosis(errorIssueName);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text
    };
    setChatMessages(prev => [...prev, userMsg]);
    processTriageDiagnosis(text);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-[#243044] rounded-3xl overflow-hidden shadow-2xl transition-colors">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200 dark:border-[#243044] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-pine/15 border border-pine/30 flex items-center justify-center text-pine">
            <Bot className="w-5 h-5"/>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">POS Sentinel Operations AI</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentProfile.posId} • {currentProfile.architecture}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Dual-Engine Triage: Deterministic Fast-Path (&lt;5ms) + Gemini 2.5 Flash Grounding
            </p>
          </div>
        </div>

        <button
          onClick={() => setChatMessages([chatMessages[0]])}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          title="Reset conversation"
        >
          <RefreshCcw className="w-3.5 h-3.5"/>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => {
          const isAgent = msg.sender === "agent";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAgent ? "justify-start" : "justify-end"} animate-in fade-in duration-150`}
            >
              {isAgent && (
                <div className="w-7 h-7 rounded-lg bg-pine/20 border border-pine/30 flex items-center justify-center text-pine flex-shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-4 h-4"/>
                </div>
              )}

              <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-xs shadow-md transition-all ${
                isAgent
                  ? "bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 w-full"
                  : "bg-pine text-slate-950 font-bold ml-auto"
              }`}>
                {msg.isLoading ? (
                  /* Spinner: Consulting Pine Labs Sentinel AI (Gemini 2.5 Flash)... */
                  <div className="flex items-center space-x-3 py-2">
                    <RefreshCw className="w-5 h-5 text-pine animate-spin flex-shrink-0" />
                    <div>
                      <div className="font-bold text-pine flex items-center gap-1.5 text-xs sm:text-sm">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Consulting Pine Labs Sentinel AI (Gemini 2.5 Flash)...</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Analyzing POS incident against Pine Labs Excel SOP Knowledge Base
                      </div>
                    </div>
                  </div>
                ) : msg.errorRecord ? (
                  <div className="space-y-3">
                    {/* Header Badge */}
                    <div className="flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {msg.errorRecord.errorIssue || msg.errorRecord.errorIdentified}
                          </span>
                          {msg.isGemini || msg.engine?.includes("gemini") ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                              Gemini 2.5 Flash
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ⚡ Local Fast-Path (&lt;5ms)
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {currentProfile.posId}
                      </span>
                    </div>

                    {/* 1. Problem (Reason of Occurrence) */}
                    <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>Problem & Cause:</span>
                      </div>
                      <div className="text-xs text-rose-600 dark:text-rose-300 font-semibold pl-4">
                        {msg.errorRecord.reasonOfOccurrence}
                      </div>
                    </div>

                    {/* 2. Official Solution */}
                    <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Solution:</span>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-100 font-medium pl-4 whitespace-pre-line leading-relaxed">
                        {msg.errorRecord.solution}
                      </div>
                    </div>

                    {/* 3. Whom to Contact */}
                    {msg.bankDetails && (
                      <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 font-mono">
                        <div className="text-[10px] uppercase font-bold text-sky-500 font-sans">Whom to Contact:</div>
                        <div>Target: <strong className="text-slate-900 dark:text-white">{msg.deflectionTarget || "HDFC Bank Merchant Helpdesk"}</strong></div>
                        {msg.bankDetails?.tollFree && <div>Phone: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{msg.bankDetails.tollFree}</span></div>}
                        {msg.bankDetails?.email && <div>Email: <span className="text-sky-600 dark:text-sky-400">{msg.bankDetails.email}</span></div>}
                      </div>
                    )}

                    {/* Action Channel Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Direct Dial Button */}
                      {(msg.bankDetails?.tollFree || isNonAgg) && (
                        <button
                          onClick={() => setActiveCallModal({
                            bankName: msg.deflectionTarget || "Acquiring Bank Helpdesk",
                            phoneNumber: msg.bankDetails?.tollFree || "1800 202 6161"
                          })}
                          className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-sky-500"/>
                          <span>Direct Dial Helpdesk</span>
                        </button>
                      )}

                      {/* Action Button for Pre-Filled Email */}
                      {(isNonAgg || msg.errorRecord.deflectBank || msg.prefilledEmail || msg.errorRecord?.prefilledEmail) && (
                        <button
                          onClick={() => setActiveEmailModal(msg)}
                          className="py-2 px-3 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-500"/>
                          <span>View Pre-Filled Email</span>
                        </button>
                      )}
                    </div>

                    {/* Verified Delivery Confirmation Banner */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/50 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-200 font-semibold shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-[#53BDEB]"/>
                        <span>✓ Solution auto-dispatched to Store Manager WhatsApp ({targetPhone})</span>
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 font-bold">
                        SENT
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">{msg.text}</div>
                )}

                <div className={`text-[9px] mt-2 flex items-center gap-1 ${
                  isAgent ? "text-slate-400" : "text-emerald-950 justify-end font-mono"
                }`}>
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {!isAgent && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4"/>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Error Chips */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-[#0B0F17] border-t border-slate-200 dark:border-[#243044]">
        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Quick 12 Deterministic Errors (&lt;5ms Lookup):</span>
          <span className="text-[9px] font-normal text-slate-400">Click to diagnose instantly</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {MASTER_ERROR_RECORDS.slice(0, 10).map((err) => (
            <button
              key={err.id}
              onClick={() => handleSelectChip(err.errorIssue)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 hover:border-pine hover:text-pine whitespace-nowrap transition font-mono text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm active:scale-95"
            >
              {err.errorIssue}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Field */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#161D2B] border-t border-slate-200 dark:border-[#243044] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type ANY error or query (e.g. Alert Erruption, Customer App Not Working, LLT Mode)...`}
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-pine transition"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-pine hover:bg-pine-dark text-slate-950 font-bold transition disabled:opacity-40 cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
          disabled={!inputText.trim()}
          title="Submit inquiry"
        >
          <Send className="w-4 h-4"/>
        </button>
      </form>

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
