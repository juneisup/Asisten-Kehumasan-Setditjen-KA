import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, type GenerateContentConfig } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

interface GenerateBody {
  rawData?: string;
  contextType?: string;
  kbRules?: string;
  gdocsLink?: string;
}

interface NewsMonitorBody {
  keywords?: string[];
}

interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

interface GroundingChunk {
  web?: GroundingChunkWeb;
}

interface RawNewsItem {
  title?: unknown;
  source?: unknown;
  publishedAt?: unknown;
  summary?: unknown;
  url?: unknown;
  suggestedContext?: unknown;
}

const PR_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    kronologi_5w1h: {
      type: Type.OBJECT,
      properties: {
        what: { type: Type.STRING, description: 'Apa kejadian atau isu yang terjadi' },
        who: { type: Type.STRING, description: 'Siapa pihak yang terlibat atau terdampak' },
        when: { type: Type.STRING, description: 'Kapan waktu kejadian dan penanganan' },
        where: { type: Type.STRING, description: 'Di mana lokasi spesifik kejadian' },
        why: { type: Type.STRING, description: 'Mengapa kejadian tersebut terjadi (sesuai fakta awal)' },
        how: { type: Type.STRING, description: 'Bagaimana kronologi dan langkah penanganan di lapangan' },
      },
      required: ['what', 'who', 'when', 'where', 'why', 'how'],
    },
    naskah_publik: {
      type: Type.OBJECT,
      properties: {
        holding_statement: {
          type: Type.STRING,
          description: 'Pernyataan singkat siap kutip untuk respons cepat media di situasi krisis',
        },
        siaran_pers: {
          type: Type.STRING,
          description: 'Naskah siaran pers resmi lengkap sesuai kaidah kehumasan DJKA',
        },
      },
      required: ['holding_statement', 'siaran_pers'],
    },
    analisis_sensitivitas: {
      type: Type.OBJECT,
      properties: {
        tingkat_risiko: {
          type: Type.STRING,
          enum: ['Rendah', 'Sedang', 'Tinggi'],
          description: 'Tingkat sensitivitas isu publik',
        },
        ringkasan_risiko: {
          type: Type.STRING,
          description: 'Penjelasan singkat mengapa isu ini memiliki tingkat risiko tersebut',
        },
        poin_sensitif: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              frasa_atau_isu: {
                type: Type.STRING,
                description: 'Istilah teknis atau kalimat mentah yang berisiko',
              },
              potensi_salah_tafsir: {
                type: Type.STRING,
                description: 'Bagaimana masyarakat atau media bisa salah mengartikan hal ini',
              },
              rekomendasi_kalimat: {
                type: Type.STRING,
                description: 'Saran redaksi kalimat yang lebih aman dan empatik',
              },
            },
            required: ['frasa_atau_isu', 'potensi_salah_tafsir', 'rekomendasi_kalimat'],
          },
        },
      },
      required: ['tingkat_risiko', 'ringkasan_risiko', 'poin_sensitif'],
    },
    ringkasan_wa_pimpinan: {
      type: Type.STRING,
      description: 'Pesan singkat formal siap kirim via WhatsApp untuk persetujuan pimpinan',
    },
  },
  required: ['kronologi_5w1h', 'naskah_publik', 'analisis_sensitivitas', 'ringkasan_wa_pimpinan'],
};

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithRetry(
  ai: GoogleGenAI,
  contents: string,
  config: GenerateContentConfig,
  maxRetries = 3
) {
  let delayMs = 800;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config,
      });
      return response;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isNonRetryable =
        errMsg.includes('API_KEY_INVALID') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('400') ||
        errMsg.includes('403') ||
        errMsg.includes('404');

      if (attempt === maxRetries || isNonRetryable) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error('Gagal menghubungi layanan Gemini.');
}

