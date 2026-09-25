import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMerchant } from '../../context/MerchantContext';
import { useAudioChime } from './useAudioChime';
import EmailDraftModal from '../Chatbot/EmailDraftModal';
import CallSimulatorModal from './CallSimulatorModal';
import WhatsAppMessageBubble from './WhatsAppMessageBubble';
import { sendAutomatedWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { 
  BadgeCheck, 
  Search, 
  Phone, 
  MoreVertical, 
  ShieldCheck, 
  CheckCheck, 
  Smartphone,
  Lock, 
  Wrench, 
  X, 
  Zap 
} from 'lucide-react';

export default function WhatsAppSimulator({ onNavigateToSimulator }) {
  const merchantContext = useMerchant() || {};
  const { 
    whatsAppMessages: rawMessages = [], 
    whatsAppAlerts: rawAlerts = [],
    currentProfile,
    currentStore,
    currentPos,
    customPhoneNumber,
    setIsPhoneModalOpen = () => {},
    setHasUnreadAlert = () => {} 
  } = merchantContext;

  // Defensive profile, store, pos resolution
  const profile = currentProfile || {
    profileId: "croma_non_agg",
    storeName: "Croma Indiranagar",
    managerName: "Rajesh Kumar",
    managerPhone: "+91 98765 43210",
    city: "Bengaluru",
    posId: "POS-IND-01",
    architecture: "Non-Aggregator",
    acquirer: "HDFC Bank",
    modelBadge: "Android Smart POS A920"
  };

  const store = currentStore || { 
    storeName: profile.storeName || 'Croma Indiranagar', 
    managerName: profile.managerName || 'Rajesh Kumar', 
    city: profile.city || 'Bengaluru' 
  };

  const pos = currentPos || {
    posId: profile.posId || 'POS-IND-01',
    model: profile.modelBadge || 'Android Smart POS A920'
  };

  // Defensive message array resolution
  const rawList = Array.isArray(rawMessages) && rawMessages.length > 0 
    ? rawMessages 
    : (Array.isArray(rawAlerts) ? rawAlerts : []);
  const whatsAppMessages = rawList.filter(m => m && typeof m === 'object');

  const { playNotification } = useAudioChime();
  const prevCount = useRef(whatsAppMessages?.length || 0);
  const [resolvedMap, setResolvedMap] = useState({});
  const [activeEmailAlert, setActiveEmailAlert] = useState(null);
  const [activeCallAlert, setActiveCallAlert] = useState(null);
  const [activeTicketAlert, setActiveTicketAlert] = useState(null);

  // Safe Web Audio chime trigger wrapped in try...catch
  useEffect(() => {
    try {
      if ((whatsAppMessages?.length || 0) > prevCount.current) {
        if (typeof playNotification === 'function') {
          playNotification();
        }
        if (typeof setHasUnreadAlert === 'function') {
          setHasUnreadAlert(false);
        }
      }
    } catch (err) {
      console.warn("Audio chime autoplay handled safely:", err);
    }
    prevCount.current = whatsAppMessages?.length || 0;
  }, [whatsAppMessages, playNotification, setHasUnreadAlert]);

  const toggleResolved = (id) => {
    setResolvedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getManagerInitials = (name) => {
    if (!name || typeof name !== 'string') return "SM";
    return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "SM";
  };

  // Safe array dereferencing
  const latestAlert = whatsAppMessages?.[0] || null;
  const messageTime = typeof latestAlert?.timestamp === 'string' ? latestAlert.timestamp : "Just now";
  const rawIssue = latestAlert?.errorIssue || latestAlert?.errorCode || 'Incident Alert';
  const issueStr = typeof rawIssue === 'object' ? (rawIssue?.errorIssue || 'Incident Alert') : String(rawIssue);
  const previewText = latestAlert ? `🚨 ${issueStr}` : "Automated store triage active";

  const managerName = typeof profile.managerName === 'string' ? profile.managerName : (typeof store.managerName === 'string' ? store.managerName : "Rajesh Kumar");
  const city = typeof profile.city === 'string' ? profile.city : (typeof store.city === 'string' ? store.city : "Bengaluru");
  const activePhone = typeof customPhoneNumber === 'string' && customPhoneNumber.trim()
    ? customPhoneNumber
    : (typeof profile.managerPhone === 'string' ? profile.managerPhone : "+91 98765 43210");
  const posId = typeof profile.posId === 'string' ? profile.posId : (typeof pos.posId === 'string' ? pos.posId : "POS-IND-01");

  return (
    <div className="w-full h-[640px] bg-[#111B21] border border-[#222E35] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row select-none">
      
      {/* 1. Sidebar */}
      <div className="w-full md:w-80 bg-[#111B21] border-r border-[#222E35] flex flex-col">
        {/* Manager Profile Bar */}
        <div className="h-14 bg-[#202C33] px-3.5 flex justify-between items-center border-b border-[#222E35]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
              {getManagerInitials(managerName)}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#E9EDEF]">{managerName}</div>
              <div className="text-[10px] text-[#8696A0]">Store Manager • {city}</div>
            </div>
          </div>
          <MoreVertical className="w-4 h-4 text-[#AEBAC1] cursor-pointer"/>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-[#222E35]">
          <div className="bg-[#202C33] rounded-lg px-3 py-1.5 flex items-center space-x-2 text-[#8696A0]">
            <Search className="w-3.5 h-3.5"/>
            <input
              type="text"
              readOnly
              value="Search or start new chat"
              className="bg-transparent text-[11px] text-[#D1D7DB] focus:outline-none w-full cursor-default"
            />
          </div>
        </div>

        {/* Chat List Item */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-[#2A3942]/60 px-3 py-3 border-b border-[#222E35] flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884] flex-shrink-0">
              <ShieldCheck className="w-5 h-5"/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#E9EDEF] truncate flex items-center gap-1">
                  Pine Labs POS Sentinel
                </span>
                <span className="text-[9px] text-[#8696A0]">
                  {messageTime}
                </span>
              </div>
              <div className="text-[10px] text-[#8696A0] truncate mt-0.5">
                {previewText}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Conversation Viewport */}
      <div className="flex-1 flex flex-col bg-[#0B141A]">
        {/* Top Header */}
        <div className="h-14 bg-[#202C33] px-4 flex justify-between items-center border-b border-[#222E35]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884]">
              <ShieldCheck className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-[#E9EDEF]">Pine Labs POS Sentinel</span>
                <BadgeCheck className="w-3.5 h-3.5 text-[#00A884] fill-[#00A884]"/>
              </div>
              <div className="text-[9px] text-[#00A884]">Official Verified Business Account</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateToSimulator && (
              <button
                id="btn-wa-back-to-sim"
                onClick={onNavigateToSimulator}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition flex items-center gap-1 cursor-pointer mr-1"
                title="Return to Smart POS Terminal Simulator"
              >
                <span>← Back to POS Simulator</span>
              </button>
            )}

            {/* Change Test Phone Number Button */}
            <button
              id="btn-wa-change-phone"
              onClick={() => setIsPhoneModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-[#111B21] border border-[#222E35] text-[#8696A0] hover:text-white text-[11px] font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              title="Change test phone number for live WhatsApp alerts"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="hidden sm:inline">✏️ Edit Phone</span>
              <span className="text-white font-mono text-[10px]">({activePhone})</span>
            </button>

            {/* Trigger Automated Background API Dispatch Button */}
            <button
              id="btn-wa-auto-dispatch"
              onClick={async () => {
                const targetPhone = activePhone;
                const text = latestAlert?.realWhatsAppText || formatWhatsAppMessage({
                  storeName: currentProfile?.storeName || currentStore?.storeName || "Croma Indiranagar",
                  posId: posId,
                  model: currentProfile?.modelBadge || "Android Smart POS A920",
                  architecture: currentProfile?.architecture || "Non-Aggregator",
                  errorIssue: latestAlert?.errorIssue || latestAlert?.errorCode || "TID NOT PRESENT",
                  reasonOfOccurrence: latestAlert?.reasonOfOccurrence || "TID deactivated by acquiring switch.",
                  solution: latestAlert?.solution || "Merchant should contact Acquiring bank. Pine Labs support cannot unblock bank-owned TIDs.",
                  appliedRuleId: latestAlert?.appliedRuleId || (currentProfile?.architecture === "Non-Aggregator" ? "RULE_1" : "RULE_2"),
                  deflectionTarget: latestAlert?.deflectionTarget,
                  bankTollFree: latestAlert?.bankTollFree,
                  bankEmail: latestAlert?.bankEmail,
                  caseRef: latestAlert?.caseRef,
                  ticketRef: latestAlert?.ticketRef
                });
                await sendAutomatedWhatsApp({
                  to: targetPhone,
                  message: text,
                  metadata: {
                    storeName: currentProfile?.storeName || "Croma Indiranagar",
                    posId: posId,
                    errorIssue: latestAlert?.errorIssue || "TID NOT PRESENT"
                  }
                });
                if (typeof playNotification === 'function') {
                  playNotification();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[11px] font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-95"
              title="Dispatches resolution payload automatically via background POST /api/send-whatsapp"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Auto-Dispatch API</span>
            </button>

            <button
              id="btn-wa-call-desk"
              onClick={() => setActiveCallAlert(latestAlert || {
                bankTollFree: currentProfile?.architecture === "Non-Aggregator" ? "1800 202 6161" : "0120-4033600",
                deflectionTarget: currentProfile?.architecture === "Non-Aggregator" ? "HDFC Bank Merchant Helpdesk" : "Pine Labs Plutus Priority Desk"
              })}
              className="p-2 text-[#AEBAC1] hover:text-[#00A884] hover:bg-[#202C33] rounded-full transition cursor-pointer"
              title="Call Escalation Desk"
            >
              <Phone className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        >
          {/* End-to-End Encryption Banner */}
          <div className="flex justify-center my-1">
            <div className="bg-[#182229] border border-[#222E35] text-[#FFEECD] text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm max-w-md text-center">
              <Lock className="w-3 h-3 text-[#FFD279] flex-shrink-0" />
              <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
            </div>
          </div>

          {/* Safe Message Bubble Rendering */}
          {whatsAppMessages && whatsAppMessages.length > 0 ? (
            whatsAppMessages.map((alert, idx) => (
              <WhatsAppMessageBubble
                key={alert?.id || idx}
                alert={alert}
                store={store}
                storeData={store}
                posData={pos}
                currentProfile={profile}
                customPhoneNumber={customPhoneNumber}
                isResolved={Boolean(resolvedMap[alert?.id || idx])}
                onToggleResolved={() => toggleResolved(alert?.id || idx)}
                onCall={() => setActiveCallAlert(alert)}
                onCallAlert={(a) => setActiveCallAlert(a)}
                onOpenEmail={() => setActiveEmailAlert(alert)}
                onEmailAlert={(a) => setActiveEmailAlert(a)}
                onTicketAlert={(a) => setActiveTicketAlert(a)}
              />
            ))
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-[#8696A0]">
              <div className="w-12 h-12 rounded-full bg-[#202C33] flex items-center justify-center mb-3 text-[#00A884]">
                <ShieldCheck className="w-6 h-6"/>
              </div>
              <p className="text-sm font-semibold text-[#E9EDEF]">No Incident Alerts Dispatched Yet</p>
              <p className="text-xs text-[#8696A0] mt-1 max-w-xs">
                Simulate an error on the POS Simulator or type an error in the AI Triage Studio to trigger an automated alert.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pre-filled Email Modal */}
      {activeEmailAlert && (
        <EmailDraftModal
          isOpen={true}
          onClose={() => setActiveEmailAlert(null)}
          errorIssue={activeEmailAlert.errorIssue || activeEmailAlert.errorCode || "TID NOT PRESENT"}
          bankDetails={{
            bankName: activeEmailAlert.deflectionTarget || "Acquiring Bank",
            email: activeEmailAlert.bankEmail || "pos.helpdesk@hdfc.bank.in",
            tollFree: activeEmailAlert.bankTollFree || "1800 202 6161"
          }}
          posData={currentPos}
          storeData={currentStore}
        />
      )}

      {/* Simulated Phone Call Feedback Modal */}
      {activeCallAlert && (
        <CallSimulatorModal
          isOpen={true}
          onClose={() => setActiveCallAlert(null)}
          bankName={activeCallAlert.deflectionTarget || "Pine Labs Plutus Desk"}
          phoneNumber={activeCallAlert.bankTollFree || "1800 202 6161"}
          storeData={currentStore}
        />
      )}

      {/* Aggregator Plutus Ticket Tracker Modal */}
      {activeTicketAlert && (typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm my-auto rounded-2xl bg-[#111B21] border border-[#222E35] p-5 shadow-2xl space-y-4 text-white text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#222E35] pb-2.5">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-[#E9EDEF]">Plutus L2 Internal Ticket</h3>
              </div>
              <button onClick={() => setActiveTicketAlert(null)} className="text-[#8696A0] hover:text-white cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#202C33] p-3 rounded-2xl border border-[#2A3942] space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#8696A0]">Ticket ID:</span>
                <strong className="text-emerald-400">{activeTicketAlert.ticketRef || 'PL-AGG-4921'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696A0]">Terminal:</span>
                <span>{activeTicketAlert.posId || posId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696A0]">Status:</span>
                <span className="text-amber-400">In Progress (L2 Switch TechOps)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8696A0]">Resolution ETA:</span>
                <span>15 minutes</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8696A0] leading-relaxed">
              Pine Labs Master Merchant Switch re-route active. The store manager does not need to contact any acquiring bank.
            </p>

            <button
              onClick={() => setActiveTicketAlert(null)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>,
        document.body
      ) : null)}
    </div>
  );
}
