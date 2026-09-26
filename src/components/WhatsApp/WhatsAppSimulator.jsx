import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMerchant } from '../../context/MerchantContext';
import { useAudioChime } from './useAudioChime';
import EmailDraftModal from '../Chatbot/EmailDraftModal';
import CallSimulatorModal from './CallSimulatorModal';
import WhatsAppMessageBubble from './WhatsAppMessageBubble';
import { sendAutomatedWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { 
  Search, 
  Phone, 
  Video,
  MoreVertical, 
  ShieldCheck, 
  CheckCheck, 
  Smartphone,
  Lock, 
  Wrench, 
  X, 
  Zap,
  Smile,
  Paperclip,
  Mic,
  Send,
  ArrowLeft,
  CircleDot,
  Users,
  MessageSquarePlus
} from 'lucide-react';

// Official WhatsApp Business Verified Badge Component
function WhatsAppVerifiedBadge({ className = "w-4 h-4 text-[#00A884]" }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.35 8.13a1.5 1.5 0 0 1 0 1.74l-.94 1.33c-.27.38-.34.87-.19 1.32l.53 1.55a1.5 1.5 0 0 1-1.02 1.93l-1.6.35c-.46.1-.84.4-.99.85l-.54 1.54a1.5 1.5 0 0 1-1.74 1l-1.59-.44c-.45-.13-.94-.03-1.3.26l-1.3 1.05a1.5 1.5 0 0 1-2.02-.27l-1.09-1.26c-.31-.36-.78-.54-1.26-.49l-1.63.17a1.5 1.5 0 0 1-1.62-1.27l-.27-1.62c-.08-.47-.36-.87-.77-1.1L.8 13.7a1.5 1.5 0 0 1-.58-2.05l.84-1.42c.24-.4.24-.9 0-1.31l-.84-1.42a1.5 1.5 0 0 1 .58-2.05l1.45-.88c.41-.24.69-.64.77-1.1l.27-1.63a1.5 1.5 0 0 1 1.62-1.27l1.63.18c.48.05.95-.13 1.26-.49L9.89.99a1.5 1.5 0 0 1 2.02-.27l1.3 1.05c.36.29.85.39 1.3.26l1.6-.44a1.5 1.5 0 0 1 1.73 1l.54 1.54c.15.45.53.75.99.85l1.6.35a1.5 1.5 0 0 1 1.02 1.93l-.53 1.55c-.15.45-.08.94.19 1.32l.94 1.33zm-4.7 1.22a.75.75 0 0 0-1.06-1.06L8.25 10.64 6.91 9.3a.75.75 0 0 0-1.06 1.06l1.87 1.87a.75.75 0 0 0 1.06 0l3.87-3.88z"
        fill="currentColor"
      />
    </svg>
  );
}

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
  
  // Interactive user messages state
  const [typedMessage, setTypedMessage] = useState("");
  const [userSentMessages, setUserSentMessages] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const chatScrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Robust scroll to bottom helper (scrolls middle message container directly without window scroll)
  const scrollToBottom = (behavior = 'smooth') => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };

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

  // Initial scroll to bottom on mount (shows newest messages at bottom without manual scrolling)
  useEffect(() => {
    scrollToBottom('instant');
    const timer = setTimeout(() => scrollToBottom('instant'), 50);
    return () => clearTimeout(timer);
  }, []);

  // Smooth scroll to bottom whenever new messages arrive or alerts count changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 60);
    return () => clearTimeout(timer);
  }, [whatsAppMessages.length, userSentMessages.length]);

  const toggleResolved = (id) => {
    setResolvedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getManagerInitials = (name) => {
    if (!name || typeof name !== 'string') return "RK";
    return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "RK";
  };

  // Chronological latest alert is at the end of the array (bottom of chat)
  const latestAlert = whatsAppMessages?.length ? whatsAppMessages[whatsAppMessages.length - 1] : null;
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

  // Guaranteed chronological timeline: array index 0 (oldest) at TOP -> latest at BOTTOM
  const timelineMessages = useMemo(() => {
    // If no interactive user messages exist, preserve natural array order directly:
    // array index 0 (first clicked) -> index N-1 (last clicked)
    if (!userSentMessages || userSentMessages.length === 0) {
      return (whatsAppMessages || []).map((m, i) => ({
        ...m,
        _timelineType: 'alert',
        _seq: i
      }));
    }

    // Interleave alerts and user sent messages by timestamp
    const alerts = (whatsAppMessages || []).map((m, i) => ({
      ...m,
      _timelineType: 'alert',
      _time: typeof m.createdAt === 'number' ? m.createdAt : (i + 1),
      _seq: i
    }));
    const baseTime = alerts.length > 0 && typeof alerts[alerts.length - 1]._time === 'number'
      ? alerts[alerts.length - 1]._time
      : Date.now();
    const userMsgs = userSentMessages.map((m, i) => ({
      ...m,
      _timelineType: m.isAck ? 'ack' : 'user',
      _time: typeof m.createdAt === 'number' ? m.createdAt : (baseTime + i + 1),
      _seq: alerts.length + i
    }));
    return [...alerts, ...userMsgs].sort((a, b) => (a._time || 0) - (b._time || 0) || (a._seq - b._seq));
  }, [whatsAppMessages, userSentMessages]);

  // Handle user typing and sending interactive messages
  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;
    const now = Date.now();
    const newMsg = {
      id: `user_msg_${now}`,
      createdAt: now,
      text: typedMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setUserSentMessages(prev => [...prev, newMsg]);
    setTypedMessage("");

    // Simulate subtle automated bot acknowledgement after 1.2s
    setTimeout(() => {
      const ackNow = Date.now();
      const ackMsg = {
        id: `auto_ack_${ackNow}`,
        createdAt: ackNow,
        isAck: true,
        text: `PineShield Bot: Message noted for POS #${posId}. Incident tracking ID active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setUserSentMessages(prev => [...prev, ackMsg]);
    }, 1200);
  };

  const handleHeaderCallClick = () => {
    setActiveCallAlert(latestAlert || {
      bankTollFree: profile?.architecture === "Non-Aggregator" ? "1800 202 6161" : "0120-4033600",
      deflectionTarget: profile?.architecture === "Non-Aggregator" ? "HDFC Bank Merchant Helpdesk" : "Pine Labs Plutus Priority Desk"
    });
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      
      {/* ========================================================================= */}
      {/* 1. EXTERNAL SIMULATION TOOLBAR (Outside WhatsApp Frame)                   */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-1 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-slate-200 text-xs sm:text-sm">WhatsApp Web Simulator</span>
          <span className="text-[9.5px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800 font-semibold">
            Live Webhook Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
          {onNavigateToSimulator && (
            <button
              id="btn-wa-back-to-sim"
              onClick={onNavigateToSimulator}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 font-medium transition flex items-center gap-1 cursor-pointer"
              title="Return to Smart POS Terminal Simulator"
            >
              <span>← Back to Simulator</span>
            </button>
          )}

          {/* Change Test Phone Number Button */}
          <button
            id="btn-wa-change-phone"
            onClick={() => setIsPhoneModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white flex items-center space-x-1 transition cursor-pointer"
            title="Change test phone number for live WhatsApp alerts"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#00A884]" />
            <span>Target: <strong className="text-white font-mono text-[10px]">{activePhone}</strong></span>
          </button>

          {/* Trigger Automated Background API Dispatch Button */}
          <button
            id="btn-wa-auto-dispatch"
            onClick={async () => {
              const targetPhone = activePhone;
              const text = latestAlert?.realWhatsAppText || formatWhatsAppMessage({
                storeName: profile?.storeName || store?.storeName || "Croma Indiranagar",
                posId: posId,
                model: profile?.modelBadge || "Android Smart POS A920",
                architecture: profile?.architecture || "Non-Aggregator",
                errorIssue: latestAlert?.errorIssue || latestAlert?.errorCode || "TID NOT PRESENT",
                reasonOfOccurrence: latestAlert?.reasonOfOccurrence || "TID deactivated by acquiring switch.",
                solution: latestAlert?.solution || "Merchant should contact Acquiring bank. Pine Labs support cannot unblock bank-owned TIDs.",
                appliedRuleId: latestAlert?.appliedRuleId || (profile?.architecture === "Non-Aggregator" ? "RULE_1" : "RULE_2"),
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
                  storeName: profile?.storeName || "Croma Indiranagar",
                  posId: posId,
                  errorIssue: latestAlert?.errorIssue || "TID NOT PRESENT"
                }
              });
              if (typeof playNotification === 'function') {
                playNotification();
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-[#00A884] hover:bg-[#008F6F] text-slate-950 font-bold flex items-center space-x-1 shadow-md transition cursor-pointer active:scale-95"
            title="Sends automated resolution alert to Store WhatsApp"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Send Alert</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC WHATSAPP WEB CHROME CONTAINER                                */}
      {/* ========================================================================= */}
      <div className="w-full h-[calc(100dvh-190px)] min-h-[440px] max-h-[720px] md:h-[660px] lg:h-[700px] bg-[#111B21] border border-[#222E35] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row select-none">
        
        {/* ----------------------------------------------------------------------- */}
        {/* 2A. LEFT SIDEBAR (WhatsApp Web Chat List)                               */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex md:w-[340px] lg:w-[380px] bg-[#111B21] border-r border-[#222E35] flex-col flex-shrink-0 min-h-0 h-full`}>
          
          {/* Manager Profile Header Bar */}
          <div className="h-[59px] bg-[#202C33] px-4 flex justify-between items-center border-b border-[#222E35] flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-800 border border-emerald-600/30 flex items-center justify-center font-bold text-white text-xs">
                {getManagerInitials(managerName)}
              </div>
              <div className="truncate">
                <div className="text-[14px] font-semibold text-[#E9EDEF] leading-tight truncate">{managerName}</div>
                <div className="text-[11px] text-[#8696A0] leading-tight truncate">{store.storeName}</div>
              </div>
            </div>

            {/* Sidebar Action Icons */}
            <div className="flex items-center space-x-3 text-[#AEBAC1]">
              <Users className="w-5 h-5 cursor-pointer hover:text-[#D1D7DB] transition" title="Communities" />
              <CircleDot className="w-5 h-5 cursor-pointer hover:text-[#D1D7DB] transition" title="Status" />
              <MessageSquarePlus className="w-5 h-5 cursor-pointer hover:text-[#D1D7DB] transition" title="New chat" />
              <MoreVertical className="w-5 h-5 cursor-pointer hover:text-[#D1D7DB] transition" title="Menu" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-[#222E35] bg-[#111B21] flex-shrink-0">
            <div className="bg-[#202C33] rounded-[8px] px-3 py-1.5 flex items-center space-x-3 text-[#8696A0]">
              <Search className="w-4 h-4 flex-shrink-0"/>
              <input
                type="text"
                readOnly
                value="Search or start new chat"
                className="bg-transparent text-[13px] text-[#D1D7DB] placeholder-[#8696A0] focus:outline-none w-full cursor-default"
              />
            </div>
          </div>

          {/* Chat List Items */}
          <div className="flex-1 overflow-y-auto">
            {/* Active PineShield Business Chat */}
            <div 
              onClick={() => setShowMobileSidebar(false)}
              className="bg-[#2A3942] px-3.5 py-3 border-b border-[#222E35] flex items-center space-x-3 cursor-pointer transition hover:bg-[#202C33]"
            >
              {/* Circular PineShield Avatar */}
              <div className="w-12 h-12 rounded-full bg-[#005C4B] border border-[#00A884]/40 flex items-center justify-center text-[#00A884] flex-shrink-0">
                <ShieldCheck className="w-6 h-6"/>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="flex items-center space-x-1 truncate pr-1">
                    <span className="text-[15px] font-semibold text-[#E9EDEF] truncate">
                      PineShield
                    </span>
                    <WhatsAppVerifiedBadge className="w-3.5 h-3.5 text-[#00A884] flex-shrink-0" />
                  </div>
                  <span className="text-[11px] text-[#00A884] font-medium flex-shrink-0">
                    {messageTime}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#8696A0] truncate">
                    {previewText}
                  </span>
                  {whatsAppMessages.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#00A884] flex-shrink-0 ml-1.5" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* 2B. ACTIVE CONVERSATION VIEWPORT                                        */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`${showMobileSidebar ? 'hidden' : 'flex'} flex-1 min-h-0 h-full flex flex-col bg-[#0B141A] overflow-hidden`}>
          
          {/* Native WhatsApp Header Bar (No custom pill buttons inside!) */}
          <div className="h-[59px] bg-[#202C33] px-3 sm:px-4 flex justify-between items-center border-b border-[#222E35] flex-shrink-0 z-10">
            
            {/* Left: Contact Info */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden p-1 text-[#AEBAC1] hover:text-white transition cursor-pointer"
                title="Back to chat list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Contact Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#005C4B] border border-[#00A884]/40 flex items-center justify-center text-[#00A884] flex-shrink-0">
                <ShieldCheck className="w-5 h-5"/>
              </div>

              {/* Name & Status */}
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 leading-tight">
                  <span className="text-[15px] sm:text-[16px] font-semibold text-[#E9EDEF] truncate">
                    PineShield
                  </span>
                  <WhatsAppVerifiedBadge className="w-4 h-4 text-[#00A884] flex-shrink-0" />
                </div>
                <div className="text-[12px] sm:text-[12.5px] text-[#8696A0] leading-tight truncate">
                  online
                </div>
              </div>
            </div>

            {/* Right: Native WhatsApp Action Icons ONLY */}
            <div className="flex items-center space-x-1 sm:space-x-2 text-[#AEBAC1]">
              <button
                type="button"
                className="p-2 hover:bg-[#111B21]/60 rounded-full text-[#AEBAC1] hover:text-[#00A884] transition cursor-pointer"
                title="Video call"
              >
                <Video className="w-5 h-5"/>
              </button>

              <button
                type="button"
                onClick={handleHeaderCallClick}
                className="p-2 hover:bg-[#111B21]/60 rounded-full text-[#AEBAC1] hover:text-[#00A884] transition cursor-pointer"
                title="Voice call escalation desk"
              >
                <Phone className="w-5 h-5"/>
              </button>

              <button
                type="button"
                className="p-2 hover:bg-[#111B21]/60 rounded-full text-[#AEBAC1] hover:text-[#00A884] transition cursor-pointer hidden sm:block"
                title="Search in chat"
              >
                <Search className="w-5 h-5"/>
              </button>

              <button
                type="button"
                className="p-2 hover:bg-[#111B21]/60 rounded-full text-[#AEBAC1] hover:text-[#00A884] transition cursor-pointer"
                title="More options"
              >
                <MoreVertical className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* Chat Stream (Subtle WhatsApp Doodle Wallpaper Pattern)              */}
          {/* ------------------------------------------------------------------- */}
          <div 
            ref={chatScrollContainerRef}
            id="whatsapp-messages-container"
            className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3.5 whatsapp-doodle-pattern overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            
            {/* Centered Date Divider Pill */}
            <div className="flex justify-center my-2 select-none">
              <span className="bg-[#182229] text-[#8696A0] text-[12.5px] px-3.5 py-1 rounded-[7.5px] shadow-sm uppercase font-medium">
                Today
              </span>
            </div>

            {/* Native WhatsApp End-to-End Encryption Banner */}
            <div className="flex justify-center my-2 mb-4 select-none">
              <div className="bg-[#182229] border border-[#222E35]/70 text-[#FFEECD] text-[12px] px-3.5 py-1.5 rounded-[7.5px] flex items-center justify-center gap-2 shadow-sm max-w-sm sm:max-w-md text-center leading-snug">
                <Lock className="w-3.5 h-3.5 text-[#FFD279] flex-shrink-0" />
                <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
              </div>
            </div>

            {/* Unified Chronological Message Stream (Oldest on top, newest on bottom) */}
            {timelineMessages && timelineMessages.length > 0 ? (
              timelineMessages.map((item, idx) => {
                if (item._timelineType === 'alert') {
                  return (
                    <WhatsAppMessageBubble
                      key={item?.id || `alert_${idx}`}
                      alert={item}
                      store={store}
                      storeData={store}
                      posData={pos}
                      currentProfile={profile}
                      customPhoneNumber={customPhoneNumber}
                      isResolved={Boolean(resolvedMap[item?.id || idx])}
                      onToggleResolved={() => toggleResolved(item?.id || idx)}
                      onCall={() => setActiveCallAlert(item)}
                      onCallAlert={(a) => setActiveCallAlert(a)}
                      onOpenEmail={() => setActiveEmailAlert(item)}
                      onEmailAlert={(a) => setActiveEmailAlert(a)}
                      onTicketAlert={(a) => setActiveTicketAlert(a)}
                    />
                  );
                }

                // Interactive User Sent Messages (Green Bubble #005C4B) or Bot Ack (#202C33)
                const isAck = item._timelineType === 'ack';
                return (
                  <div key={item.id || `msg_${idx}`} className={`flex ${isAck ? 'justify-start' : 'justify-end'} my-2`}>
                    <div 
                      className={`relative rounded-[7.5px] ${
                        isAck 
                          ? 'bg-[#202C33] rounded-tl-none text-[#E9EDEF]' 
                          : 'bg-[#005C4B] rounded-tr-none text-[#E9EDEF]'
                      } px-3 py-2 max-w-[85%] sm:max-w-[70%] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[14.2px] leading-[19px]`}
                    >
                      {/* Bubble Tail */}
                      {isAck ? (
                        <span className="absolute -left-2 top-0 text-[#202C33] pointer-events-none select-none">
                          <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                            <path d="M1.533 3.568L8 12.193V0H2.812C1.042 0 .474 2.156 1.533 3.568z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="absolute -right-2 top-0 text-[#005C4B] pointer-events-none select-none">
                          <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                            <path d="M6.467 3.568L0 12.193V0h5.188c1.77 0 2.338 2.156 1.279 3.568z" />
                          </svg>
                        </span>
                      )}

                      <div>{item.text}</div>
                      
                      <div className="flex items-center justify-end space-x-1 text-[11px] text-[#8696A0] mt-1 select-none">
                        <span>{item.timestamp}</span>
                        {!isAck && <CheckCheck className="w-4 h-4 text-[#53BDEB]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-[#8696A0]">
                <div className="w-12 h-12 rounded-full bg-[#202C33] flex items-center justify-center mb-3 text-[#00A884]">
                  <ShieldCheck className="w-6 h-6"/>
                </div>
                <p className="text-sm font-semibold text-[#E9EDEF]">No Incident Alerts Dispatched Yet</p>
                <p className="text-xs text-[#8696A0] mt-1 max-w-xs">
                  Simulate an error on the POS Simulator or type an error in the PineShield AI to trigger an automated alert.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* Native WhatsApp Bottom Input Bar                                    */}
          {/* ------------------------------------------------------------------- */}
          <div className="min-h-[62px] h-[62px] bg-[#202C33] px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 border-t border-[#222E35] flex-shrink-0 z-10">
            {/* Emoji Picker Icon */}
            <button
              type="button"
              className="p-1.5 text-[#8696A0] hover:text-[#D1D7DB] transition cursor-pointer"
              title="Emojis"
            >
              <Smile className="w-6 h-6" />
            </button>

            {/* Paperclip Attachment Icon */}
            <button
              type="button"
              className="p-1.5 text-[#8696A0] hover:text-[#D1D7DB] transition cursor-pointer"
              title="Attach"
            >
              <Paperclip className="w-6 h-6" />
            </button>

            {/* Text Input Box */}
            <div className="flex-1 bg-[#2A3942] rounded-[8px] px-3.5 py-2 flex items-center">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type a message"
                className="w-full bg-transparent text-[14.5px] text-[#D1D7DB] placeholder-[#8696A0] focus:outline-none font-sans"
              />
            </div>

            {/* Mic or Send Button */}
            {typedMessage.trim() ? (
              <button
                type="button"
                onClick={handleSendMessage}
                className="p-2 text-[#00A884] hover:text-[#008F6F] transition cursor-pointer"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                className="p-2 text-[#8696A0] hover:text-[#D1D7DB] transition cursor-pointer"
                title="Voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS (Email Draft, Call Simulator, Plutus Ticket)                    */}
      {/* ========================================================================= */}
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