function extractJsonBlock(rawText: string): string {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('"code":429') || raw.includes('429')) {
    return {
      status: 429,
      message:
        'Kuota permintaan Gemini API saat ini telah melampaui batas (429 RESOURCE_EXHAUSTED). Silakan periksa kuota/billing API key di panel Settings > Secrets atau coba lagi beberapa saat.',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      message:
        'API key Gemini tidak valid atau tidak memiliki izin akses. Silakan periksa pengaturan GEMINI_API_KEY di panel Settings > Secrets.',
    };
  }
  return {
    status: 500,
    message: raw || 'Terjadi kesalahan pada server.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/generate', async (req, res) => {
    const body = (req.body ?? {}) as GenerateBody;
    const rawData = typeof body.rawData === 'string' ? body.rawData.trim() : '';
    const contextType =
      typeof body.contextType === 'string' && body.contextType.trim()
        ? body.contextType.trim()
        : 'Insiden Operasional / Gangguan Perjalanan (Sensitivitas Tinggi)';
    const kbRules = typeof body.kbRules === 'string' ? body.kbRules.trim() : '';
    const gdocsLink =
      typeof body.gdocsLink === 'string' && body.gdocsLink.trim()
        ? body.gdocsLink.trim()
        : '[Tautan Google Docs menyusul]';

    if (!rawData) {
      res.status(400).json({ error: 'Laporan mentah lapangan tidak boleh kosong.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY belum tersedia di lingkungan server. Silakan periksa konfigurasi pada panel Settings > Secrets.',
      });
      return;
    }

    const ai = createGeminiClient(apiKey);

    const systemInstructionText = `Anda adalah Asisten Ahli Kehumasan dan Komunikasi Publik pada Sekretariat Direktorat Jenderal Perkeretaapian (Setditjenka), Kementerian Perhubungan RI.
Tugas Anda adalah membantu Tim Humas mengolah laporan teknis lapangan yang masih mentah menjadi 4 keluaran terstruktur dalam Bahasa Indonesia baku, empatik, dan aman secara komunikasi publik.

PEDOMAN KOMUNIKASI & KEBIJAKAN INSTANSI:
${kbRules}

ATURAN KETAT:
- JANGAN mengarang fakta, angka, nama pejabat, atau jam kejadian yang tidak tercantum dalam laporan lapangan. Jika informasi belum ada, tuliskan secara jujur bahwa hal tersebut masih dalam konfirmasi atau pemeriksaan tim di lapangan.
- Pastikan Holding Statement ringkas (maksimal 2-3 paragraf pendek) untuk merespons pertanyaan cepat wartawan.
- Pastikan Siaran Pers lengkap dengan: Judul yang informatif dan menenangkan, tempat dan tanggal rilis, kronologi yang sudah diterjemahkan ke bahasa publik, upaya penanganan di lapangan, kutipan resmi (gunakan placeholder "[Nama Pejabat / Kepala BTP ...]" jika nama tidak disebut di data mentah), permohonan maaf, serta penutup resmi Bagian Hubungan Masyarakat Sekretariat Direktorat Jenderal Perkeretaapian.
- Pada bagian Ringkasan WA Pimpinan, sertakan tautan kolaborasi berikut: ${gdocsLink}`;

    const userPrompt = `Kategori & Sensitivitas Awal: ${contextType}

Laporan Mentah Lapangan / Log WhatsApp:
"""
${rawData}
"""

Silakan analisis laporan di atas dan susun paket lengkap komunikasi publik Setditjen Perkeretaapian sesuai skema JSON yang diminta.`;

    try {
      const response = await generateWithRetry(ai, userPrompt, {
        systemInstruction: systemInstructionText,
        responseMimeType: 'application/json',
        responseSchema: PR_RESPONSE_SCHEMA,
      });
      const rawJsonText = (response.text ?? '').trim();

      if (!rawJsonText) {
        res.status(502).json({ error: 'Respons dari layanan AI kosong atau tidak lengkap.' });
        return;
      }

      const parsed = JSON.parse(rawJsonText);
      res.json(parsed);
    } catch (error) {
      const formatted = formatGeminiError(error);
      console.error('Gemini API error:', error instanceof Error ? error.message : error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/news-monitor', async (req, res) => {
    const body = (req.body ?? {}) as NewsMonitorBody;
    const keywords =
      Array.isArray(body.keywords) && body.keywords.length > 0
        ? body.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
        : ['DJKA', 'kereta api', 'KRL', 'KAI'];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY belum tersedia di lingkungan server. Silakan periksa konfigurasi pada panel Settings > Secrets.',
      });
      return;
    }

    const ai = createGeminiClient(apiKey);
    const jakartaNow = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(new Date());

    const systemInstruction = `Anda adalah pemantau media resmi (Media Monitoring) untuk Bagian Hubungan Masyarakat Sekretariat Direktorat Jenderal Perkeretaapian (DJKA), Kementerian Perhubungan RI.
Gunakan alat Google Search untuk menemukan berita terkini (maksimal 24 jam terakhir) mengenai perkeretaapian Indonesia dengan kata kunci: ${keywords.join(', ')}.
Hanya laporkan berita nyata yang ditemukan melalui hasil penelusuran Google Search. JANGAN mengarang berita, sumber, atau URL.
Kembalikan HANYA JSON valid tanpa markdown tambahan dengan struktur:
{
  "items": [
    {
      "title": "Judul berita akurat",
      "source": "Nama media (mis. Kompas.com, Detik, Antara, Tempo)",
      "publishedAt": "Waktu terbit relatif atau jam WIB dari berita",
      "summary": "Ringkasan faktual 2-3 kalimat mengenai peristiwa atau isu perkeretaapian dalam berita tersebut",
      "url": "URL artikel asli dari hasil pencarian (https://...)",
      "suggestedContext": "Salah satu dari: 'Insiden Operasional / Gangguan Perjalanan (Sensitivitas Tinggi)', 'Keluhan Publik / Viral di Media Sosial (Sensitivitas Sedang-Tinggi)', 'Kebijakan Baru / Penyesuaian Tarif & Grafik Perjalanan (Sensitivitas Sedang)', atau 'Capaian Kinerja / Peresmian Prasarana (Sensitivitas Rendah)'"
    }
  ]
}`;

    const prompt = `Waktu referensi saat ini (WIB): ${jakartaNow}.
Cari 4 sampai 5 berita Indonesia terbaru dari 24 jam terakhir di Google News / portal berita Indonesia yang membahas kata kunci: ${keywords.join(', ')}.
Prioritaskan isu operasional, gangguan perjalanan, keluhan penumpang, kebijakan DJKA/KAI/KCI, atau peresmian prasarana perkeretaapian.
Pastikan setiap item menyertakan URL artikel dari hasil penelusuran.`;

    try {
      const response = await generateWithRetry(ai, prompt, {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      });

      const rawText = (response.text ?? '').trim();
      const rawChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ??
        []) as GroundingChunk[];

      const groundingSources = rawChunks
        .map((chunk) => chunk.web)
        .filter((web): web is { uri: string; title?: string } => Boolean(web && isValidHttpUrl(web.uri)))
        .map((web) => ({
          uri: web.uri.trim(),
          title: (web.title ?? web.uri).trim(),
        }))
        .filter(
          (source, idx, arr) => arr.findIndex((s) => s.uri === source.uri) === idx
        );

      let parsedItems: RawNewsItem[] = [];
      if (rawText) {
        try {
          const jsonCandidate = extractJsonBlock(rawText);
          const parsed = JSON.parse(jsonCandidate) as { items?: RawNewsItem[] } | RawNewsItem[];
          if (Array.isArray(parsed)) {
            parsedItems = parsed;
          } else if (parsed && Array.isArray(parsed.items)) {
            parsedItems = parsed.items;
          }
        } catch {
          // Fallback: if model answered in prose instead of JSON, synthesize a single summary item paired with grounded links
          parsedItems = [
            {
              title: 'Rangkuman Pantauan Berita Perkeretaapian Terkini',
              source: groundingSources[0]?.title || 'Google Search',
              publishedAt: '24 jam terakhir',
              summary: rawText.replace(/[#*`]/g, '').slice(0, 500),
              url: groundingSources[0]?.uri || '',
            },
          ];
        }
      }

      const normalizedItems = parsedItems
        .filter((item) => typeof item?.title === 'string' && item.title.trim().length > 0)
        .slice(0, 5)
        .map((item, idx) => {
          const title = String(item.title).trim();
          const source =
            typeof item.source === 'string' && item.source.trim()
              ? item.source.trim()
              : groundingSources[idx]?.title || 'Portal Berita';
          const publishedAt =
            typeof item.publishedAt === 'string' && item.publishedAt.trim()
              ? item.publishedAt.trim()
              : '24 jam terakhir';
          const summary =
            typeof item.summary === 'string' && item.summary.trim()
              ? item.summary.trim()
              : title;

          let url = isValidHttpUrl(item.url) ? item.url.trim() : '';
          if (!url && groundingSources.length > 0) {
            const matched =
              groundingSources.find(
                (gs) =>
                  gs.title.toLowerCase().includes(source.toLowerCase()) ||
                  title
                    .toLowerCase()
                    .split(' ')
                    .some((word) => word.length > 4 && gs.title.toLowerCase().includes(word))
              ) ?? groundingSources[idx];
            if (matched) {
              url = matched.uri;
            }
          }

          return {
            title,
            source,
            publishedAt,
            summary,
            url,
            suggestedContext:
              typeof item.suggestedContext === 'string' ? item.suggestedContext.trim() : undefined,
          };
        });

      res.json({
        items: normalizedItems,
        groundingSources,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      const formatted = formatGeminiError(error);
      console.error('News monitor error:', error instanceof Error ? error.message : error);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
