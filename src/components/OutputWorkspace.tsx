import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Check,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  ListOrdered,
  MapPin,
  MessageSquareShare,
  Newspaper,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import type { OutputTab, PRPackageResult, RiskLevel, WorkspaceStatus } from '../types/pr';

interface OutputWorkspaceProps {
  status: WorkspaceStatus;
  errorMessage: string;
  result: PRPackageResult | null;
  activeTab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  onRetry: () => void;
  onLoadSample: () => void;
  onCopy: (text: string, label: string) => Promise<boolean>;
}

const TAB_ITEMS: Array<{
  id: OutputTab;
  label: string;
  icon: typeof ListOrdered;
}> = [
  { id: 1, label: '1. Kronologi 5W+1H', icon: ListOrdered },
  { id: 2, label: '2. Siaran Pers & Holding', icon: Newspaper },
  { id: 3, label: '3. Filter Sensitivitas Isu', icon: ShieldAlert },
  { id: 4, label: '4. Ringkasan WA Pimpinan', icon: MessageSquareShare },
];

function getRiskVisuals(level: RiskLevel) {
  if (level === 'Tinggi') {
    return {
      containerClass: 'bg-red-50 text-red-800 border-red-200',
      Icon: AlertTriangle,
    };
  }
  if (level === 'Sedang') {
    return {
      containerClass: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: AlertCircle,
    };
  }
  return {
    containerClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: ShieldCheck,
  };
}

