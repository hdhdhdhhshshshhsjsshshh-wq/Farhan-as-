import React, { useState, useEffect } from "react";
import { JOBS } from "../jobs";
import { Job } from "../types";
import { Bike, Laptop, Briefcase, Coins, Wallet, DollarSign, Play, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface JobPanelProps {
  playerBalance: number;
  onEarn: (amount: number) => void;
}

const IconMapper: Record<string, React.ComponentType<any>> = {
  Bike: Bike,
  Laptop: Laptop,
  Briefcase: Briefcase,
  Coins: Coins
};

export default function JobPanel({ playerBalance, onEarn }: JobPanelProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [earningAnim, setEarningAnim] = useState<number | null>(null);
  const [cryptoOutcome, setCryptoOutcome] = useState<{ type: "win" | "lose"; amt: number } | null>(null);

  useEffect(() => {
    let t: any;
    if (activeJobId) {
      const job = JOBS.find((j) => j.id === activeJobId);
      if (!job) return;

      const stepTimeMs = 50; 
      const totalSteps = job.durationMs / stepTimeMs;
      let currentStep = 0;

      t = setInterval(() => {
        currentStep++;
        const currentProgress = (currentStep / totalSteps) * 100;
        setProgress(Math.min(currentProgress, 100));

        if (currentStep >= totalSteps) {
          clearInterval(t);
          
          let payout = job.reward;
          // Custom Crypto investment outcome logic
          if (job.id === "crypto") {
            const isWin = Math.random() < 0.55; // 55% chance of winning
            if (isWin) {
              payout = job.reward;
              setCryptoOutcome({ type: "win", amt: payout });
            } else {
              payout = -150000; // Lose Rp 150.000
              setCryptoOutcome({ type: "lose", amt: payout });
            }
          }

          onEarn(payout);
          setEarningAnim(payout);
          setActiveJobId(null);
          setProgress(0);

          setTimeout(() => {
            setEarningAnim(null);
          }, 2000);

          setTimeout(() => {
            setCryptoOutcome(null);
          }, 3500);
        }
      }, stepTimeMs);
    }

    return () => {
      if (t) clearInterval(t);
    };
  }, [activeJobId, onEarn]);

  const handleStartJob = (jobId: string) => {
    if (activeJobId) return; // Wait for current job to finish
    setActiveJobId(jobId);
    setProgress(0);
    setCryptoOutcome(null);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl text-slate-800 relative overflow-hidden">
      {/* Balances & header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#075e54]" />
          <h2 className="font-bold text-base text-slate-900">Kerja Sampingan (Cari Modal)</h2>
        </div>
        <div className="bg-[#efe7de]/50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
            Dompet Kamu
          </span>
          <span className="font-mono text-sm font-bold text-[#075e54]">
            {formatRupiah(playerBalance)}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Butuh dana ekstra buat nraktir skincare pacar virtualmu? Kerjain side jobs di bawah ini secara instan!
      </p>

      {/* Floating Earning animation notification */}
      <AnimatePresence>
        {earningAnim !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: -10, scale: 1.1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ duration: 0.6, type: "spring" }}
            className={`absolute top-2 left-1/2 transform -translate-x-1/2 z-50 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 shadow-lg ${
              earningAnim > 0 
                ? "bg-[#075e54] text-white shadow-[#075e54]/20" 
                : "bg-rose-500 text-white shadow-rose-500/20"
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            {earningAnim > 0 
              ? `Berhasil Gajian! +${formatRupiah(earningAnim)}` 
              : `Apes Rugi Investasi! ${formatRupiah(earningAnim)}`
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jobs lists */}
      <div className="space-y-3">
        {JOBS.map((job) => {
          const IconComponent = IconMapper[job.icon] || Briefcase;
          const isThisJobActive = activeJobId === job.id;
          const isButtonDisabled = activeJobId !== null;

          return (
            <div
              key={job.id}
              className={`p-3 rounded-2xl border transition-all duration-200 ${
                isThisJobActive
                  ? "bg-[#efe7de]/30 border-[#075e54]/50"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${
                  job.id === "crypto" ? "bg-amber-500/10 text-amber-600" : "bg-[#075e54]/10 text-[#075e54]"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-slate-800 truncate block">
                      {job.title}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      job.id === "crypto" ? "text-amber-600" : "text-[#075e54]"
                    }`}>
                      {job.id === "crypto" ? `Max +${formatRupiah(job.reward)}` : `+${formatRupiah(job.reward)}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {job.desc}
                  </p>

                  {/* Job taking progress bar feedback */}
                  {isThisJobActive && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-mono">
                        <span>Sedang dikerjakan...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#075e54] to-[#128c7e] h-full transition-all duration-75"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Active crypto outcome alerts */}
                  {job.id === "crypto" && cryptoOutcome && (
                    <div className={`mt-2.5 p-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 ${
                      cryptoOutcome.type === "win" 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {cryptoOutcome.type === "win" 
                        ? "Cuan luber! Koin meroket ke bulan 🚀" 
                        : "Gagal sangkut! Koin rugi bandar ditarik dev 😱"
                      }
                    </div>
                  )}

                  {/* Start action button */}
                  {!isThisJobActive && (
                    <button
                      onClick={() => handleStartJob(job.id)}
                      disabled={isButtonDisabled}
                      className={`mt-2.5 w-full flex items-center justify-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                        isButtonDisabled
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : job.id === "crypto"
                            ? "bg-amber-150 text-amber-800 border border-amber-200 hover:bg-amber-200"
                            : "bg-[#075e54]/10 text-[#075e54] border border-[#075e54]/20 hover:bg-[#075e54]/20"
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {job.id === "crypto" ? "Gacha Investasi" : "Mulai Bekerja"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
