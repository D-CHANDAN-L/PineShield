import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { 
  Bell, 
  MessageSquare, 
  AlertOctagon, 
  CheckCheck, 
  ExternalLink,
  Trash2,
  X
} from 'lucide-react';

export default function NotificationsPopover({ isOpen, onClose }) {
  const { 
    whatsAppMessages, 
    emergencyIncidents, 
    setActiveTab, 
    setHasUnreadAlert 
  } = useMerchant();

  if (!isOpen) return null;

  // Combine notifications
  const notifications = [
    ...emergencyIncidents.map(inc => ({
      id: inc.id,
      type: 'incident',
      title: `Emergency Incident: ${inc.id}`,
      subtitle: `${inc.severity} • ${inc.storeName}`,
      timestamp: new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tab: 'emergency'
    })),
    ...whatsAppMessages.map(msg => ({
      id: msg.id,
      type: 'whatsapp',
      title: `Auto-Alert: ${msg.errorIssue}`,
      subtitle: `${msg.appliedRule} • ${msg.storeName}`,
      timestamp: msg.timestamp,
      tab: 'whatsapp'
    }))
  ].slice(0, 8);

  const handleOpenItem = (tab) => {
    setActiveTab(tab);
    setHasUnreadAlert(false);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#161D2B] border border-[#243044] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="p-3.5 bg-[#0B0F17] border-b border-[#243044] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Operations Notification Feed</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#243044]/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No active alerts or emergency incidents.
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleOpenItem(item.tab)}
              className="p-3 hover:bg-slate-900/80 transition cursor-pointer flex items-start space-x-3 text-xs"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                item.type === 'incident' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {item.type === 'incident' ? (
                  <AlertOctagon className="w-3.5 h-3.5" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-100 truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">{item.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-[#0B0F17] border-t border-[#243044] text-[10px] text-center text-slate-400">
        Pine Labs Autonomous Deflection Dispatch Stream
      </div>
    </div>
  );
}
