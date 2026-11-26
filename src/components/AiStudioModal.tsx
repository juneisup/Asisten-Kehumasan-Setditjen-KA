import { useEffect, useState } from 'react';
import { Check, Copy, Sparkles, X } from 'lucide-react';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPromptText: string;
  onCopySuccess: (message: string) => void;
  copyText: (text: string) => Promise<boolean>;
}

export function AiStudioModal({
  isOpen,
  onClose,
  systemPromptText,
  onCopySuccess,
  copyText,
}: AiStudioModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    const ok = await copyText(systemPromptText);
    if (ok) {
      setCopied(true);
      onCopySuccess('System Instructions tersalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ai-studio-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-slate-200 flex flex-col">
        <div className="bg-djka-navy text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 id="modal-ai-studio-title" className="font-bold text-base">
              Integrasi &amp; Konfigurasi Google AI Studio
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Tutup modal panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong className="text-djka-navy">Status Layanan:</strong> Aplikasi ini terhubung langsung ke model{' '}
            <code className="font-mono text-djka-navy bg-slate-200/70 px-1.5 py-0.5 rounded">
              gemini-4-hydrogen
            </code>{' '}
            melalui endpoint server aman dan siap digunakan langsung di halaman ini.
          </div>

          <div>
            <h4 className="font-bold text-djka-navy text-sm mb-2">
              Cara Menjalankan di Google AI Studio Secara Mandiri
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <li>
                Buka <strong>aistudio.google.com</strong> dan pilih{' '}
                <strong>Create New Prompt (Chat / Structured Prompt)</strong>.
              </li>
              <li>
                Pilih model <strong>Gemini 4 Hydrogen</strong> pada panel pengaturan kanan.
              </li>
              <li>
                Salin <strong>System Instructions</strong> di bawah ini dan tempelkan ke kolom{' '}
                <em>System Instructions</em> di Google AI Studio.
              </li>
              <li>
                Unggah dokumen PDF SOP Kehumasan atau kumpulan Siaran Pers DJKA terdahulu sebagai referensi tetap.
              </li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold text-djka-navy">
                System Instructions (Siap Salin ke AI Studio)
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin System Prompt</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={systemPromptText}
              rows={9}
              readOnly
              aria-label="System Instructions untuk Google AI Studio"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3.5 text-xs font-mono text-slate-700 leading-relaxed focus:outline-none focus:border-djka-navy"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-djka-navy text-white text-xs font-semibold hover:bg-djka-navy-light transition cursor-pointer whitespace-nowrap"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
