import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { 
  ShieldCheck, 
  MessageSquare, 
  Sparkles, 
  Cpu, 
  Sun, 
  Moon,
  RefreshCw,
  Smartphone,
  Edit2
} from 'lucide-react';

export default function Header({ activeRoute, onNavigate }) {
  const {
    currentProfile = {},
    customPhoneNumber,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isPhoneModalOpen,
    setIsPhoneModalOpen,
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
    <header className="border-b border-slate-200 dark:border-[#243044] bg-white/95 dark:bg-[#161D2B]/95 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Official Pine Labs logo with POS Sentinel badge */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-pine/15 border border-pine/30 rounded-xl flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-pine"/>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
              Pine Labs <span className="text-pine">POS Sentinel</span>
            </span>
            <span className="bg-pine/15 text-pine-dark dark:text-emerald-300 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-pine/30 uppercase tracking-wider hidden sm:inline-block">
              Zero-Touch Deflection
            </span>
          </div>
        </div>

        {/* Center: EXACTLY 3 Core Navigation Tabs in a Single Row */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#243044] p-1 rounded-2xl">
          {/* Tab 1: POS Simulator */}
          <button
            id="tab-btn-simulator"
            onClick={() => handleTabClick('simulator')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentTab === 'simulator'
                ? 'bg-pine text-slate-950 font-bold shadow-sm shadow-pine/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5"/>
            <span>POS Simulator</span>
          </button>

          {/* Tab 2: AI Triage Studio */}
          <button
            id="tab-btn-triage"
            onClick={() => handleTabClick('triage')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentTab === 'triage'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pine-lime"/>
            <span>AI Triage Studio</span>
          </button>

          {/* Tab 3: Store Manager WhatsApp */}
          <button
            id="tab-btn-whatsapp"
            onClick={() => handleTabClick('whatsapp')}
            className={`relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              currentTab === 'whatsapp'
                ? 'bg-[#00A884] text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5"/>
            <span>Store Manager WhatsApp</span>
            {messageCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                hasUnreadAlert ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-800 text-slate-100'
              }`}>
                {messageCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right: Demo Profile Chip + Custom WhatsApp Phone Pill + Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          
          {/* Demo Profile Chip & Switcher */}
          <div 
            id="profile-switcher-pill"
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-2xl border text-xs cursor-pointer transition shadow-sm select-none ${
              isNonAgg
                ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            }`}
            title="Click to view and switch between Non-Aggregator and Aggregator demo profiles"
          >
            <div className={`w-2 h-2 rounded-full ${isNonAgg ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
            
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[11px] truncate max-w-[130px] sm:max-w-none">
                {(currentProfile?.managerName || 'Store Manager').split(' ')[0]} ({isNonAgg ? 'Non-Agg' : 'Agg'}: {currentProfile?.posId || 'POS-01'})
              </span>
            </div>

            <button
              id="btn-switch-profile"
              onClick={(e) => {
                e.stopPropagation();
                toggleDemoProfile();
              }}
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-pine transition cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
              title="Instant 1-Click Toggle Profile"
            >
              <RefreshCw className="w-3 h-3 text-pine" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          </div>

          {/* Custom WhatsApp Phone Pill */}
          <div
            id="test-phone-pill"
            onClick={() => setIsPhoneModalOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] hover:border-[#25D366] text-xs cursor-pointer transition shadow-sm select-none"
            title="Click to enter your actual phone number for live WhatsApp alerts"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
            <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200">
              {customPhoneNumber || currentProfile?.managerPhone || "+91 98765 43210"}
            </span>
            <Edit2 className="w-3 h-3 text-slate-400 hover:text-[#25D366]" />
          </div>

          {/* Gemini AI — Server-secured badge (read-only, no key exposure) */}
          <div
            id="gemini-secured-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 select-none"
            title="Gemini AI key is secured server-side via Vercel environment variables"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI: Secured</span>
            <span className="sm:hidden">AI</span>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0F17] hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-[#243044] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Single Navigation Row for Small Viewports (Strictly 3 Tabs) */}
      <div className="flex md:hidden items-center justify-between pt-2 gap-2 overflow-x-auto">
        <nav className="flex items-center space-x-1 bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#243044] p-1 rounded-2xl text-[11px]">
          <button
            onClick={() => handleTabClick('simulator')}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
              currentTab === 'simulator' ? 'bg-pine text-slate-950 font-bold' : 'text-slate-500'
            }`}
          >
            POS Simulator
          </button>
          <button
            onClick={() => handleTabClick('triage')}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
              currentTab === 'triage' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500'
            }`}
          >
            AI Triage
          </button>
          <button
            onClick={() => handleTabClick('whatsapp')}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
              currentTab === 'whatsapp' ? 'bg-[#00A884] text-white font-bold' : 'text-slate-500'
            }`}
          >
            WhatsApp
          </button>
        </nav>

        {/* Mobile quick action pills */}
        <div className="flex sm:hidden items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-xl border border-emerald-800/60 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 select-none"
            title="Gemini AI secured server-side"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI</span>
          </div>
          <button
            onClick={() => setIsPhoneModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-[#25D366] font-mono bg-slate-50 dark:bg-[#0B0F17]"
          >
            <Smartphone className="w-3 h-3" />
            <span>Phone</span>
          </button>
        </div>
      </div>
    </header>
  );
}
