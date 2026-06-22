import React, { useState } from "react";
import { PERSONAS, PersonaConfig } from "../characters";
import { GirlfriendPersona } from "../types";
import { Heart, UserPlus, Info, ShieldAlert } from "lucide-react";

interface GfSelectorProps {
  onSelect: (persona: GirlfriendPersona, customName: string) => void;
}

export default function GfSelector({ onSelect }: GfSelectorProps) {
  const [selected, setSelected] = useState<GirlfriendPersona>("adel");
  const [name, setName] = useState<string>("");

  const currentPersona = PERSONAS[selected];

  const handleStart = () => {
    const finalName = name.trim() || currentPersona.name.split(" ")[0];
    onSelect(selected, finalName);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 overflow-hidden">
      {/* Title & Introduction */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center bg-[#075e54]/10 text-[#075e54] p-3 rounded-2xl mb-3">
          <Heart className="w-8 h-8 fill-[#075e54] animate-pulse text-[#075e54]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          WhatsApp Pacar Simulator AI
        </h1>
        <p className="text-sm text-slate-500 px-4">
          Pilih salah satu tipe pasangan virtualmu di bawah ini, lalu tantang dirimu untuk mempertahankan hubungan!
        </p>
      </div>

      {/* Grid of Girlfriend Profiles */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.keys(PERSONAS) as GirlfriendPersona[]).map((key) => {
          const config = PERSONAS[key];
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => {
                setSelected(key);
                setName(""); // Reset custom name
              }}
              className={`relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 border-2 cursor-pointer ${
                isSelected
                  ? "bg-[#075e54]/10 border-[#075e54] shadow-lg shadow-emerald-500/5 scale-102"
                  : "bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-slate-200">
                <img
                  src={config.avatar}
                  alt={config.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#075e54]/10" />
                )}
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-800">
                {config.name.split(" ")[0]}
              </span>
              <span className="text-[10px] text-slate-500 text-center mt-1 font-mono">
                {config.id === "adel" ? "Jaksel Vibe" : config.id === "karin" ? "Tsundere" : "Kalem"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Girlfriend Details Card */}
      <div className="bg-[#efe7de]/40 border border-slate-200 rounded-2xl p-4 mb-6 transition-all duration-300">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{currentPersona.name}</h3>
            <p className="text-xs text-[#075e54] font-semibold">{currentPersona.title}</p>
          </div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${currentPersona.accentBg}`}>
            {currentPersona.initialMood === "marah" ? "🚨 Level Sultan" : "💚 Level Normal"}
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {currentPersona.description}
        </p>

        {/* Traits Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {currentPersona.traits.map((trait, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold bg-white border border-slate-250 text-slate-600 px-2.5 py-1 rounded-lg shadow-xs"
            >
              ✨ {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Setup custom nickname or options */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            Nama Kontak WhatsApp (Opsional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Contoh: Sayang ❤️ (Default: ${currentPersona.name.split(" ")[0]})`}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#075e54] focus:ring-1 focus:ring-[#075e54] placeholder:text-slate-400"
          />
        </div>

        {/* Informative alerts */}
        <div className="bg-[#efe7de]/20 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">Aturan Main & Tantangan:</span>
            <p>
              Jangan sampai status hubungan turun ke <span className="text-rose-600 font-bold">0%</span>. Jika pacarmu putus atau memblokir nomor WA-mu, tamatlah riwayat percintaanmu! Siapkan uang saku untuk mentransfer manja biar pacarmu luluh.
            </p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={handleStart}
        className="w-full bg-[#075e54] hover:bg-[#128c7e] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#075e54]/10 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        Mulai Simulasi Chatting
      </button>
    </div>
  );
}
