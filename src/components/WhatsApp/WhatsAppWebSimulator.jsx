  import React, { useEffect, useRef } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useNotificationSound } from './useNotificationSound';
import WhatsAppMessageBubble from './WhatsAppMessageBubble';
import { 
  BadgeCheck, 
  MoreVertical, 
  Search, 
  Paperclip, 
  Smile, 
  Mic, 
  Phone, 
  ShieldCheck, 
  MessageSquareOff,
  BellRing
} from 'lucide-react';

export default function WhatsAppWebSimulator() {
  const { 
    whatsAppMessages = [], 
    whatsAppAlerts = [], 
    currentStore = { storeName: 'Croma Indiranagar', managerName: 'Rajesh Kumar', city: 'Bengaluru' }, 
    currentPos = { posId: 'POS-IND-01', model: 'Android Smart POS A920' }, 
    setHasUnreadAlert = () => {} 
  } = useMerchant() || {};
  const { playChime } = useNotificationSound();
  const alerts = whatsAppMessages?.length ? whatsAppMessages : whatsAppAlerts;
  const previousAlertsCount = useRef(alerts?.length || 0);
  const chatScrollRef = useRef(null);

  // Play chime and clear unread badge when a new alert is received
  useEffect(() => {
    try {
      if ((alerts?.length || 0) > previousAlertsCount.current) {
        if (typeof playChime === 'function') {
          playChime();
        }
        setHasUnreadAlert(false);
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      console.warn("Chime notification handled safely:", e);
    }
    previousAlertsCount.current = alerts?.length || 0;
  }, [alerts, playChime, setHasUnreadAlert]);

  const lastAlert = alerts?.[0] || null;

  return (
    <div className="w-full h-[620px] bg-[#111B21] border border-[#222E35] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row select-none">
      
      {/* 1. LEFT SIDEBAR: Store Chats List */}
      <div className="w-full md:w-80 bg-[#111B21] border-r border-[#222E35] flex flex-col">
        {/* User Profile Bar */}
        <div className="h-14 bg-[#202C33] px-3.5 flex justify-between items-center border-b border-[#222E35]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
              RS
            </div>
            <div>
              <div className="text-xs font-semibold text-[#E9EDEF]">{currentStore.managerName}</div>
              <div className="text-[10px] text-[#8696A0]">Store Manager • Indiranagar</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[#AEBAC1]">
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white transition"/>
          </div>
        </div>

        {/* Search Chat Box */}
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

        {/* Active Chats List */}
        <div className="flex-1 overflow-y-auto">
          {/* Chat Item: Official Pine Labs Sentinel */}
          <div className="bg-[#2A3942]/60 px-3 py-3 border-b border-[#222E35] flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884]">
                <ShieldCheck className="w-5 h-5"/>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-[#111B21] rounded-full p-0.5">
                <BadgeCheck className="w-3.5 h-3.5 text-[#00A884] fill-[#00A884]"/>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#E9EDEF] truncate flex items-center gap-1">
                  Pine Labs POS Sentinel
                </span>
                <span className="text-[9px] text-[#8696A0]">
                  {lastAlert ? lastAlert.timestamp : "Just now"}
                </span>
              </div>
              <div className="text-[10.5px] text-[#8696A0] truncate mt-0.5">
                {lastAlert ? `🚨 ${lastAlert.errorCode} on ${lastAlert.posId}` : "Automated incident response active"}
              </div>
            </div>
          </div>

          {/* Chat Item 2: Regional Ops (Static Context) */}
          <div className="px-3 py-3 border-b border-[#222E35] flex items-center space-x-3 opacity-60">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
              CR
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-[#E9EDEF]">Croma Regional Ops</span>
                <span className="text-[9px] text-[#8696A0]">11:40 AM</span>
              </div>
              <div className="text-[10px] text-[#8696A0] truncate mt-0.5">
                Daily batch settlements submitted.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT CHAT VIEWPORT */}
      <div className="flex-1 flex flex-col bg-[#0B141A] relative">
        {/* WhatsApp Top Navigation Bar */}
        <div className="h-14 bg-[#202C33] px-4 flex justify-between items-center border-b border-[#222E35] z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884]">
                <ShieldCheck className="w-5 h-5"/>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-[#E9EDEF]">Pine Labs POS Sentinel</span>
                <BadgeCheck className="w-3.5 h-3.5 text-[#00A884] fill-[#00A884]"/>
              </div>
              <div className="text-[9.5px] text-[#00A884] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A884]" /> Official Verified Business Account
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[#AEBAC1]">
            <button
              onClick={playChime}
              className="p-1 hover:text-white transition cursor-pointer"
              title="Test WhatsApp Notification Chime"
            >
              <BellRing className="w-4 h-4"/>
            </button>
            <Phone className="w-4 h-4 cursor-pointer hover:text-white transition"/>
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white transition"/>
          </div>
        </div>

        {/* WhatsApp Wallpaper Conversation Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        >
          {/* Security Disclaimer Banner */}
          <div className="flex justify-center">
            <div className="bg-[#182229] border border-[#222E35] text-[#FFE599] text-[9.5px] px-3 py-1.5 rounded-lg shadow max-w-md text-center leading-relaxed">
              🔒 Messages are end-to-end encrypted. Pine Labs Sentinel delivers verified acquirer escalation packets directly to authorized store managers.
            </div>
          </div>

          {/* Empty State vs Alerts List */}
          {whatsAppAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
              <div className="w-12 h-12 rounded-full bg-[#202C33] flex items-center justify-center text-[#8696A0]">
                <MessageSquareOff className="w-6 h-6"/>
              </div>
              <div className="max-w-xs">
                <p className="text-xs font-semibold text-[#E9EDEF]">No Incident Alerts Dispatched Yet</p>
                <p className="text-[11px] text-[#8696A0] mt-1">
                  Trigger an error on the POS Simulator and click <strong>"Dispatch Store Alert via WhatsApp"</strong> in the chat to see real-time store dispatch.
                </p>
              </div>
            </div>
          ) : (
            whatsAppAlerts.map((alert) => (
              <WhatsAppMessageBubble
                key={alert.id}
                alert={alert}
                posData={currentPos}
                storeData={currentStore}
              />
            ))
          )}

          <div ref={chatScrollRef} />
        </div>

        {/* WhatsApp Message Input Bar */}
        <div className="h-14 bg-[#202C33] px-3 flex items-center space-x-3 border-t border-[#222E35]">
          <Smile className="w-5 h-5 text-[#8696A0] cursor-pointer hover:text-white transition"/>
          <Paperclip className="w-5 h-5 text-[#8696A0] cursor-pointer hover:text-white transition"/>
          <input
            type="text"
            readOnly
            placeholder="Store manager two-way reply channel..."
            className="flex-1 bg-[#2A3942] text-xs text-[#E9EDEF] px-3 py-2 rounded-lg focus:outline-none placeholder-[#8696A0] cursor-default"
          />
          <Mic className="w-5 h-5 text-[#8696A0] cursor-pointer hover:text-white transition"/>
        </div>
      </div>
    </div>
  );
}
