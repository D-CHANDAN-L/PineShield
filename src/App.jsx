import React, { useEffect } from 'react';
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
          onNavigateToTriage={() => navigate(ROUTES.TRIAGE)} 
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
          onNavigateToTriage={() => navigate(ROUTES.TRIAGE)} 
        />
      );
  }
}

function MainWorkbench() {
  const { currentRoute, navigate } = useRouter();
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
          <div className="space-y-4 animate-in fade-in duration-150">
            <MainRouterView currentRoute={currentRoute} navigate={navigate} />
          </div>
        </TabErrorBoundary>
      </main>

      {/* Enterprise Compliance Footer */}
      <footer className="border-t border-slate-200 dark:border-[#243044] bg-white dark:bg-[#0B0F17] py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-pine" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Pine Labs POS Sentinel Operations Cockpit
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              | ISO/IEC 27001 & PCI-DSS Level 1
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
            <span>Autonomous Acquirer Deflection Active</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live Switch Telemetry</span>
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
