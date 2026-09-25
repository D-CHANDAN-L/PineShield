import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MerchantProvider, useMerchant } from './context/MerchantContext';
import { useRouter, ROUTES } from './hooks/useRouter';
import Header from './components/Layout/Header';
import SmartPOSTerminal from './components/POSSimulator/SmartPOSTerminal';
import GeminiTriageStudio from './components/Chatbot/GeminiTriageStudio';
import WhatsAppSimulator from './components/WhatsApp/WhatsAppSimulator';
import OneTrustBanner from './components/Navigation/OneTrustBanner';
import DemoProfileModal from './components/Navigation/DemoProfileModal';
import PhoneEditModal from './components/Layout/PhoneEditModal';
import ApiKeyModal from './components/Layout/ApiKeyModal';
import { ShieldCheck } from 'lucide-react';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab view error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#111B21] border border-red-200 dark:border-rose-900/50 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center font-bold text-lg">
            ⚠️
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tab Render Error</h2>
          <p className="text-xs text-slate-500 dark:text-[#8696A0]">
            {this.state.error?.message || "An unexpected error occurred while rendering this tab."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95"
          >
            Reload Tab View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Router view with inter-screen deep-linking callbacks
function MainRouterView({ currentRoute, navigate }) {
  switch (currentRoute) {
    case ROUTES.SIMULATOR:
      return (
        <SmartPOSTerminal 
          onNavigateToTriage={(err) => navigate(ROUTES.TRIAGE, err ? { error: err } : {})} 
        />
      );
    
    case ROUTES.TRIAGE:
      return (
        <GeminiTriageStudio 
          onNavigateToWhatsApp={() => navigate(ROUTES.WHATSAPP)}
          onNavigateToSimulator={() => navigate(ROUTES.SIMULATOR)}
        />
      );
    
    case ROUTES.WHATSAPP:
      return (
        <WhatsAppSimulator 
          onNavigateToSimulator={() => navigate(ROUTES.SIMULATOR)} 
        />
      );
    
    default:
      return (
        <SmartPOSTerminal 
          onNavigateToTriage={(err) => navigate(ROUTES.TRIAGE, err ? { error: err } : {})} 
        />
      );
  }
}

function MainWorkbench() {
  const { currentRoute, navigate } = useRouter();
  const tabContentRef = useRef(null);

  const { 
    activeTab,
    setActiveTab,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isPhoneModalOpen,
    setIsPhoneModalOpen,
    isApiKeyModalOpen,
    setIsApiKeyModalOpen
  } = useMerchant();

  // Snappy non-blocking entrance animation (220ms) on route change
  useGSAP(() => {
    if (tabContentRef.current) {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }
      );
    }
  }, { dependencies: [currentRoute], scope: tabContentRef });

  // Keep MerchantContext activeTab in sync with currentRoute
  useEffect(() => {
    if (activeTab !== currentRoute && setActiveTab) {
      setActiveTab(currentRoute);
    }
  }, [currentRoute, activeTab, setActiveTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1311] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header activeRoute={currentRoute} onNavigate={navigate} />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        <TabErrorBoundary key={currentRoute} activeTab={currentRoute}>
          <div ref={tabContentRef} className="space-y-4">
            <MainRouterView currentRoute={currentRoute} navigate={navigate} />
          </div>
        </TabErrorBoundary>
      </main>

      {/* Enterprise Compliance Footer */}
      <footer className="border-t border-slate-200 dark:border-[#243044] bg-white dark:bg-[#0B0F17] py-3 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-center sm:text-left">
          {/* Brand & ISO/PCI Badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>PineShield Cockpit</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              ISO/IEC 27001 & PCI-DSS L1
            </span>
          </div>

          {/* Telemetry Status */}
          <div className="flex items-center justify-center space-x-2 text-[10.5px] sm:text-[11px] font-mono text-slate-400">
            <span className="hidden sm:inline">Autonomous Acquirer Deflection</span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Switch Telemetry
            </span>
          </div>
        </div>
      </footer>

      {/* OneTrust Consent Layer */}
      <OneTrustBanner />

      {/* Root-Level Modals (Viewport-Centered, Never Trapped by Header or Backdrop-Blur) */}
      <DemoProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <PhoneEditModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <MerchantProvider>
      <MainWorkbench />
    </MerchantProvider>
  );
}
