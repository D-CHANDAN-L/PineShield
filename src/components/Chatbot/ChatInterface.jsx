import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCcw, CheckCheck, MessageSquare } from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import { MASTER_ERROR_RECORDS, ERROR_TYPES } from '../../data/sopRules';
import { BANK_ESCALATION_DIRECTORY } from '../../data/bankContacts';

export default function ChatInterface() {
  const { 
    chatMessages, 
    setChatMessages, 
    currentStore, 
    currentPos, 
    dispatchWhatsAppAlert 
  } = useMerchant();

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSelectErrorChip = (errorIssueName) => {
    handleProcessTriage(errorIssueName);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    handleProcessTriage(text);
  };

  const handleProcessTriage = (queryText) => {
    // 1. Post User Message
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Classify against master table
    setTimeout(() => {
      const matchedRecord = MASTER_ERROR_RECORDS.find(r => 
        r.errorIssue.toLowerCase() === queryText.toLowerCase() ||
        queryText.toLowerCase().includes(r.errorIssue.toLowerCase())
      );

      const acquirerBank = currentPos?.primaryAcquirer || "HDFC Bank";
      const bankDetails = BANK_ESCALATION_DIRECTORY[acquirerBank] || BANK_ESCALATION_DIRECTORY["HDFC Bank"];

      let responsePayload;

      if (matchedRecord) {
        // Automatically dispatch to WhatsApp
        dispatchWhatsAppAlert(
          { code: matchedRecord.errorIssue },
          bankDetails
        );

        responsePayload = {
          id: `agt_${Date.now()}`,
          sender: "agent",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchedRecord: matchedRecord,
          bankDetails: bankDetails,
          autoDispatched: true
        };
      } else {
        responsePayload = {
          id: `agt_${Date.now()}`,
          sender: "agent",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I received your inquiry: "${queryText}". Please select one of the standard Pine Labs Error Issues below for automated diagnosis and instant WhatsApp escalation.`
        };
      }

      setChatMessages(prev => [...prev, responsePayload]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[560px] bg-pine-surface/90 border border-pine-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="px-4 py-3 bg-pine-card/90 border-b border-pine-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-pine/15 border border-pine/30 flex items-center justify-center text-pine">
            <Bot className="w-5 h-5"/>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white">POS Support Specialist</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">Zero-Touch Deflection • Auto-WhatsApp Connected</p>
          </div>
        </div>

        <button
          onClick={() => setChatMessages([chatMessages[0]])}
          className="text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
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
              className={`flex items-start gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
            >
              {isAgent && (
                <div className="w-7 h-7 rounded-lg bg-pine/20 border border-pine/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4"/>
                </div>
              )}

              <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs shadow-md ${
                isAgent
                  ? "bg-pine-card border border-pine-border text-slate-200"
                  : "bg-emerald-600 text-white font-medium ml-auto"
              }`}>
                {msg.matchedRecord ? (
                  <div className="space-y-2.5">
                    {/* Header Badge */}
                    <div className="flex justify-between items-center pb-2 border-b border-pine-border">
                      <span className="font-mono font-bold text-sm text-white">
                        {msg.matchedRecord.errorIssue}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        msg.matchedRecord.type === ERROR_TYPES.ACQUIRING_BANK
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}>
                        {msg.matchedRecord.type === ERROR_TYPES.ACQUIRING_BANK ? "Acquiring Bank Issue" : "Customer Card Issue"}
                      </span>
                    </div>

                    {/* Reason of Occurrence */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Reason of Occurrence:</div>
                      <div className="text-xs text-rose-300 font-semibold mt-0.5">
                        {msg.matchedRecord.reasonOfOccurrence}
                      </div>
                    </div>

                    {/* Official Solution */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Required Solution:</div>
                      <div className="text-xs text-slate-200 font-medium mt-0.5">
                        {msg.matchedRecord.solution}
                      </div>
                    </div>

                    {/* Contact Info (if bank issue) */}
                    {msg.matchedRecord.deflectBank && msg.bankDetails && (
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1">
                        <div>📞 Bank Desk: <strong className="text-emerald-400">{msg.bankDetails.supportDeskPhone}</strong></div>
                        <div>✉️ Bank Email: <span className="font-mono text-sky-400">{msg.bankDetails.emailL1}</span></div>
                      </div>
                    )}

                    {/* Auto-Dispatched to WhatsApp Confirmation Banner */}
                    <div className="bg-emerald-950/50 border border-emerald-500/50 p-2 rounded-xl flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400"/>
                        Solution auto-sent to WhatsApp ({currentStore?.managerPhone || '+91 98450 12345'})
                      </span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]"/>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                )}

                <div className={`text-[9px] mt-2 flex items-center gap-1 ${
                  isAgent ? "text-slate-400" : "text-emerald-200 justify-end"
                }`}>
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {!isAgent && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4"/>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs italic p-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin"/>
            <span>Looking up Pine Labs error and firing WhatsApp dispatch...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Error Options (Direct from user's table) */}
      <div className="px-3 py-2 bg-pine-slate border-t border-pine-border/60">
        <div className="text-[9px] uppercase font-bold text-slate-400 mb-1.5">Select Error for Instant Solution & WhatsApp Alert:</div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
          {MASTER_ERROR_RECORDS.map((err) => (
            <button
              key={err.id}
              onClick={() => handleSelectErrorChip(err.errorIssue)}
              className="px-2.5 py-1 rounded-md bg-pine-card border border-pine-border hover:border-emerald-500 hover:text-emerald-300 whitespace-nowrap transition font-mono text-slate-300 cursor-pointer"
            >
              {err.errorIssue}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Field */}
      <form onSubmit={handleSendMessage} className="p-3 bg-pine-card/60 border-t border-pine-border flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type any error (e.g. Contact VI, Card Decline, TID NOT PRESENT)..."
          className="flex-1 bg-slate-950/80 border border-pine-border rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 cursor-pointer"
          disabled={!inputText.trim()}
        >
          <Send className="w-4 h-4"/>
        </button>
      </form>
    </div>
  );
}
