import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, Video, Search, ChevronLeft, MoreVertical, Send, CheckCheck, 
  Smile, Paperclip, Wallet, Heart, ArrowUpRight, Plus, MapPin, 
  MessageSquare, User, HelpCircle, X, ShieldAlert, Bike, Laptop, 
  Briefcase, Coins, Sparkles, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Message, GameState } from "./types";
import { PERSONAS } from "./characters";
import GfSelector from "./components/GfSelector";
import JobPanel from "./components/JobPanel";
import StatsPanel from "./components/StatsPanel";

const LOCAL_STORAGE_STATE_KEY = "wa_pacar_game_state_v1";
const LOCAL_STORAGE_MESSAGES_KEY = "wa_pacar_chat_history_v1";

const DEFAULT_STATE: GameState = {
  persona: "adel",
  girlfriendName: "Adel",
  relationshipScore: 50,
  mood: "ngambek",
  playerBalance: 400000, // Starts with Rp 400.000
  gfBalance: 0,
  isBlocked: false,
  isPutus: false,
  hasStarted: false
};

export default function App() {
  // Game states loaded from localStorage
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Custom Transfer modal state
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [customTransferVal, setCustomTransferVal] = useState<string>("");
  
  // Fake attachment drawer state
  const [isAttachmentOpen, setIsAttachmentOpen] = useState<boolean>(false);
  
  // Call indicators
  const [activeCallMessage, setActiveCallMessage] = useState<string | null>(null);

  // Responsive mobile active tab
  const [mobileTab, setMobileTab] = useState<"chat" | "jobs" | "status">("chat");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  // Keep chat scrolled down
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // If chat is empty and hasStarted, initialize greeting
  useEffect(() => {
    if (state.hasStarted && messages.length === 0) {
      const pConfig = PERSONAS[state.persona];
      const initialGreet: Message = {
        id: "sys-greet",
        sender: "gf",
        text: pConfig.initialMessage,
        timestamp: getCurrentTime(),
        isRead: true
      };
      setMessages([initialGreet]);
      setState((prev) => ({ ...prev, mood: pConfig.initialMood }));
    }
  }, [state.hasStarted, state.persona]);

  const getCurrentTime = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Triggers the API call to backend virtual girlfriend brain (Gemini)
  const triggerAiResponse = async (
    currentMessages: Message[],
    moneyAmt: number = 0,
    specialActionText?: string
  ) => {
    setIsTyping(true);
    setErrorMessage(null);

    // Limit chat history to last 12 messages for token sanity and prompt sizing
    const historyPayload = currentMessages.slice(-12).map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: state.persona,
          girlfriendName: state.girlfriendName,
          history: historyPayload,
          relationshipScore: state.relationshipScore,
          mood: state.mood,
          playerBalance: state.playerBalance,
          gfBalance: state.gfBalance,
          moneyAmtSentLastTurn: moneyAmt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "Missing API Key") {
          throw new Error("API-KEY-MISSING");
        }
        throw new Error(errorData.message || "Gagal menghubungi server pacar virtual.");
      }

      const data = await response.json();

      // Typing delays to feel incredibly realistic
      const pConfig = PERSONAS[state.persona];
      setTimeout(() => {
        setIsTyping(false);

        // Append the girlfriend's response message
        const gfMessageId = `gf-${Date.now()}`;
        const newGfMsg: Message = {
          id: gfMessageId,
          sender: "gf",
          text: data.reply,
          timestamp: getCurrentTime(),
          isRead: true
        };

        setMessages((prev) => [...prev, newGfMsg]);

        // Calculate new scores and variables safely
        let calculatedScore = Math.max(0, Math.min(100, state.relationshipScore + (data.relationshipScoreAdjustment || 0)));
        let finalPutus = data.isPutus || calculatedScore <= 0;

        // If she decided to ask for money, list it
        if (data.moneyRequest > 0) {
          const requestMsgId = `gf-req-${Date.now()}`;
          const newRequestMsg: Message = {
            id: requestMsgId,
            sender: "gf",
            text: `💸 Sayang meminta uang jajan sebesar ${formatRupiah(data.moneyRequest)} untuk keperluan dia.`,
            timestamp: getCurrentTime(),
            isMoneyRequest: true,
            requestAmount: data.moneyRequest,
            isResolved: false
          };
          setMessages((prev) => [...prev, newRequestMsg]);
        }

        setState((prev) => ({
          ...prev,
          relationshipScore: calculatedScore,
          mood: data.mood || prev.mood,
          isBlocked: finalPutus,
          isPutus: finalPutus
        }));

      }, pConfig.typingDelayMs);

    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      if (err.message === "API-KEY-MISSING") {
        setErrorMessage("GEMINI_KEY_MISSING");
      } else {
        setErrorMessage(err.message || "Jaringan lagi lag nih yank, coba kirim chat lagi ya.");
      }
    }
  };

  // Handler for sending standard text chats
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || state.isBlocked) return;

    const textToSend = inputText.trim();
    setInputText("");

    const userMessageId = `user-${Date.now()}`;
    const newUserMsg: Message = {
      id: userMessageId,
      sender: "user",
      text: textToSend,
      timestamp: getCurrentTime(),
      isRead: true
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);

    // Call Gemini brain integration
    triggerAiResponse(updatedMessages, 0);
  };

  // Handler for transferring customizable dinero (uang) directly inside WhatsApp chat
  const handleTransferCustomMoney = () => {
    const amt = parseInt(customTransferVal.replace(/[^0-9]/g, ""), 10);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert("Masukkan angka nominal transfer yang valid!");
      return;
    }

    if (state.playerBalance < amt) {
      alert("Saldo dompet kamu tidak mencukupi untuk melakukan transfer!");
      return;
    }

    setIsTransferOpen(false);
    setCustomTransferVal("");

    // Create user visual chat transfer successfully card
    const userTransferMsgId = `user-tf-${Date.now()}`;
    const transferMsg: Message = {
      id: userTransferMsgId,
      sender: "user",
      text: `💸 Berhasil Mentransfer ${formatRupiah(amt)}`,
      timestamp: getCurrentTime(),
      isMoneyTransfer: true,
      transferAmount: amt
    };

    // Deduce balances
    setState((prev) => ({
      ...prev,
      playerBalance: prev.playerBalance - amt,
      gfBalance: prev.gfBalance + amt
    }));

    const updatedMessages = [...messages, transferMsg];
    setMessages(updatedMessages);

    // Trigger her AI response with money transfer parameter injected
    triggerAiResponse(updatedMessages, amt);
  };

  // Handler to fulfill requests asked by girlfriend in Chat cards
  const handlePayRequest = (msgId: string, amount: number) => {
    if (state.playerBalance < amount) {
      alert("Aduh saldo kamu kurang bngt yank, buruan narik Ojol atau kerja dulu!");
      return;
    }

    // Resolve the message card
    setMessages((prev) => 
      prev.map((m) => (m.id === msgId ? { ...m, isResolved: true } : m))
    );

    // Create user visual payment confirmation
    const paymentMsgId = `user-pay-${Date.now()}`;
    const paymentMsg: Message = {
      id: paymentMsgId,
      sender: "user",
      text: `💸 Mentransfer Rp ${amount.toLocaleString("id-ID")} jajan pacar`,
      timestamp: getCurrentTime(),
      isMoneyTransfer: true,
      transferAmount: amount
    };

    // Update state parameters
    setState((prev) => ({
      ...prev,
      playerBalance: prev.playerBalance - amount,
      gfBalance: prev.gfBalance + amount,
      relationshipScore: Math.min(100, prev.relationshipScore + 10) // additional direct reward
    }));

    const updatedMessages = [...messages, paymentMsg];
    setMessages(updatedMessages);

    // Send context to AI with amount paid
    triggerAiResponse(updatedMessages, amount);
  };

  // Handler to buy gifts from the quick-gifting sidebar shop
  const handleGiftPurchase = (giftName: string, cost: number, relationshipBoost: number) => {
    if (state.playerBalance < cost) {
      alert("Saldo kamu tidak mencukupi untuk membelikan hadiah jajan ini!");
      return;
    }

    // Create client transfer logs
    const giftUserMsgId = `user-gift-${Date.now()}`;
    const giftMsg: Message = {
      id: giftUserMsgId,
      sender: "user",
      text: `🎁 Mengirim Kado Hadiah: *${giftName}* senilai ${formatRupiah(cost)}`,
      timestamp: getCurrentTime()
    };

    // Update balances & mood
    setState((prev) => ({
      ...prev,
      playerBalance: prev.playerBalance - cost,
      gfBalance: prev.gfBalance + cost,
      relationshipScore: Math.min(100, prev.relationshipScore + relationshipBoost)
    }));

    const updatedMessages = [...messages, giftMsg];
    setMessages(updatedMessages);

    // Trigger AI grateful feedback specifically geared towards this gift
    triggerAiResponse(updatedMessages, cost);
  };

  // Earning side incomes (from Side Jobs panel)
  const handleEarnIncome = (amount: number) => {
    setState((prev) => ({
      ...prev,
      playerBalance: prev.playerBalance + amount
    }));
  };

  // Handle virtual calls simulation feedback
  const handleTriggerCall = (isVideo: boolean) => {
    const gfName = state.girlfriendName;
    let callMessage = "";

    if (state.persona === "karin") {
      callMessage = isVideo 
        ? `${gfName} menolak Video Call: "Paan sih, muka gua lagi kusem belum mandi! Ga usah sok imut vc gua! 😡"`
        : `${gfName} mereject Panggilan Suara: "Lagi mager ngomong, berisik banget lo. Chat aja buruan!"`;
    } else if (state.persona === "adel") {
      callMessage = isVideo
        ? `${gfName} menolak Video Call: "Ihhh bbyyy jangannn! Rambut aku acak-acakan belum dikeramasin, maluuu! 😭 Chat aja yank mwah"`
        : `${gfName} sibuk: "Lagi asik dengerin lagu nih, nanti aja sih telponannya. Chat aja!"`;
    } else {
      callMessage = isVideo
        ? `${gfName} menolak VC: "Aduh maaf yaa sayang.. aku lagi pakai daster/masker nih, sungkan hehee. Besok-besok aja ya telponannya 😊"`
        : `${gfName} tidak dapat menjawab: "Maaf ya sayang lagi beberes rumah nih, ketik chat dulu aja yaa."`;
    }

    setActiveCallMessage(callMessage);
  };

  // Fresh-start onboarding selector
  const handlePersonaSelected = (personaKey: any, customGfName: string) => {
    setState({
      ...DEFAULT_STATE,
      persona: personaKey,
      girlfriendName: customGfName,
      playerBalance: 400000,
      hasStarted: true
    });
    setMessages([]);
    setErrorMessage(null);
  };

  // Game restart reset
  const handleResetGame = () => {
    if (window.confirm("Apakah kamu yakin ingin memutuskan pacarmu dan mengulang simulasi dari awal?")) {
      setState(DEFAULT_STATE);
      setMessages([]);
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#efe7de] text-slate-800 flex flex-col font-sans">
      
      {/* Top Navigation Frame */}
      <header className="bg-[#075e54] text-white py-3 px-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-[#128c7e] text-white p-1.5 rounded-lg border border-[#054d44]">
            <MessageSquare className="w-5 h-5 text-emerald-300 fill-emerald-300/20" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">WhatsApp Pacar Simulator</h1>
            <p className="text-[10px] text-green-200 font-mono">React v18 + Gemini AI (Server-Side)</p>
          </div>
        </div>

        {state.hasStarted && (
          <div className="flex items-center gap-2">
            {/* Desktop Dashboard controls */}
            <div className="hidden md:flex items-center gap-3 text-xs bg-[#128c7e] px-4 py-1.5 rounded-full border border-[#054d44] text-white">
              <span className="flex items-center gap-1 font-mono text-yellow-300 font-bold">
                💳 Dompet: {formatRupiah(state.playerBalance)}
              </span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1 font-mono text-pink-300 font-bold">
                💖 Hubungan: {state.relationshipScore}%
              </span>
            </div>

            <button
              onClick={handleResetGame}
              className="text-xs bg-[#128c7e] text-white hover:bg-[#159e8f] transition px-3 py-1.5 rounded-full border border-[#054d44] font-medium cursor-pointer"
            >
              Mulai Ulang
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col justify-center">
        
        {/* Onboarding View */}
        {!state.hasStarted ? (
          <GfSelector onSelect={handlePersonaSelected} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full max-h-[85vh]">
            
            {/* Mobile Navigation Tabs (Only visible on medium/small viewports) */}
            <div className="lg:hidden col-span-1 grid grid-cols-3 bg-white/95 rounded-2xl p-1.5 border border-slate-200 sticky top-[60px] z-30 shadow-md">
              <button
                onClick={() => setMobileTab("chat")}
                className={`py-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all ${
                  mobileTab === "chat" 
                    ? "bg-[#075e54]/10 text-[#075e54] shadow-sm font-semibold" 
                    : "text-slate-500"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Pacar
              </button>
              <button
                onClick={() => setMobileTab("jobs")}
                className={`py-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all ${
                  mobileTab === "jobs" 
                    ? "bg-[#075e54]/10 text-[#075e54] shadow-sm font-semibold" 
                    : "text-slate-500"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Kerja ({formatRupiah(state.playerBalance)})
              </button>
              <button
                onClick={() => setMobileTab("status")}
                className={`py-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all ${
                  mobileTab === "status" 
                    ? "bg-[#075e54]/10 text-[#075e54] shadow-sm font-semibold" 
                    : "text-slate-500"
                }`}
              >
                <Heart className="w-4 h-4" />
                Status Pacar ({state.relationshipScore}%)
              </button>
            </div>

            {/* Left Side: WhatsApp Simulator Frame (6 Cols) */}
            <div className={`col-span-1 lg:col-span-7 flex flex-col ${mobileTab === "chat" ? "flex" : "hidden lg:flex"}`}>
              
              <div 
                id="whatsapp-smartphone-mock" 
                className="w-full bg-[#f4f1eb] border border-slate-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[70vh] lg:h-[75vh]"
              >
                {/* WA Header */}
                <div className="bg-[#075e54] px-3.5 py-2.5 flex items-center justify-between border-b border-black/10 text-white shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button className="lg:hidden p-0.5 text-green-200 mr-0.5 hover:text-white" onClick={() => setMobileTab("status")}>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="relative shrink-0">
                      <img
                        src={PERSONAS[state.persona].avatar}
                        alt={state.girlfriendName}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#075e54] rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate leading-normal">
                        {state.girlfriendName}
                      </h4>
                      <span className="text-[10px] text-green-200 block tracking-wide font-medium">
                        {isTyping ? "Sedang mengetik..." : "Online"}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Action Call Bar */}
                  <div className="flex items-center gap-3 text-white/90">
                    <button
                      onClick={() => handleTriggerCall(false)}
                      disabled={state.isBlocked}
                      className="p-1.5 hover:bg-black/10 rounded-full active:scale-95 transition cursor-pointer disabled:opacity-40"
                    >
                      <Phone className="w-[18px] h-[18px]" />
                    </button>
                    <button
                      onClick={() => handleTriggerCall(true)}
                      disabled={state.isBlocked}
                      className="p-1.5 hover:bg-black/10 rounded-full active:scale-95 transition cursor-pointer disabled:opacity-40"
                    >
                      <Video className="w-[18px] h-[18px]" />
                    </button>
                    <button className="p-1.5 hover:bg-black/10 rounded-full active:scale-95 transition cursor-pointer">
                      <MoreVertical className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>

                {/* API Key warning banners */}
                {errorMessage === "GEMINI_KEY_MISSING" && (
                  <div className="bg-rose-900 border-b border-rose-805 text-white p-3 text-xs flex gap-2 items-start justify-between">
                    <div className="flex gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                      <p>
                        <strong>Kunci API Belum Dikonfigurasi!</strong> Masukkan kunci api <code>GEMINI_API_KEY</code> di dalam menu <strong>Settings &gt; Secrets</strong> di AI Studio agar pacarmu merespon chat!
                      </p>
                    </div>
                  </div>
                )}

                {/* Game specific state banners */}
                {state.isBlocked && (
                  <div className="bg-rose-600 text-white font-semibold text-center p-2 text-xs uppercase tracking-wider font-mono shadow-md">
                    🚫 KONTAK DI-BLOKIR & pacaran putus! (Game Over)
                  </div>
                )}

                {/* Call simulator popup overlay */}
                <AnimatePresence>
                  {activeCallMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-slate-200 m-3 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-xl relative z-20 text-xs"
                    >
                      <Phone className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                      <p className="text-slate-700 pr-6 leading-relaxed">
                        {activeCallMessage}
                      </p>
                      <button
                        onClick={() => setActiveCallMessage(null)}
                        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat space view */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-3.5"
                  style={{
                    backgroundColor: "#efe7de",
                    backgroundImage: "radial-gradient(ellipse at center, rgba(37,211,102,0.04) 0%, rgba(0,0,0,0) 80%)"
                  }}
                >
                  <div className="max-w-xs mx-auto bg-slate-200/80 border border-slate-300 p-2 rounded-xl text-center text-[10px] text-slate-600 tracking-wide font-medium leading-normal mb-2 shadow-sm">
                    🔒 Chat ini dienkripsi secara end-to-end dengan kepribadian pacar virtual pilihan Anda.
                  </div>

                  {messages.map((msg) => {
                    const isGf = msg.sender === "gf";
                    const isSystem = msg.sender === "system";

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center">
                          <span className="inline-block bg-slate-200 border border-slate-300 text-[10px] text-slate-600 font-medium px-2.5 py-1 rounded-lg">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isGf ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl p-3 shadow-sm relative group ${
                            isGf
                              ? "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                              : "bg-[#dcf8c6] text-slate-850 rounded-tr-none border border-[#c1ebb0]"
                          }`}
                        >
                          {/* Money request dialog inside chat */}
                          {msg.isMoneyRequest && (
                            <div className="mb-2 bg-yellow-50/75 p-2.5 rounded-xl border border-yellow-300/50 text-xs">
                              <span className="font-bold text-amber-700 block mb-1">💸 Request Jajan Pacar</span>
                              <p className="text-[11px] text-slate-700 leading-normal mb-2">Kamu diminta mengirim {formatRupiah(msg.requestAmount || 0)}</p>
                              <button
                                onClick={() => handlePayRequest(msg.id, msg.requestAmount || 0)}
                                disabled={msg.isResolved || state.playerBalance < (msg.requestAmount || 0)}
                                className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                  msg.isResolved 
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                    : "bg-[#075e54] hover:bg-[#128c7e] text-white shadow-sm"
                                }`}
                              >
                                {msg.isResolved ? "✓ Berhasil Ditransfer" : `Transfer Sekarang`}
                              </button>
                            </div>
                          )}

                          {/* Regular message content */}
                          <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed pr-8">
                            {msg.text}
                          </p>

                          {/* Message meta clock info */}
                          <div className="absolute bottom-1 right-2.5 flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-mono scale-[0.9]">
                              {msg.timestamp}
                            </span>
                            {!isGf && (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-500 scale-[0.8]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Realtime typing feedback bubble */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-md flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#075e54] rounded-full animate-bounce delay-0" />
                        <span className="w-1.5 h-1.5 bg-[#075e54] rounded-full animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 bg-[#075e54] rounded-full animate-bounce delay-300" />
                      </div>
                    </div>
                  )}

                  {/* Generic Lag error alert */}
                  {errorMessage && errorMessage !== "GEMINI_KEY_MISSING" && (
                    <div className="bg-[#fee2e2] text-rose-800 p-2.5 rounded-xl border border-rose-200 text-xs text-center font-mono font-medium">
                      ⚠️ Error: {errorMessage}
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Bottom WhatsApp bar */}
                <form 
                  onSubmit={handleSendMessage} 
                  className="bg-[#f0f0f0] p-3 flex items-center gap-3 border-t border-slate-200 shrink-0"
                >
                  <div className="flex items-center gap-1.5 bg-white rounded-full px-4 py-2 flex-grow min-w-0 border border-slate-300 shadow-inner">
                    <button
                      type="button"
                      disabled={state.isBlocked}
                      onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
                      className="text-slate-500 hover:text-slate-700 transition p-1 cursor-pointer disabled:opacity-40"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={state.isBlocked ? "Kontak telah diblokir..." : "Ketik pesan..."}
                      disabled={state.isBlocked}
                      className="flex-grow bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-400 px-1 leading-none"
                    />

                    {/* Money action buttons inside WhatsApp bar */}
                    <button
                      type="button"
                      disabled={state.isBlocked}
                      onClick={() => setIsTransferOpen(true)}
                      className="text-[#075e54] hover:text-[#128c7e] transition p-1 hover:bg-slate-100 rounded-full cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1"
                      title="Kirim Uang (Beri Jajan)"
                    >
                      <Wallet className="w-[18px] h-[18px]" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || state.isBlocked}
                    className="bg-[#075e54] hover:bg-[#128c7e] text-white p-3 rounded-full cursor-pointer active:scale-95 transition shrink-0 flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 fill-current text-white ml-0.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side Dashboard: Career side jobs + stats indicators (5 Cols) */}
            <div className={`col-span-1 lg:col-span-5 flex flex-col gap-6 overflow-y-auto max-h-[85vh] pr-1 pb-4 ${
              mobileTab === "jobs" ? "flex" : mobileTab === "status" ? "hidden" : "hidden lg:flex"
            }`}>
              <JobPanel playerBalance={state.playerBalance} onEarn={handleEarnIncome} />
            </div>

            <div className={`col-span-1 lg:col-span-5 flex flex-col gap-6 overflow-y-auto max-h-[85vh] pr-1 pb-4 ${
              mobileTab === "status" ? "flex" : "hidden lg:flex"
            }`}>
              <StatsPanel 
                gameState={state} 
                onGift={handleGiftPurchase} 
                onReset={handleResetGame} 
              />
            </div>

          </div>
        )}

      </main>

      {/* Transfer Dialogue Money modal layer */}
      <AnimatePresence>
        {isTransferOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#075e54]">
                  <Wallet className="w-5 h-5" />
                  <h3 className="font-bold text-slate-900 text-base">Kirim Uang Jajan Pacar</h3>
                </div>
                <button 
                  onClick={() => setIsTransferOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-5">
                <div className="bg-[#075e54]/5 border border-[#075e54]/10 p-3 rounded-2xl flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Saldo Dompet Kamu :</span>
                  <span className="font-bold text-[#075e54]">{formatRupiah(state.playerBalance)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Masukkan Nominal (IDR Rupiah)
                  </label>
                  <input
                    type="number"
                    value={customTransferVal}
                    onChange={(e) => setCustomTransferVal(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full bg-slate-55 border border-slate-300 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-[#075e54] focus:outline-none focus:border-[#075e54] focus:ring-1 focus:ring-[#075e54]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Semakin besar uang jajan jaminan marahnya makin cepet reda!</span>
                </div>

                {/* Instant select denominations keys */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[25000, 50000, 150000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setCustomTransferVal(String(val))}
                      className="border border-slate-200 hover:border-[#075e54] bg-slate-50 hover:bg-[#075e54]/5 text-xs py-1.5 px-1 rounded-lg font-mono text-slate-700 active:scale-95 transition"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 py-2.5 px-4 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleTransferCustomMoney}
                  disabled={!customTransferVal || parseFloat(customTransferVal) <= 0}
                  className="w-full bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-[#075e54]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Konfirmasi Kirim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fake stickers/attachment Drawer */}
      <AnimatePresence>
        {isAttachmentOpen && (
          <div className="fixed inset-0 bg-transparent z-40" onClick={() => setIsAttachmentOpen(false)}>
            <div className="absolute bottom-16 left-6 inline-flex flex-col bg-white border border-slate-200 rounded-3xl p-4 shadow-2xl text-xs gap-3 w-48 text-slate-700">
              <span className="font-bold text-[10px] uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">Kirim Berkas (Aesthetic)</span>
              <button 
                onClick={() => { setIsAttachmentOpen(false); alert("Nge-pap ditolak pacar: 'Fokus dengerin aku dulu yank!'"); }}
                className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg text-left"
              >
                <span>🖼️</span> Kirim PAP (Foto)
              </button>
              <button 
                onClick={() => { setIsAttachmentOpen(false); alert("Bagi lokasi dinonaktifkan: 'Aku tau kok kamu dimana, ga usah bohong' (Adel vibes)"); }}
                className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg text-left"
              >
                <span>📍</span> Share Live Location
              </button>
              <button 
                onClick={() => { setIsAttachmentOpen(false); alert("Stiker mleyot terkirim!"); }}
                className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg text-left"
              >
                <span>🤡</span> Kirim Stiker Meme
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
