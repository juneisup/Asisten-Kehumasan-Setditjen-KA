export interface Kronologi5W1H {
  what: string;
  who: string;
  when: string;
  where: string;
  why: string;
  how: string;
}

export interface NaskahPublik {
  holding_statement: string;
  siaran_pers: string;
}

export interface PoinSensitif {
  frasa_atau_isu: string;
  potensi_salah_tafsir: string;
  rekomendasi_kalimat: string;
}

export type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi';

export interface AnalisisSensitivitas {
  tingkat_risiko: RiskLevel;
  ringkasan_risiko: string;
  poin_sensitif: PoinSensitif[];
}

export interface PRPackageResult {
  kronologi_5w1h: Kronologi5W1H;
  naskah_publik: NaskahPublik;
  analisis_sensitivitas: AnalisisSensitivitas;
  ringkasan_wa_pimpinan: string;
  referensi_portal?: GroundingSource[];
}

export type WorkspaceStatus = 'idle' | 'loading' | 'success' | 'error';
export type OutputTab = 1 | 2 | 3 | 4;

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  url: string;
  suggestedContext?: string;
}

export interface NewsMonitorResult {
  items: NewsItem[];
  groundingSources: GroundingSource[];
  fetchedAt: string;
}

export type NewsMonitorStatus = 'idle' | 'loading' | 'success' | 'error';
