import React, { useState } from 'react';
import { BANK_DIRECTORY } from '../../data/bankDirectory';
import { 
  Building2, 
  Phone, 
  Mail, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  PhoneCall, 
  CheckCircle2, 
  CreditCard,
  Headphones,
  Search,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

export default function BankDirectory() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // ALL, ACQUIRER, AMEX, PINELABS

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const directoryEntries = Object.entries(BANK_DIRECTORY).filter(([key, bank]) => {
    const term = searchTerm.toLowerCase();
    const phoneList = Array.isArray(bank.phone) ? bank.phone : Array.isArray(bank.tollFree) ? bank.tollFree : [bank.phone || bank.tollFree || ''];
    const matchesSearch = 
      bank.bankName.toLowerCase().includes(term) ||
      phoneList.some(p => String(p).toLowerCase().includes(term)) ||
      (bank.email && bank.email.toLowerCase().includes(term)) ||
      key.toLowerCase().includes(term);

    const matchesFilter = 
      selectedFilter === "ALL" ||
      (selectedFilter === "ACQUIRER" && !key.includes("Amex") && !key.includes("American") && !key.includes("Pine")) ||
      (selectedFilter === "AMEX" && (key.includes("Amex") || key.includes("American"))) ||
      (selectedFilter === "PINELABS" && key.includes("Pine"));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Directory Header Banner */}
      <div className="bg-gradient-to-r from-[#00382B] via-[#004733] to-[#161D2B] border border-pine/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-80 h-80 bg-pine/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pine-lime animate-pulse" />
              <span className="text-[10px] font-bold text-pine-lime uppercase tracking-widest font-mono">
                Official Zero-Touch Deflection Directory
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Acquiring Bank & Card Scheme Helpdesk Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Direct merchant escalation channels for Non-Aggregator TID deactivations (Rule 1), 
              Amex India scheme provisioning (Rule 3), and Pine Labs Plutus L2 Aggregator support (Rule 2).
            </p>
          </div>

          <div className="flex items-center bg-black/40 border border-white/20 rounded-2xl px-3.5 py-2 w-full md:w-72 shadow-inner">
            <Search className="w-4 h-4 text-slate-300 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bank, phone, or email..."
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full font-mono"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-white/10 text-xs">
          <span className="text-[11px] text-slate-300 font-semibold mr-1">Filter Desks:</span>
          {[
            { id: "ALL", label: "All Desks (6)" },
            { id: "ACQUIRER", label: "Acquiring Banks (4)" },
            { id: "AMEX", label: "Amex India (1)" },
            { id: "PINELABS", label: "Pine Labs Plutus L2 (1)" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer text-[11px] ${
                selectedFilter === f.id
                  ? "bg-pine-lime text-slate-950 font-bold shadow-md"
                  : "bg-black/30 hover:bg-black/50 text-slate-200 border border-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {directoryEntries.map(([key, bank]) => {
          const isAmex = key === "American Express";
          const isPineLabs = key === "Pine Labs Plutus Desk";

          return (
            <div
              key={key}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden ${
                isAmex 
                  ? "bg-sky-50/50 dark:bg-gradient-to-b dark:from-[#0b223d]/90 dark:to-[#161D2B] border-sky-300 dark:border-sky-500/40 hover:border-sky-400"
                  : isPineLabs
                  ? "bg-emerald-50/50 dark:bg-gradient-to-b dark:from-[#00382B]/90 dark:to-[#161D2B] border-emerald-300 dark:border-pine/50 hover:border-pine"
                  : "bg-white dark:bg-[#161D2B] border-slate-200 dark:border-[#243044] hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            >
              {/* Badge & Title */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    isAmex
                      ? "bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 font-mono"
                      : isPineLabs
                      ? "bg-emerald-100 dark:bg-pine/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-pine/40 font-mono"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-mono"
                  }`}>
                    {bank.category || (isPineLabs ? "Internal L2 Switch" : isAmex ? "Card Scheme Partner" : "Acquiring Bank")}
                  </span>

                  <span className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>TAT: {bank.tat}</span>
                  </span>
                </div>

                <div className="flex items-start space-x-2.5 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isAmex 
                      ? "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30"
                      : isPineLabs
                      ? "bg-emerald-100 dark:bg-pine/20 text-emerald-700 dark:text-pine border border-emerald-300 dark:border-pine/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}>
                    {isAmex ? <CreditCard className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      {bank.bankName}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{bank.notes}</p>
                  </div>
                </div>

                {/* Contact Rows */}
                <div className="space-y-2 text-xs font-mono mb-4">
                  {/* Toll-Free / Phone Numbers */}
                  {((bank.phone && bank.phone.length > 0) || bank.tollFree) && (
                    <div className="bg-slate-50 dark:bg-[#0B0F17] p-2.5 rounded-xl border border-slate-200 dark:border-[#243044] space-y-2">
                      <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">
                        Helpline / Toll-Free Support
                      </span>
                      {(Array.isArray(bank.phone) ? bank.phone : Array.isArray(bank.tollFree) ? bank.tollFree : [bank.tollFree || bank.phone]).map((numStr, pIdx) => {
                        const cleanNum = String(numStr).split('—')[0].split('(')[0].trim();
                        return (
                          <div key={pIdx} className="flex justify-between items-center pt-1 border-t border-slate-200/50 dark:border-slate-800/50 first:border-0 first:pt-0">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11.5px] font-mono">{numStr}</span>
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleCopy(cleanNum, `${key}-phone-${pIdx}`)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                                title="Copy number"
                              >
                                {copiedKey === `${key}-phone-${pIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <a
                                href={`tel:${cleanNum.replace(/[^0-9+]/g, '')}`}
                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:text-white transition"
                                title="Direct Dial"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Direct Helpline / Landline */}
                  {(bank.helpline || bank.landline) && (
                    <div className="bg-slate-50 dark:bg-[#0B0F17] p-2.5 rounded-xl border border-slate-200 dark:border-[#243044] flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">
                          Direct Helpline / Landline
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11.5px]">
                          {bank.helpline || bank.landline}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(bank.helpline || bank.landline, `${key}-landline`)}
                        className="text-[10px] font-sans text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        {copiedKey === `${key}-landline` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}

                  {/* Amex 24/7 Authorisation Helpdesk */}
                  {bank.auth24x7 && (
                    <div className="bg-amber-50/60 dark:bg-[#0B0F17] p-2.5 rounded-xl border border-amber-200 dark:border-[#243044] flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase font-sans font-bold">
                          24/7 Authorisation Helpdesk
                        </span>
                        <span className="font-bold text-amber-800 dark:text-amber-300 text-[11.5px]">{bank.auth24x7}</span>
                      </div>
                      <a
                        href={`tel:${bank.auth24x7}`}
                        className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:text-white transition"
                        title="Direct Dial 24/7 Desk"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Email */}
                  {bank.email && (
                    <div className="bg-slate-50 dark:bg-[#0B0F17] p-2.5 rounded-xl border border-slate-200 dark:border-[#243044] flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">
                          Helpdesk Email
                        </span>
                        <span className="font-bold text-sky-600 dark:text-sky-400 text-[11px] truncate block">
                          {bank.email}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(bank.email, `${key}-email`)}
                        className="text-[10px] font-sans text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0"
                      >
                        {copiedKey === `${key}-email` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                {bank.webPortal ? (
                  <a
                    href={bank.webPortal}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 transition"
                  >
                    <span>Merchant Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Official Merchant Servicing</span>
                )}

                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-pine" />
                  <span>SOP Verified</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
