import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMerchant } from '../../context/MerchantContext';
import { 
  Phone, 
  X, 
  Check, 
  RotateCcw, 
  Zap, 
  RefreshCw,
  Send
} from 'lucide-react';
import { sendAutomatedWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';

export default function PhoneEditModal({ isOpen, onClose }) {
  const { 
    customPhoneNumber, 
    setCustomPhoneNumber, 
    resetCustomPhoneNumber,
    currentProfile,
    gatewayMode,
    setGatewayMode
  } = useMerchant();

  const [inputVal, setInputVal] = useState(customPhoneNumber || "");
  const [selectedGateway, setSelectedGateway] = useState(gatewayMode || 'auto');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestingDispatch, setIsTestingDispatch] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setInputVal(customPhoneNumber || currentProfile.managerPhone);
      setSelectedGateway(gatewayMode || 'auto');
      setSavedSuccess(false);
      setTestResult(null);
    }
  }, [isOpen, customPhoneNumber, currentProfile, gatewayMode]);

  if (!isOpen) return null;

  const cleanDigits = inputVal.replace(/[^0-9]/g, '');

  const handleSave = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setCustomPhoneNumber(inputVal.trim());
    if (setGatewayMode) {
      setGatewayMode(selectedGateway);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    resetCustomPhoneNumber();
    setInputVal(currentProfile.managerPhone);
    setSelectedGateway('auto');
    if (setGatewayMode) setGatewayMode('auto');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleTestDispatch = async () => {
    if (!cleanDigits) return;
    setIsTestingDispatch(true);
    setTestResult(null);

    const testMsg = formatWhatsAppMessage({
      storeName: currentProfile.storeName,
      posId: currentProfile.posId,
      model: currentProfile.modelBadge,
      architecture: currentProfile.architecture,
      errorIssue: "TID NOT PRESENT",
      reasonOfOccurrence: "TID deactivated by acquiring host switch.",
      solution: "Merchant should contact Acquiring bank. Pine Labs support cannot unblock bank-owned TIDs.",
      deflectionTarget: `${currentProfile.acquirer} Merchant Helpdesk`,
      bankTollFree: "1800 202 6161 / 1860 267 6161 / 1800 258 3838",
      bankEmail: "pos.helpdesk@hdfc.bank.in",
      caseRef: `PL-TEST-${Math.floor(1000 + Math.random() * 9000)}`
    });

    try {
      const res = await sendAutomatedWhatsApp({
        to: cleanDigits,
        message: testMsg,
        gateway: selectedGateway,
        metadata: {
          storeName: currentProfile.storeName,
          posId: currentProfile.posId,
          errorIssue: "GATEWAY_TEST",
          caseRef: `PL-TEST-${Date.now()}`
        }
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingDispatch(false);
    }
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg my-auto bg-white dark:bg-[#161D2B] rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white transition-colors space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>WhatsApp Automated Dispatch Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
                  POST /api/send-whatsapp
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dispatches resolution alerts automatically in the background without manual clicks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* 1. Recipient Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Destination Phone Number (with Country Code)
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. 919845012345 or +91 98450 12345"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Include country code without '+' or spaces (e.g., <strong>919845012345</strong> for India). Automated API messages target this number.
            </p>
          </div>

          {/* 2. Automated Gateway Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Automated Dispatch Sender Gateway
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              
              {/* Option A: Auto-Detect / Dev Mode */}
              <div
                onClick={() => setSelectedGateway('auto')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-1 ${
                  selectedGateway === 'auto'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <span>⚡</span>
                  <span>Auto / Sandbox</span>
                </div>
                <p className="text-[10px] leading-tight opacity-80">
                  Zero-friction auto fallback with terminal logging.
                </p>
              </div>

              {/* Option B: Company Official (Twilio) */}
              <div
                onClick={() => setSelectedGateway('twilio')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-1 ${
                  selectedGateway === 'twilio'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <span>🏢</span>
                  <span>Company Twilio</span>
                </div>
                <p className="text-[10px] leading-tight opacity-80">
                  Official verified sender (whatsapp:+14155238886).
                </p>
              </div>

              {/* Option C: Personal / Store Number (Green-API / UltraMsg) */}
              <div
                onClick={() => setSelectedGateway('green_api')}
                className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-1 ${
                  selectedGateway === 'green_api'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <span>📱</span>
                  <span>Store Device</span>
                </div>
                <p className="text-[10px] leading-tight opacity-80">
                  Green-API / UltraMsg real merchant instance.
                </p>
              </div>
            </div>
          </div>

          {/* Test Dispatch Button & Feedback */}
          <div className="p-3 bg-slate-50 dark:bg-[#0B0F17] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase font-bold text-slate-500 font-sans">
                Background API Dispatch Check:
              </span>
              <button
                type="button"
                onClick={handleTestDispatch}
                disabled={!cleanDigits || isTestingDispatch}
                className="py-1 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isTestingDispatch ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Calling POST /api/send-whatsapp...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>⚡ Send Test Automated Dispatch</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-xl text-[11px] font-mono border flex items-center justify-between ${
                testResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              }`}>
                <span>{testResult.success ? `✓ Delivered: ${testResult.provider || testResult.mode}` : `✕ Error: ${testResult.error}`}</span>
                <span className="text-[10px] opacity-75">{testResult.messageId || '200 OK'}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset to Store Manager's default phone number"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!cleanDigits}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Configuration Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
