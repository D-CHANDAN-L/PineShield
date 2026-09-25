import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Key, CheckCircle, ExternalLink, X, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [keyInput, setKeyInput] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('PINELABS_GEMINI_KEY') || '' : ''
  );
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('PINELABS_GEMINI_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
      setKeyInput(stored === 'your_gemini_api_key_here' ? '' : stored);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e?.preventDefault();
    if (keyInput.trim()) {
      localStorage.setItem('PINELABS_GEMINI_KEY', keyInput.trim());
    } else {
      localStorage.removeItem('PINELABS_GEMINI_KEY');
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('PINELABS_GEMINI_KEY');
    setKeyInput('');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md my-auto bg-[#161D2B] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Key className="w-4 h-4"/> Connect Google Gemini API
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          Enter your free API key from Google AI Studio. The key is stored locally in your browser.
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-2 pr-9 text-xs bg-[#0B0F17] border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-emerald-300"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline flex items-center gap-1"
            >
              Get a free key at Google AI Studio <ExternalLink className="w-3 h-3"/>
            </a>
            {typeof window !== 'undefined' && localStorage.getItem('PINELABS_GEMINI_KEY') && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer text-[10px]"
              >
                <Trash2 className="w-3 h-3" /> Clear Key
              </button>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
            >
              {saved ? <><CheckCircle className="w-4 h-4"/> Saved!</> : 'Save & Activate Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
