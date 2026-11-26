import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  Info,
  Link as LinkIcon,
  Sparkles,
  TrainFront,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';
import { AiStudioModal } from './components/AiStudioModal';
import { NewsMonitorPanel } from './components/NewsMonitorPanel';
import { OutputWorkspace } from './components/OutputWorkspace';
import {
  CONTEXT_OPTIONS,
  DEFAULT_KNOWLEDGE_BASE,
  DEFAULT_NEWS_KEYWORDS,
  SAMPLE_CASE_DATA,
  SAMPLE_GDOCS_LINK,
  buildSystemPromptTemplate,
} from './constants/prDefaults';
import type {
  NewsItem,
  NewsMonitorResult,
  NewsMonitorStatus,
  OutputTab,
  PRPackageResult,
  WorkspaceStatus,
} from './types/pr';
import { copyToClipboard } from './utils/clipboard';

export default function App() {
  const [contextType, setContextType] = useState<string>(CONTEXT_OPTIONS[0]);
  const [rawFieldData, setRawFieldData] = useState<string>('');
  const [gdocsLink, setGdocsLink] = useState<string>('');
  const [kbRules, setKbRules] = useState<string>(DEFAULT_KNOWLEDGE_BASE);
  const [isKbOpen, setIsKbOpen] = useState<boolean>(false);
  const [usePortalStyleRef, setUsePortalStyleRef] = useState<boolean>(true);

  const [status, setStatus] = useState<WorkspaceStatus>('idle');
  const [result, setResult] = useState<PRPackageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<OutputTab>(1);

  const [newsKeywords, setNewsKeywords] = useState<string[]>(DEFAULT_NEWS_KEYWORDS);
  const [newsStatus, setNewsStatus] = useState<NewsMonitorStatus>('idle');
  const [newsData, setNewsData] = useState<NewsMonitorResult | null>(null);
  const [newsError, setNewsError] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const rawTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const systemPromptText = useMemo(() => buildSystemPromptTemplate(kbRules), [kbRules]);

  const handleLoadSampleCase = () => {
    setRawFieldData(SAMPLE_CASE_DATA);
    setContextType(CONTEXT_OPTIONS[0]);
    setGdocsLink(SAMPLE_GDOCS_LINK);
    showToast('Contoh kasus gangguan operasional berhasil dimuat.');
  };

  const handleClearInput = () => {
    setRawFieldData('');
    setGdocsLink('');
    showToast('Kolom masukan telah dibersihkan.');
  };

  const handleResetKnowledgeBase = () => {
    setKbRules(DEFAULT_KNOWLEDGE_BASE);
    showToast('Pedoman kehumasan dikembalikan ke pengaturan awal.');
  };

  const handleAddKeyword = (rawInput: string) => {
    const incoming = rawInput
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (incoming.length === 0) return;

    setNewsKeywords((prev) => {
      const existingLower = new Set(prev.map((k) => k.toLowerCase()));
      const additions = incoming.filter((k) => !existingLower.has(k.toLowerCase()));
      if (additions.length === 0) {
        showToast('Kata kunci tersebut sudah ada dalam daftar.');
        return prev;
      }
      showToast(`Kata kunci ditambahkan: ${additions.join(', ')}`);
      return [...prev, ...additions];
    });
  };

  const handleUpdateKeyword = (index: number, nextValue: string) => {
    const trimmed = nextValue.trim();
    if (!trimmed) return;

    setNewsKeywords((prev) => {
      const duplicate = prev.some(
        (k, idx) => idx !== index && k.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        showToast('Kata kunci tersebut sudah ada dalam daftar.');
        return prev;
      }
      const next = [...prev];
      next[index] = trimmed;
      showToast(`Kata kunci diperbarui menjadi "${trimmed}".`);
      return next;
    });
  };

  const handleRemoveKeyword = (index: number) => {
    setNewsKeywords((prev) => {
      if (prev.length <= 1) {
        showToast('Minimal satu kata kunci harus tersedia.');
        return prev;
      }
      const removed = prev[index];
      showToast(`Kata kunci "${removed}" dihapus.`);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleResetKeywords = () => {
    setNewsKeywords(DEFAULT_NEWS_KEYWORDS);
    showToast('Kata kunci dikembalikan ke pengaturan default.');
  };

  const parseJsonResponse = async <T,>(response: Response): Promise<T & { error?: string }> => {
    const rawText = await response.text();
    try {
      return JSON.parse(rawText) as T & { error?: string };
    } catch {
      const preview = rawText.replace(/<[^>]+>/g, ' ').trim().slice(0, 140);
      throw new Error(
        `Server mengembalikan respons non-JSON (HTTP ${response.status})${preview ? `: ${preview}` : '.'}`
      );
    }
  };

  const handleFetchNews = async () => {
    setNewsStatus('loading');
    setNewsError('');

    try {
      const response = await fetch('/api/news-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: newsKeywords,
        }),
      });

      const payload = await parseJsonResponse<Partial<NewsMonitorResult>>(response);
      if (!response.ok) {
        throw new Error(payload.error || `Gagal mengambil berita (${response.status})`);
      }

      setNewsData({
        items: Array.isArray(payload.items) ? payload.items : [],
        groundingSources: Array.isArray(payload.groundingSources) ? payload.groundingSources : [],
        fetchedAt: payload.fetchedAt || new Date().toISOString(),
      });
      setNewsStatus('success');
      showToast('Pantauan berita perkeretaapian berhasil diperbarui.');
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Terjadi kesalahan saat memantau berita.';
      setNewsError(detail);
      setNewsStatus('error');
    }
  };

  const handleUseNewsAsMaterial = (item: NewsItem) => {
    const lines = [
      `[Pantauan Media - ${item.source} | ${item.publishedAt}]`,
      `Judul Berita: ${item.title}`,
      `Ringkasan Isu: ${item.summary}`,
      item.url ? `Sumber Tautan: ${item.url}` : '',
      '',
      'Catatan Tambahan Tim Humas / Konfirmasi Lapangan: [Silakan lengkapi hasil konfirmasi BTP / Operator jika ada]',
    ].filter((line, index, arr) => !(line === '' && index === arr.length - 1));

    setRawFieldData(lines.join('\n'));

    if (item.suggestedContext) {
      const matchedOption = CONTEXT_OPTIONS.find((opt) => opt === item.suggestedContext);
      if (matchedOption) {
        setContextType(matchedOption);
      }
    }

    showToast('Berita dimuat ke kotak masukan bahan rilis.');
    rawTextareaRef.current?.focus();
  };

  const handleCopy = useCallback(
    async (text: string, label: string): Promise<boolean> => {
      const ok = await copyToClipboard(text);
      showToast(ok ? label : 'Gagal menyalin teks ke clipboard.');
      return ok;
    },
    [showToast]
  );

  const handleGenerate = async () => {
    const trimmedRaw = rawFieldData.trim();
    if (!trimmedRaw) {
      showToast('Harap masukkan data lapangan atau muat contoh kasus terlebih dahulu.');
      rawTextareaRef.current?.focus();
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawData: trimmedRaw,
          contextType,
          kbRules: kbRules.trim(),
          gdocsLink: gdocsLink.trim(),
          usePortalStyleRef,
        }),
      });

      const payload = await parseJsonResponse<Partial<PRPackageResult>>(response);

      if (!response.ok) {
        throw new Error(payload.error || `Permintaan gagal dengan status ${response.status}`);
      }

      if (
        !payload.kronologi_5w1h ||
        !payload.naskah_publik ||
        !payload.analisis_sensitivitas ||
        !payload.ringkasan_wa_pimpinan
      ) {
        throw new Error('Struktur respons dari server tidak lengkap.');
      }

      setResult(payload as PRPackageResult);
      setStatus('success');
      setActiveTab(1);
      showToast('Paket naskah kehumasan berhasil disusun!');
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Terjadi kendala yang tidak diketahui.';
      setErrorMessage(
        `Detail: ${detail}. Periksa ketersediaan GEMINI_API_KEY pada Settings > Secrets atau coba beberapa saat lagi.`
      );
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-slate-900">
      {/* TOP BAR CONTRACT: 3 ZONES, SINGLE LINE */}
      <header className="bg-djka-navy text-white sticky top-0 z-30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#top"
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            <TrainFront className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Asisten Kehumasan Setditjenka</span>
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a
              href="#pantau-berita"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Pantau Berita
            </a>
            <a
              href="#input-lapangan"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Input Lapangan
            </a>
            <a
              href="#pedoman-krisis"
              onClick={() => setIsKbOpen(true)}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Pedoman Krisis
            </a>
            <a
              href="#hasil-naskah"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Hasil Naskah
            </a>
          </nav>

          {/* Zone 3: Primary Header Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-medium text-white transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Panduan AI Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-djka-navy text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Brief Intro & Quick Sample Action */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-djka-orange shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-semibold text-djka-navy">Sekretariat Direktorat Jenderal Perkeretaapian</span>
                <span aria-hidden="true">&middot;</span>
                <span>Kementerian Perhubungan RI</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-djka-navy text-balance">
                Percepat Rilis Publik dari Hitungan Hari Menjadi Hitungan Menit
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
                Tempelkan laporan teknis atau log WhatsApp lapangan yang belum rapi untuk menyusun kronologi 5W+1H,
                draf <em>Holding Statement</em>, Siaran Pers, analisis sensitivitas isu, serta pesan pengantar WA pimpinan.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleLoadSampleCase}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-djka-orange border border-amber-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Muat Contoh Kasus</span>
            </button>
          </div>
        </section>

        {/* TWO-COLUMN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: NEWS MONITOR, INPUT & KNOWLEDGE BASE */}
          <div className="lg:col-span-5 space-y-5">
            {/* PANEL: PANTAU BERITA GOOGLE NEWS */}
            <NewsMonitorPanel
              keywords={newsKeywords}
              status={newsStatus}
              errorMessage={newsError}
              data={newsData}
              onAddKeyword={handleAddKeyword}
              onUpdateKeyword={handleUpdateKeyword}
              onRemoveKeyword={handleRemoveKeyword}
              onResetKeywords={handleResetKeywords}
              onFetchNews={handleFetchNews}
              onUseAsMaterial={handleUseNewsAsMaterial}
            />

            {/* CARD 1: INPUT DATA LAPANGAN */}
            <section
              id="input-lapangan"
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-djka-navy text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    1
                  </span>
                  <h2 className="font-bold text-sm text-djka-navy truncate">
                    Data Lapangan &amp; Kronologi Mentah
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="text-xs text-slate-500 hover:text-red-600 font-medium inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="contextType" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kategori &amp; Tingkat Sensitivitas Awal
                  </label>
                  <select
                    id="contextType"
                    value={contextType}
                    onChange={(e) => setContextType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-djka-navy/20 focus:border-djka-navy transition"
                  >
                    {CONTEXT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="rawFieldData" className="block text-xs font-semibold text-slate-700">
                      Salinan Chat WhatsApp / Laporan Teknis Balai
                    </label>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {rawFieldData.length} karakter
                    </span>
                  </div>
                  <textarea
                    ref={rawTextareaRef}
                    id="rawFieldData"
                    rows={10}
                    value={rawFieldData}
                    onChange={(e) => setRawFieldData(e.target.value)}
                    placeholder="Tempelkan laporan dari grup WhatsApp teknis, kronologi dari Balai Teknik Perkeretaapian, atau catatan lapangan di sini..."
                    className="w-full rounded-lg border border-slate-300 p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-djka-navy/20 focus:border-djka-navy transition leading-relaxed"
                  />
                </div>

                <div>
                  <label htmlFor="gdocsLink" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tautan Google Docs Kolaborasi{' '}
                    <span className="text-slate-400 font-normal">(Opsional · untuk pesan WA Pimpinan)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      id="gdocsLink"
                      value={gdocsLink}
                      onChange={(e) => setGdocsLink(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-djka-navy/20 focus:border-djka-navy transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-100/70 transition">
                    <input
                      type="checkbox"
                      checked={usePortalStyleRef}
                      onChange={(e) => setUsePortalStyleRef(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-djka-navy focus:ring-djka-navy/30 cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-djka-navy block">
                        Gunakan sampel gaya bahasa &amp; narasi portal berita
                      </strong>
                      Acuan struktur piramida terbalik &amp; gaya redaksi dari Tempo.co, Kompas.com, dan Detik.com.
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={status === 'loading'}
                  onClick={handleGenerate}
                  className="w-full py-3 px-5 rounded-lg bg-djka-orange hover:bg-djka-orange-hover text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Wand2 className="w-4 h-4 shrink-0" />
                  <span>{status === 'loading' ? 'Sedang Menyusun Naskah...' : 'Proses & Susun Naskah'}</span>
                </button>
              </div>
            </section>

            {/* CARD 2: KNOWLEDGE BASE / PEDOMAN KEHUMASAN (COLLAPSIBLE) */}
            <section
              id="pedoman-krisis"
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isKbOpen}
                onClick={() => setIsKbOpen((prev) => !prev)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 px-5 py-3.5 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-md bg-djka-navy/10 text-djka-navy flex items-center justify-center shrink-0">
                    <BookOpenCheck className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-djka-navy truncate">
                      Basis Pengetahuan &amp; Pedoman Krisis
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      Aturan nada bahasa &amp; filter sensitivitas isu DJKA
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                    isKbOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isKbOpen && (
                <div className="p-5 space-y-3 border-t border-slate-200 bg-slate-50/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Pedoman Internal (Dapat Disesuaikan):
                    </span>
                    <button
                      type="button"
                      onClick={handleResetKnowledgeBase}
                      className="text-xs text-djka-navy hover:underline font-medium cursor-pointer whitespace-nowrap"
                    >
                      Kembalikan Default
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={kbRules}
                    onChange={(e) => setKbRules(e.target.value)}
                    aria-label="Pedoman Internal Komunikasi Krisis"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-djka-navy/20 focus:border-djka-navy"
                  />
                  <p className="text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
                    <Info className="w-4 h-4 text-djka-navy shrink-0 mt-0.5" />
                    <span>
                      Pedoman di atas menjadi acuan utama agar naskah selaras dengan etika komunikasi publik dan regulasi perkeretaapian.
                    </span>
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: AI GENERATED OUTPUTS */}
          <div className="lg:col-span-7">
            <OutputWorkspace
              status={status}
              errorMessage={errorMessage}
              result={result}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onRetry={handleGenerate}
              onLoadSample={handleLoadSampleCase}
              onCopy={handleCopy}
            />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            Sistem Layanan Kehumasan &middot;{' '}
            <strong className="text-slate-700">Sekretariat Direktorat Jenderal Perkeretaapian</strong>
          </p>
          <p>Dirancang untuk Efisiensi Komunikasi Publik</p>
        </div>
      </footer>

      {/* MODAL PANDUAN GOOGLE AI STUDIO */}
      <AiStudioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        systemPromptText={systemPromptText}
        onCopySuccess={showToast}
        copyText={copyToClipboard}
      />
    </div>
  );
}
