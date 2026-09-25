import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { 
  Shield, 
  MessageSquare, 
  Sparkles, 
  Cpu, 
  Sun, 
  Moon,
  RefreshCw,
  Smartphone,
  Edit2,
  ChevronDown
} from 'lucide-react';

export default function Header({ activeRoute, onNavigate }) {
  const {
    currentProfile = {},
    customPhoneNumber,
    setIsProfileModalOpen,
    setIsPhoneModalOpen,
    setIsApiKeyModalOpen,
    toggleDemoProfile,
    hasUnreadAlert = false,
    whatsAppMessages = [],
    whatsAppAlerts = [],
    theme,
    toggleTheme,
    activeTab = 'simulator',
    setActiveTab
  } = useMerchant() || {};

  const currentTab = activeRoute || activeTab;

  const handleTabClick = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  const messageCount = (whatsAppMessages?.length ?? whatsAppAlerts?.length ?? 0);
  const isNonAgg = currentProfile?.architecture === "Non-Aggregator";

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-50 transition-colors w-full shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* 1. Primary Brand Identity (PineShield - Dominant Hierarchy) */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
              <Shield className="w-5 h-5 fill-white/10" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Pine<span className="text-emerald-500">Shield</span>
              </span>
            </div>
          </div>

          {/* 2. Primary Navigation Bar (Center - Visual Dominance) */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            {/* Tab 1: POS Simulator */}
            <button
              id="tab-btn-simulator"
              onClick={() => handleTabClick('simulator')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'simulator'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>POS Simulator</span>
            </button>

            {/* Tab 2: AI PineShield */}
            <button
              id="tab-btn-triage"
              onClick={() => handleTabClick('triage')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'triage'
                  ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>PineShield AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="AI Assistant Available" />
            </button>

            {/* Tab 3: Store Manager WhatsApp */}
            <button
              id="tab-btn-whatsapp"
              onClick={() => handleTabClick('whatsapp')}
              className={`relative flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'whatsapp'
                  ? 'bg-[#00A884] text-white font-bold shadow-md shadow-[#00A884]/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Store Manager WhatsApp</span>
              {messageCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  hasUnreadAlert ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {messageCount}
                </span>
              )}
            </button>
          </nav>

          {/* 3. Secondary Meta Cluster (Right - De-emphasized, Muted & Grouped with Stable Anchors) */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
            
            {/* Merchant Profile Switcher (Fixed-width container prevents header layout shift on profile switch) */}
            <div 
              id="profile-switcher-pill"
              onClick={() => setIsProfileModalOpen?.(true)}
              className="w-[150px] sm:w-[156px] flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-xs cursor-pointer transition select-none border border-slate-200/50 dark:border-slate-800 flex-shrink-0"
              title="Click to view full merchant store profile details"
            >
              <div className="flex items-center space-x-1.5 truncate">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isNonAgg ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                <span className="font-medium text-[11px] truncate">
                  {(currentProfile?.managerName || 'Store Manager').split(' ')[0]} ({isNonAgg ? 'Non-Agg' : 'Agg'})
                </span>
              </div>
              <button
                id="btn-switch-profile"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDemoProfile?.();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 transition cursor-pointer flex-shrink-0"
                title="1-Click Switch Architecture"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Live WhatsApp Destination Phone Pill (Fixed-width container) */}
            <div
              id="test-phone-pill"
              onClick={() => setIsPhoneModalOpen?.(true)}
              className="hidden lg:flex items-center justify-between w-[164px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-400 text-xs cursor-pointer transition select-none border border-slate-200/50 dark:border-slate-800 flex-shrink-0"
              title="Click to configure live recipient WhatsApp phone number"
            >
              <div className="flex items-center space-x-1.5 truncate">
                <Smartphone className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">
                  {customPhoneNumber || currentProfile?.managerPhone || "+91 98765 43210"}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-slate-400 hover:text-[#25D366] flex-shrink-0" />
            </div>

            {/* Dark / Light Mode Toggle (Fixed 32x32) */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row (Cleanly centered & strictly 3 primary tabs) */}
        <div className="flex md:hidden items-center justify-between pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800/80 gap-1.5">
          <nav className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl w-full justify-around text-xs">
            <button
              id="mobile-tab-btn-simulator"
              onClick={() => handleTabClick('simulator')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                currentTab === 'simulator' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Simulator</span>
            </button>
            <button
              id="mobile-tab-btn-triage"
              onClick={() => handleTabClick('triage')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                currentTab === 'triage' ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>PineShield AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
            <button
              id="mobile-tab-btn-whatsapp"
              onClick={() => handleTabClick('whatsapp')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-center transition cursor-pointer text-[11px] flex items-center justify-center gap-1 relative ${
                currentTab === 'whatsapp' ? 'bg-[#00A884] text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
              {messageCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5 animate-pulse" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
