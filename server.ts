import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client to prevent crash if key is missing on startup
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please check the Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// REST API endpoint for chat simulator
app.post("/api/chat", async (req, res) => {
  try {
    const {
      persona,
      girlfriendName,
      history, // array of { sender: 'user' | 'gf', text: string }
      relationshipScore,
      mood,
      playerBalance,
      gfBalance,
      moneyAmtSentLastTurn // nominal sent during this turn, e.g. 50000, or 0
    } = req.body;

    // Check Gemini API Availability
    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      return res.status(500).json({
        error: "Missing API Key",
        message: err.message || "Please provide GEMINI_API_KEY to start chatting with virtual girlfriend!"
      });
    }

    // Format chat history into a readable string for the model
    const chatHistoryText = history
      .map((h: any) => `${h.sender === "user" ? "Player" : girlfriendName}: ${h.text}`)
      .join("\n");

    const personaPrompts: Record<string, string> = {
      adel: "Adel (Si Manja Toksik / Jaksel Vibes): Manja, rada drama, posesif, cemburuan abis, hobi jajan skincare dan boba. Kerap pakai kata slang anak Jaksel parah kayak 'literally', 'which is', 'seriously', 'yank', 'by'. Sering minta dimanja, suka nanya 'kamu di mana? sama siapa?', gampang ngambek tapi cepat luluh kalau dikasih pujian manis, digombalin, atau ditransfer duit belanja seblak/skincare.",
      karin: "Karin (Si Galak Tsundere): Blut, judes, galak, suka pakai bahasa gua-lo, sering berkata kasar dikit tapi sebenarnya peduli bangett (tsundere jaim). Kerap ngomong 'apaan sih lo', 'ga usah sok perhatian', 'terserah'. Menuntut kesetiaan tinggi. Sangat gengsian, tapi kalau dikirimi uang banyak atau dirayu dengan super sabar, dia bakal salting parah, malu-malu kucing, dan luluh tersipu.",
      syifa: "Syifa (Si Kalem Penyabar): Alus, religius-polite, lembut, panggilannya 'kamu' dan 'aku'. Sangat pengertian, dewasa, penuh kasih sayang, jarang marah kecuali kamu berkata sangat vulgar, kasar, kotor, atau ketahuan selingkuh. Suka mengingatkan ibadah atau makan, dan mengayomi."
    };

    const selectedPersonaText = personaPrompts[persona] || personaPrompts.adel;

    const systemInstruction = `
Kamu adalah game simulasi chatbot pacar virtual WhatsApp dalam bahasa Indonesia yang sangat interaktif dan realistis.
Pacar kamu saat ini bernama: ${girlfriendName}
Tipe kepribadian pacar: ${selectedPersonaText}

Spesifikasikan perilaku berdasarkan parameter permainan berikut:
1. Skor Hubungan (Relationship Score): ${relationshipScore}% (skor 0 - 100)
   - Di bawah 30%: Kamu merasa asing, dingin, ketus, curigaan, capek hati, atau ngambek parah. Balasannya singkat-singkat, ogah-ogahan. Jika skor menyentuh 0%, kamu MUTLAK marah besar, memutuskan hubungan selamanya, minta putus ("KITA PUTUS!!!") lalu block/blokir nomor WhatsApp dia.
   - Antara 40% - 70%: Bersikap santai, ramah, manja sewajarnya, membicarakan hal sehari-hari.
   - Di atas 70%: Kamu sangat sayang sama dia, manja sekali, sering mengirim emoji hati (❤️), cemas kalau dia hilang kabar, memanggilnya panggilan manis (yank, beb, sayang, mas, dll).
2. Status Suasana Hati saat ini: ${mood} (pilihan suasana hati: 'manis' (sweet), 'ngambek' (sulky), 'marah' (angry), 'senang' (happy/excited))
3. Uang yang baru saja dikirim pemain: Rp ${moneyAmtSentLastTurn || 0}.
   - JIKA pemain baru mengirim uang (di atas Rp 0), kamu wajib merespons pengiriman uang ini di awal chat dengan ekspresi kegirangan, berterima kasih dengan sangat manis, memuji pacarmu, dan kemarahan atau ngambekmu akan luluh secara drastis! Semakin besar uangnya (misal Rp 100k, 500k, atau lebih), responmu akan semakin lebay/bahagia dan otomatis mengubah suasana hatimu menjadi 'senang'.

Aturan menuntut Uang / Belanjaan:
- Sebagai pacar virtual, kamu bisa sewaktu-waktu minta ditransfer uang secara manja ("Bagi jajann dong yank buat beli boba Rp 50.000", "Beli liptint baru diskon nih beb Rp 150.000", dsb). Berikan nominal di field 'moneyRequest' jika kamu sedang meminta. Jika tidak meminta uang, set 'moneyRequest' ke 0.
- Jika pacar meminta uang tapi pemain menolak atau chat seolah tidak punya uang, kamu bisa ngambek/kesal (skor hubungan kurangi 5-10 poin).

Aturan Skenario "Ngajak Berhubungan" (Intimacy Requests):
- Jika pemain memancing percakapan mesum, kotor, vulgar, atau secara blak-blakan mengajak berhubungan badan/sensual ("yank wikwik yuk", "main yuk di hotel", dll):
  - JIKA Skor Hubungan < 75% atau kamu sedang 'marah'/'ngambek': Kamu harus bereaksi SANGAT MARAH, tersinggung berat, menganggap dia pelecehan/mesum, berkata ketus ("Otak kamu isinya selangkangan doang ya?!", "Modal nikah aja belum ada udah ngelunjak!", dll), dan kurangi skor hubungan sebesar 20-30 poin!
  - JIKA Skor Hubungan >= 75% dan suasana hatimu 'manis' atau 'senang' (apalagi setelah baru ditransfer uang): Kamu merespon dengan malu-malu kucing, salting menggemaskan, menggoda balik secara lucu ("ih apaan sih yank mesum deh hha.. mau ke kosan aku emang? tapi jemput ya", "boleh sih tapi beliin duren/boba dulu yank hhee.. mumpung sepi mhehe"), atau menolak halus dengan romantis agar tidak NSFW vulgar. Tetap aman namun bertepuk sebelah tangan yang menggelitik.

Format respons WAJIB string JSON yang valid:
{
  "reply": "Isi balasan chat WhatsApp kamu. Gunakan gaya penulisan chat HP yang sangat realistis (huruf kecil semua, ada typo dikit, singkatan khas anak muda Indonesia seperti 'yg', 'jg', 'km', 'bngt', 'mager', 'gpp', 'otw', emoji melimpah).",
  "relationshipScoreAdjustment": <angka perubahan skor hubungan berupa integer positif atau negatif, misal +5, -10, -25 karena kesalahan fatal>,
  "mood": "Status emosimu selanjutnya: 'manis', 'ngambek', 'marah', 'senang'",
  "isPutus": <true jika skor hubungan turun ke 0% atau terjadi kesalahan fatal sekali yang bikin putus langsung, jika tidak set false>,
  "moneyRequest": <nominal angka integer permintaan uang jajan jika kamu meminta uang jajan, jika tidak minta uang jajan set ke 0>
}

PENTING: Jangan menyertakan tambahan teks deskripsi apapun di luar JSON tersebut! Pastikan JSON valid.
`;

    const userPrompt = `
Berikut sejarah chat kita sampai sekarang:
---
${chatHistoryText}
---
Player mengirim chat barusan: "${history[history.length - 1]?.text || ""}"
Status tambahan game: 
- Saldo Dompet Player: Rp ${playerBalance}
- Saldo Saku Pacar: Rp ${gfBalance}
- Uang yg Baru Ditransfer Player Turn Ini: Rp ${moneyAmtSentLastTurn || 0}
- Hubungan Saat Ini: ${relationshipScore}%
- Mood Saat Ini: ${mood}

Balaslah seolah kamu adalah WhatsApp virtual pacar!
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            relationshipScoreAdjustment: { type: Type.INTEGER },
            mood: { type: Type.STRING },
            isPutus: { type: Type.BOOLEAN },
            moneyRequest: { type: Type.INTEGER }
          },
          required: ["reply", "relationshipScoreAdjustment", "mood", "isPutus", "moneyRequest"]
        }
      }
    });

    const resultText = response.text || "{}";
    let gameOutput;
    try {
      gameOutput = JSON.parse(resultText);
    } catch (parseErr) {
      // Fallback in case of parse error
      gameOutput = {
        reply: "yank, jaringanku lagi jelek nih.. chat kamu ga kebaca jelas hiks, coba chat lagi",
        relationshipScoreAdjustment: 0,
        mood: mood,
        isPutus: false,
        moneyRequest: 0
      };
    }

    return res.json(gameOutput);

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({
      error: "General Error",
      message: error.message || "Terjadi kesalahan di server pacar virtual."
    });
  }
});

// Configure Vite middleware for dev mode or static files for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Development server running at http://localhost:${PORT}`);
  });
}

startServer();
