import React from "react";
import { PERSONAS } from "../characters";
import { GameState } from "../types";
import { Heart, RefreshCw, Trophy, AlertTriangle, Gift, Sparkles } from "lucide-react";

interface StatsPanelProps {
  gameState: GameState;
  onGift: (giftName: string, cost: number, relationshipBoost: number) => void;
  onReset: () => void;
}

export default function StatsPanel({ gameState, onGift, onReset }: StatsPanelProps) {
  const personaConfig = PERSONAS[gameState.persona];

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Descriptive text for Relationship Score ranges
  const getRelationshipStatus = (score: number) => {
    if (score <= 0) {
      return {
        label: "PUTUS & DIBLOKIR!",
        desc: "Yah, kamu sudah diputusin dan diblokir dari kontaknya! Hubungan berakhir fatal karena kekhilafanmu.",
        color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
        barColor: "bg-rose-600"
      };
    }
    if (score < 35) {
      return {
        label: "KRITIS / NGAMBEK PARAH 🚨",
        desc: "Kondisi darurat! Dia lagi super cuek, curigaan, dan ketus. Kirimin duit skincare deeh biar cepet adem!",
        color: "text-red-400 bg-red-400/10 border-red-400/20",
        barColor: "bg-red-500"
      };
    }
    if (score < 65) {
      return {
        label: "STABIL / SEADANYA 💤",
        desc: "Status pacaran normal tapi sedikit bosen. Sedikit salah omong atau nolak jajan bisa bikin dia ngambek.",
        color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        barColor: "bg-amber-500"
      };
    }
    if (score < 85) {
      return {
        label: "MENGGELORA / SAYANG BANGET 🥰",
        desc: "Dia sayang beneran sama kamu. Sering kirim emoji hati dan manja-manja bawel di chat.",
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        barColor: "bg-emerald-500"
      };
    }
    return {
      label: "SULTAN BUCIN / CINTA MATI 👑❤️",
      desc: "Luar biasa! Dia cinta seutuhnya sama kamu. Bisa diajak berhubungan intim/ketemuan romantis di mana saja!",
      color: "text-pink-400 bg-pink-400/10 border-pink-400/20",
      barColor: "bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse"
    };
  };

  const status = getRelationshipStatus(gameState.relationshipScore);

  // Emojis based on GF's current emotional state
  const getMoodConfig = (mood: string) => {
    switch (mood) {
      case "manis":
        return { text: "Manis (Sweet)", emoji: "🥰", style: "text-pink-400 border-pink-500/20 bg-pink-500/5" };
      case "ngambek":
        return { text: "Ngambek (Sulky)", emoji: "😒", style: "text-amber-400 border-amber-500/20 bg-amber-500/5" };
      case "marah":
        return { text: "Marah Besar (Angry)", emoji: "😡", style: "text-rose-500 border-rose-500/20 bg-rose-500/5" };
      case "senang":
        return { text: "Senang (Excited/Happy)", emoji: "🎉😘", style: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      default:
        return { text: "Normal", emoji: "🙂", style: "text-slate-400 border-slate-700 bg-slate-800/10" };
    }
  };

  const currentMoodInfo = getMoodConfig(gameState.mood);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl text-slate-800 flex flex-col gap-4">
      {/* GF Identity */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#075e54] shrink-0">
          <img
            src={personaConfig.avatar}
            alt={gameState.girlfriendName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-slate-900 truncate flex items-center gap-1.5">
            {gameState.girlfriendName}
          </h3>
          <span className="text-slate-500 text-xs block truncate leading-tight">
            {personaConfig.title}
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentMoodInfo.style} flex items-center gap-1`}>
              <span>{currentMoodInfo.emoji}</span>
              <span>{currentMoodInfo.text}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Relationship Meter */}
      <div className="bg-[#efe7de]/40 border border-slate-200 p-4 rounded-2xl flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-500 tracking-wide flex items-center gap-1">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            Skor Hubungan
          </span>
          <span className={`font-mono text-base font-bold ${gameState.relationshipScore < 30 ? 'text-rose-600' : 'text-[#075e54]'}`}>
            {gameState.relationshipScore}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden relative border border-slate-300">
          <div
            className={`h-full transition-all duration-300 ${status.barColor}`}
            style={{ width: `${gameState.relationshipScore}%` }}
          />
        </div>

        {/* Dynamic status alert description */}
        <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${status.color}`}>
          <span className="font-bold block mb-0.5">{status.label}</span>
          <p className="opacity-90">{status.desc}</p>
        </div>
      </div>

      {/* Gift options to directly pamper */}
      <div className="bg-[#efe7de]/20 border border-slate-200 p-3.5 rounded-2xl">
        <span className="text-xs font-semibold text-slate-500 block mb-2.5 flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-[#075e54]" />
          Kirim Kado Kilat (Bujuk Pacar)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onGift("Cup Boba Manis", 45000, 8)}
            disabled={gameState.playerBalance < 45000 || gameState.isPutus}
            className="p-2 border border-slate-200 hover:border-pink-300 bg-white hover:bg-pink-50 rounded-xl transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-pink-600 transition-colors">🥤 Beli Boba</span>
            <span className="text-[10px] font-mono text-green-700 mt-0.5">{formatRupiah(45000)}</span>
            <span className="text-[9px] text-pink-600 font-medium mt-1">Luluh Hubungan +8%</span>
          </button>

          <button
            onClick={() => onGift("Paket Skincare Glow", 220000, 25)}
            disabled={gameState.playerBalance < 220000 || gameState.isPutus}
            className="p-2 border border-slate-200 hover:border-pink-300 bg-white hover:bg-pink-50 rounded-xl transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-800 group-hover:text-pink-600 transition-colors">💄 Skincare Glow</span>
            <span className="text-[10px] font-mono text-green-700 mt-0.5">{formatRupiah(220000)}</span>
            <span className="text-[9px] text-pink-600 font-medium mt-1">Luluh Hubungan +25%</span>
          </button>
        </div>
      </div>

      {/* Saku Pacar Track */}
      <div className="flex justify-between items-center bg-[#efe7de]/30 p-3 rounded-xl border border-slate-200 text-xs">
        <span className="text-slate-500">Total Uang Saku Pacar</span>
        <span className="font-mono font-bold text-pink-600">
          {formatRupiah(gameState.gfBalance)}
        </span>
      </div>

      {/* Reset Action */}
      <button
        onClick={onReset}
        className="mt-2 w-full border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all text-center shadow-sm cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Mulai Ulang Game (Putus / Ganti Pacar)
      </button>
    </div>
  );
}