export function OutputWorkspace({
  status,
  errorMessage,
  result,
  activeTab,
  onTabChange,
  onRetry,
  onLoadSample,
  onCopy,
}: OutputWorkspaceProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyAction = async (key: string, text: string, toastLabel: string) => {
    const ok = await onCopy(text, toastLabel);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  const statusText =
    status === 'loading'
      ? 'Sedang Memproses'
      : status === 'success'
      ? 'Selesai Disusun'
      : status === 'error'
      ? 'Terjadi Kendala'
      : 'Menunggu Input';

  const kronologiEntries = result
    ? [
        { label: 'WHAT · Apa yang Terjadi', value: result.kronologi_5w1h.what, Icon: AlertCircle },
        { label: 'WHEN · Kapan Kejadian', value: result.kronologi_5w1h.when, Icon: Clock },
        { label: 'WHERE · Lokasi Kejadian', value: result.kronologi_5w1h.where, Icon: MapPin },
        { label: 'WHO · Pihak Terdampak', value: result.kronologi_5w1h.who, Icon: Users },
        { label: 'WHY · Penyebab Awal', value: result.kronologi_5w1h.why, Icon: HelpCircle },
        { label: 'HOW · Kronologi & Penanganan', value: result.kronologi_5w1h.how, Icon: Wrench },
      ]
    : [];

  const kronologiClipboardText = kronologiEntries
    .map((entry) => `${entry.label}:\n${entry.value}`)
    .join('\n\n');

  return (
    <section
      id="hasil-naskah"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col"
    >
      {/* Output Header & 4 Tabs */}
      <div className="bg-djka-navy text-white px-5 pt-4 pb-0">
        <div className="flex items-center justify-between gap-4 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-djka-orange text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
              2
            </span>
            <h3 className="font-bold text-sm sm:text-base truncate">
              Hasil Analisis &amp; Draf Naskah Asisten
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-medium whitespace-nowrap shrink-0">
            Status: {statusText}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1 -mx-1 px-1 pb-0 no-scrollbar" role="tablist">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap shrink-0 flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                  isActive
                    ? 'border-djka-orange bg-white text-djka-navy'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-djka-orange' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Body Container */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-djka-navy" />
            </div>
            <h4 className="text-base font-bold text-djka-navy">
              Siap Membantu Menyusun Naskah Kehumasan
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mt-2 leading-relaxed">
              Masukkan laporan teknis atau potongan pesan WhatsApp di panel sebelah kiri, lalu klik{' '}
              <strong className="text-slate-800">Proses &amp; Susun Naskah</strong>. Anda juga dapat mencoba langsung
              dengan contoh kasus lapangan.
            </p>
            <button
              type="button"
              onClick={onLoadSample}
              className="mt-5 px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-djka-orange border border-amber-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            >
              Muat Contoh Kasus Lapangan
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex-1 flex flex-col justify-center space-y-5 py-6">
            <div className="flex flex-col items-center text-center mb-2">
              <div className="relative w-12 h-12 mb-3">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 rounded-full border-4 border-djka-orange border-t-transparent animate-spin" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-djka-navy">
                Sedang Menganalisis Data Lapangan...
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Menyusun kronologi 5W+1H, memeriksa sensitivitas isu, dan menyusun draf siaran pers.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-200/80 rounded" />
                  <div className="h-3 w-4/5 bg-slate-200/80 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h4 className="text-base font-bold text-red-800">Gagal Memproses Permintaan</h4>
            <p className="text-xs sm:text-sm text-red-600 max-w-md mt-1.5 leading-relaxed">
              {errorMessage || 'Terjadi kendala saat menghubungi layanan Gemini API.'}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-lg bg-djka-navy text-white text-xs font-semibold hover:bg-djka-navy-light transition cursor-pointer whitespace-nowrap"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {status === 'success' && result && (
          <div className="space-y-5">
            {/* TAB 1: KRONOLOGI 5W+1H */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-djka-navy text-sm sm:text-base">
                      Ekstraksi Kronologi Terstruktur (5W + 1H)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Fakta kunci yang dirangkum dari laporan mentah lapangan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyAction('kronologi', kronologiClipboardText, 'Kronologi 5W+1H tersalin!')
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'kronologi' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin 5W+1H</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kronologiEntries.map((item) => {
                    const Icon = item.Icon;
                    return (
                      <div
                        key={item.label}
                        className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-djka-navy">
                          <Icon className="w-3.5 h-3.5 text-djka-orange shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: DRAF SIARAN PERS & HOLDING STATEMENT */}
            {activeTab === 2 && (
              <div className="space-y-6">
                {/* Holding Statement Section */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-djka-orange">
                        Respons Cepat Media
                      </span>
                      <h4 className="font-bold text-djka-navy text-sm sm:text-base">
                        Holding Statement (Pernyataan Awal)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyAction(
                          'holding',
                          result.naskah_publik.holding_statement,
                          'Holding Statement tersalin!'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-djka-orange border border-amber-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedKey === 'holding' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Holding Statement</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Gunakan pernyataan singkat ini jika media mulai mengonfirmasi sementara pemeriksaan teknis masih berlangsung.
                  </p>
                  <div className="bg-white rounded-lg border border-amber-200/80 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {result.naskah_publik.holding_statement}
                  </div>
                </div>

                {/* Siaran Pers Section */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-500">
                        Naskah Lengkap
                      </span>
                      <h4 className="font-bold text-djka-navy text-sm sm:text-base">
                        Draf Siaran Pers Resmi DJKA
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyAction(
                            'press',
                            result.naskah_publik.siaran_pers,
                            'Siaran Pers tersalin!'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-djka-navy hover:bg-djka-navy-light text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'press' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Siaran Pers</span>
                          </>
                        )}
                      </button>
                      <a
                        href="https://docs.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          void handleCopyAction(
                            'press',
                            result.naskah_publik.siaran_pers,
                            'Naskah Siaran Pers tersalin! Silakan tempel di Google Docs.'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-djka-navy border border-slate-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                        title="Salin naskah & buka Google Docs baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Salin &amp; Buka Google Docs</span>
                      </a>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {result.naskah_publik.siaran_pers}
                  </div>
                </div>

                {/* Referensi Gaya Bahasa & Narasi Portal Berita */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-djka-navy">
                      Acuan Gaya Bahasa &amp; Narasi Portal Berita
                    </span>
                    <span className="text-slate-500">
                      Tempo.co &middot; Kompas.com &middot; Detik.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Draf disusun mengikuti standar piramida terbalik, teras berita 5W+1H, dan alur kronologi jurnalistik portal berita nasional tanpa mencampur fakta dari artikel eksternal.
                  </p>
                  {result.referensi_portal && result.referensi_portal.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5">
                      {result.referensi_portal.map((ref) => (
                        <a
                          key={ref.uri}
                          href={ref.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-djka-navy hover:text-djka-orange hover:underline max-w-[240px] truncate"
                          title={ref.title}
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{ref.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PEMERIKSA SENSITIVITAS ISU */}
            {activeTab === 3 && (
              <div className="space-y-4">
                {(() => {
                  const sens = result.analisis_sensitivitas;
                  const visuals = getRiskVisuals(sens.tingkat_risiko);
                  const RiskIcon = visuals.Icon;
                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-djka-navy text-sm sm:text-base">
                            Analisis Sensitivitas &amp; Mitigasi Risiko Isu
                          </h4>
                          <p className="text-xs text-slate-500">
                            Deteksi dini kalimat sensitif sebelum diajukan untuk persetujuan pimpinan
                          </p>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap shrink-0 ${visuals.containerClass}`}
                        >
                          <RiskIcon className="w-4 h-4 shrink-0" />
                          <span>Tingkat Risiko: {sens.tingkat_risiko}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <strong className="text-djka-navy block mb-1">
                          Evaluasi Umum Sensitivitas Publik:
                        </strong>
                        {sens.ringkasan_risiko}
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-600">
                          Poin Perhatian &amp; Rekomendasi Penghalusan Kalimat
                        </h5>
                        {sens.poin_sensitif && sens.poin_sensitif.length > 0 ? (
                          <div className="space-y-3">
                            {sens.poin_sensitif.map((item, idx) => (
                              <div
                                key={`${idx}-${item.frasa_atau_isu.slice(0, 20)}`}
                                className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5"
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-bold shrink-0 tabular-nums">
                                    Poin #{idx + 1}
                                  </span>
                                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                    &ldquo;{item.frasa_atau_isu}&rdquo;
                                  </p>
                                </div>
                                <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 leading-relaxed">
                                  <strong className="text-slate-800">Potensi Salah Tafsir Publik:</strong>{' '}
                                  {item.potensi_salah_tafsir}
                                </p>
                                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                                  <strong className="text-emerald-800 block mb-0.5">
                                    Rekomendasi Redaksi Lebih Aman:
                                  </strong>
                                  &ldquo;{item.rekomendasi_kalimat}&rdquo;
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                            Tidak ditemukan frasa berisiko tinggi pada laporan ini. Naskah relatif aman untuk dipublikasikan.
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* TAB 4: RINGKASAN EKSEKUTIF (SIAP KIRIM WA PIMPINAN) */}
            {activeTab === 4 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-djka-navy text-sm sm:text-base">
                      Pesan Pengantar Approval (WhatsApp Pimpinan)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Format ringkas siap kirim untuk mempercepat persetujuan berjenjang
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyAction('wa', result.ringkasan_wa_pimpinan, 'Pesan WA Pimpinan tersalin!')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'wa' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <MessageSquareShare className="w-4 h-4" />
                        <span>Salin Pesan WA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* WhatsApp Preview Bubble */}
                <div className="bg-[#E5DDD5] p-4 sm:p-5 rounded-xl border border-slate-300">
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-none p-4 max-w-xl ml-auto border border-emerald-200">
                    <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                      {result.ringkasan_wa_pimpinan}
                    </div>
                    <div className="text-[11px] text-slate-500 text-right mt-2 flex items-center justify-end gap-1">
                      <span>Siap dikirim via WhatsApp</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
