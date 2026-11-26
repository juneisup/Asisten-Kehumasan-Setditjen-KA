import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FilePlus2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { DEFAULT_NEWS_KEYWORDS } from '../constants/prDefaults';
import type { NewsItem, NewsMonitorResult, NewsMonitorStatus } from '../types/pr';

interface NewsMonitorPanelProps {
  keywords: string[];
  status: NewsMonitorStatus;
  errorMessage: string;
  data: NewsMonitorResult | null;
  onAddKeyword: (keyword: string) => void;
  onUpdateKeyword: (index: number, nextValue: string) => void;
  onRemoveKeyword: (index: number) => void;
  onResetKeywords: () => void;
  onFetchNews: () => void;
  onUseAsMaterial: (item: NewsItem) => void;
}

export function NewsMonitorPanel({
  keywords,
  status,
  errorMessage,
  data,
  onAddKeyword,
  onUpdateKeyword,
  onRemoveKeyword,
  onResetKeywords,
  onFetchNews,
  onUseAsMaterial,
}: NewsMonitorPanelProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const formattedTime = data?.fetchedAt
    ? new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(data.fetchedAt))
    : null;

  const isDefaultKeywords =
    keywords.length === DEFAULT_NEWS_KEYWORDS.length &&
    keywords.every((kw, idx) => kw === DEFAULT_NEWS_KEYWORDS[idx]);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    onAddKeyword(trimmed);
    setNewKeyword('');
  };

  const startEditing = (idx: number, currentVal: string) => {
    setEditingIndex(idx);
    setEditingValue(currentVal);
  };

  const commitEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (trimmed) {
      onUpdateKeyword(editingIndex, trimmed);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <section
      id="pantau-berita"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      {/* Header / Clickable Trigger */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onFetchNews}
          disabled={status === 'loading'}
          className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer disabled:cursor-wait group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-djka-navy/30 rounded-md"
        >
          <span className="w-7 h-7 rounded-md bg-djka-navy text-white flex items-center justify-center shrink-0">
            <Newspaper className="w-4 h-4 text-amber-300" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-djka-navy group-hover:text-djka-orange transition-colors truncate">
              Pantau Berita Google News
            </h2>
            <p className="text-xs text-slate-500 truncate">
              {keywords.join(' · ')} &middot; 24 jam terakhir
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onFetchNews}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-djka-navy hover:bg-djka-navy-light text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-wait whitespace-nowrap shrink-0"
        >
          {status === 'loading' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Memantau...</span>
            </>
          ) : status === 'success' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Segarkan</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Pantau Sekarang</span>
            </>
          )}
        </button>
      </div>

      {/* Keyword Management Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Kata Kunci Pantauan <span className="font-normal text-slate-500">(klik untuk ubah)</span>
          </span>
          {!isDefaultKeywords && (
            <button
              type="button"
              onClick={onResetKeywords}
              className="inline-flex items-center gap-1 text-xs font-medium text-djka-navy hover:text-djka-orange transition cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span>Reset Default</span>
            </button>
          )}
        </div>

        {/* Active Keywords List (editable & removable) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {keywords.map((kw, idx) =>
            editingIndex === idx ? (
              <div
                key={`edit-${idx}`}
                className="inline-flex items-center gap-1 rounded-lg border border-djka-navy bg-white px-2 py-1"
              >
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEdit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                  autoFocus
                  aria-label={`Ubah kata kunci ${kw}`}
                  className="w-28 text-xs text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={commitEdit}
                  className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  aria-label="Simpan perubahan kata kunci"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Batal ubah kata kunci"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                key={`${idx}-${kw}`}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-700 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => startEditing(idx, kw)}
                  title={`Klik untuk mengganti "${kw}"`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 hover:bg-slate-50 hover:text-djka-navy transition cursor-pointer whitespace-nowrap"
                >
                  <span className="font-medium">{kw}</span>
                  <Pencil className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </button>
                {keywords.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveKeyword(idx)}
                    title={`Hapus "${kw}"`}
                    aria-label={`Hapus kata kunci ${kw}`}
                    className="px-1.5 py-1 border-l border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50/60 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {/* Add Keyword Form */}
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Tambah kata kunci baru (mis. Whoosh, LRT, Daop 1)..."
            aria-label="Tambah kata kunci baru"
            className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-djka-navy/20 focus:border-djka-navy transition"
          />
          <button
            type="submit"
            disabled={!newKeyword.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Tambah</span>
          </button>
        </form>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        {status === 'idle' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 leading-relaxed">
            <p>
              Klik <strong>Pantau Berita Google News</strong> atau <strong>Pantau Sekarang</strong> untuk menarik
              berita perkeretaapian Indonesia terbaru dalam 24 jam terakhir sesuai kata kunci di atas.
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="h-3 w-36 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-3 w-5/6 bg-slate-200/80 rounded" />
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="leading-relaxed">
                {errorMessage || 'Gagal mengambil pantauan berita terkini.'}
              </p>
              <button
                type="button"
                onClick={onFetchNews}
                className="px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {status === 'success' && data && (
          <div className="space-y-3">
            {formattedTime && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="tabular-nums">
                  {data.items.length} berita teratas ditemukan
                </span>
                <span className="tabular-nums">Diperbarui {formattedTime} WIB</span>
              </div>
            )}

            {data.items.length === 0 ? (
              <p className="text-xs text-slate-600 py-2">
                Belum ditemukan berita baru yang relevan dalam 24 jam terakhir. Silakan sesuaikan kata kunci atau coba segarkan kembali.
              </p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {data.items.map((item, idx) => (
                  <article
                    key={`${idx}-${item.title.slice(0, 24)}`}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-djka-navy">{item.source}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span className="tabular-nums">{item.publishedAt}</span>
                    </div>

                    {/* Headline */}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm font-bold text-slate-900 hover:text-djka-orange transition-colors leading-snug"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                    )}

                    {/* Summary */}
                    <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>

                    {/* Actions */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onUseAsMaterial(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-djka-orange border border-amber-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                      >
                        <FilePlus2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Gunakan sebagai Bahan Rilis</span>
                      </button>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-djka-navy hover:underline whitespace-nowrap"
                        >
                          <span>Baca Sumber</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Grounding Sources Attribution */}
            {data.groundingSources.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <span className="block text-[11px] font-semibold text-slate-500">
                  Sumber Referensi Google Search:
                </span>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {data.groundingSources.slice(0, 6).map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-djka-navy hover:text-djka-orange hover:underline max-w-[220px] truncate"
                      title={src.title}
                    >
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
