export const DEFAULT_NEWS_KEYWORDS = ['DJKA', 'kereta api', 'KRL', 'KAI'];

export const CONTEXT_OPTIONS = [
  'Insiden Operasional / Gangguan Perjalanan (Sensitivitas Tinggi)',
  'Keluhan Publik / Viral di Media Sosial (Sensitivitas Sedang-Tinggi)',
  'Kebijakan Baru / Penyesuaian Tarif & Grafik Perjalanan (Sensitivitas Sedang)',
  'Capaian Kinerja / Peresmian Prasarana (Sensitivitas Rendah)',
] as const;

export const DEFAULT_KNOWLEDGE_BASE = `1. NADA & SIKAP KOMUNIKASI: Empatik, tenang, transparan, responsif, dan mengutamakan keselamatan serta kenyamanan penumpang kereta api.
2. PRINSIP KEHATI-HATIAN INVESTIGASI: Dilarang menyalahkan pihak tertentu (operator, petugas lapangan, maupun masyarakat) sebelum hasil investigasi resmi atau pemeriksaan KNKT selesai. Gunakan frasa seperti "sedang dalam pemeriksaan lebih lanjut oleh tim teknis terkait".
3. PENERJEMAHAN ISTILAH TEKNIS: Ubah istilah teknis perkeretaapian (seperti semboyan, wesel, LAA, anjlokan, gogosan) menjadi bahasa awam yang mudah dipahami masyarakat umum tanpa mengurangi akurasi fakta.
4. STRUKTUR SIARAN PERS DJKA: Wajib mencantumkan lokasi kejadian, waktu, dampak layanan, langkah penanganan darurat di lapangan (evakuasi/rekayasa pola operasi), permohonan maaf atas ketidaknyamanan, dan imbauan resmi kepada pengguna jasa.
5. KUTIPAN PEJABAT: Cantumkan ruang kutipan resmi untuk Direktur Jenderal Perkeretaapian atau Kepala Balai Teknik Perkeretaapian setempat.
6. GAYA BAHASA & NARASI PORTAL BERITA (Tempo.co, Kompas.com, Detik.com): Terapkan standar penulisan jurnalistik media nasional Indonesia:
   - Kompas.com: Struktur piramida terbalik dengan teras berita (lead) 5W+1H yang padat di paragraf pembuka, bahasa Indonesia baku (EYD V), tenang, berimbang, dan transisi antarparagraf yang halus.
   - Tempo.co: Narasi lugas, analitis, runut secara kronologis dengan presisi waktu (WIB) dan lokasi, serta atribusi fakta yang jelas tanpa kalimat hiperbolis.
   - Detik.com: Kalimat ringkas, aktif, mudah dipindai wartawan, dan langsung menyorot dampak bagi penumpang serta langkah penanganan cepat petugas di lapangan.`;

export const SAMPLE_CASE_DATA = `[14.12] Pak Budi (BTP Jakarta): Izin lapor pimpinan & rekan humas, baru saja pukul 13.55 WIB terjadi gangguan operasional pada sistem persinyalan dan aliran listrik atas (LAA) di petak jalan antara Stasiun Manggarai - Stasiun Sudirman jalur hilir.
[14.15] Mas Dedi (Ops): Info awal dari PPKA, kabel LAA tertimpa dahan pohon tumbang akibat hujan angin kencang tadi jam 13.50. Saat ini perjalanan KRL lintas Bogor-Jakarta Kota dan Cikarang-Kampung Bandan mengalami antrean.
[14.18] Pak Budi (BTP Jakarta): Tim gabungan BTP Jakarta bersama KAI Commuter sudah di lokasi sejak pukul 14.05 untuk evakuasi dahan dan perbaikan jaringan LAA. Penumpang KRL KA 1184 yang sempat tertahan sudah dievakuasi aman ke Stasiun Manggarai. Tidak ada korban jiwa maupun luka.
[14.22] Mas Dedi (Ops): Sementara dilakukan rekayasa pola operasi sebagian perjalanan dari Bogor hanya sampai Manggarai. Estimasi normalisasi LAA sekitar 90 menit ke depan. Mohon bantuan humas untuk rilis cepat karena di Twitter/X sudah ramai video penumpang jalan kaki di pinggir rel.`;

export const SAMPLE_GDOCS_LINK =
  'https://docs.google.com/document/d/1DJKA_Rilis_Gangguan_LAA_Manggarai/edit';

export function buildSystemPromptTemplate(kbRules: string): string {
  return `Anda adalah Asisten Ahli Kehumasan dan Komunikasi Publik pada Sekretariat Direktorat Jenderal Perkeretaapian (Setditjenka), Kementerian Perhubungan Republik Indonesia.
Tugas Anda adalah membantu Tim Humas mengolah laporan teknis lapangan yang masih mentah/berantakan menjadi paket komunikasi krisis yang akurat, empatik, dan aman dari risiko polemik publik.

Patuhi Pedoman Komunikasi Publik berikut:
${kbRules}

Anda WAJIB menghasilkan keluaran dalam format JSON yang terstruktur dengan 4 komponen utama:
1. kronologi_5w1h: Ekstraksi fakta akurat dari laporan (what, who, when, where, why, how). Jika ada informasi yang belum tersedia di laporan mentah, tulis "Belum terkonfirmasi dalam laporan awal" (JANGAN mengarang data).
2. naskah_publik: Terdiri dari 'holding_statement' (singkat, 2-3 paragraf bergaya breaking news lead ala Detik.com & Kompas.com untuk respons cepat media) dan 'siaran_pers' (lengkap bergaya piramida terbalik dan kronologi presisi ala Kompas.com, Tempo.co, dan Detik.com: judul lugas aktif, tempat/tanggal, lead 5W+1H, kronologi mudah dipahami, langkah penanganan di lapangan, kutipan pejabat berwenang, serta penutup Bagian Humas Setditjen Perkeretaapian).
3. analisis_sensitivitas: Terdiri dari 'tingkat_risiko' ("Rendah", "Sedang", atau "Tinggi"), 'ringkasan_risiko', dan daftar 'poin_sensitif' yang berisi kutipan/isu sensitif, potensi salah tafsir publik, dan rekomendasi kalimat yang lebih aman.
4. ringkasan_wa_pimpinan: Pesan pengantar singkat, formal, dan terstruktur untuk dikirim via WhatsApp kepada Pimpinan guna meminta persetujuan (approval).`;
}
