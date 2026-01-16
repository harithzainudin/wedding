import type { CalligraphyStyleId } from "@/types/weddingDetails";

export interface CalligraphyOption {
  id: CalligraphyStyleId;
  name: string;
  nameArabic: string;
  description: string;
  category: "traditional" | "modern" | "ornate";
}

export const calligraphyOptions: CalligraphyOption[] = [
  // Traditional styles
  {
    id: "thuluth",
    name: "Thuluth",
    nameArabic: "ثلث",
    description: "Classic formal Arabic script, elegant and flowing",
    category: "traditional",
  },
  {
    id: "nastaliq",
    name: "Nastaliq",
    nameArabic: "نستعليق",
    description: "Persian-influenced script with graceful curves",
    category: "traditional",
  },
  {
    id: "naskh",
    name: "Naskh",
    nameArabic: "نسخ",
    description: "Standard readable script, clean and modern",
    category: "traditional",
  },
  {
    id: "ruqah",
    name: "Ruq'ah",
    nameArabic: "رقعة",
    description: "Simplified script, contemporary and minimal",
    category: "traditional",
  },
  {
    id: "maghribi",
    name: "Maghribi",
    nameArabic: "مغربي",
    description: "North African style with distinctive curves",
    category: "traditional",
  },
  // Ornate styles
  {
    id: "diwani",
    name: "Diwani",
    nameArabic: "ديواني",
    description: "Ottoman court script, decorative and elaborate",
    category: "ornate",
  },
  {
    id: "diwani-jali",
    name: "Diwani Jali",
    nameArabic: "ديواني جلي",
    description: "Ornate Diwani variant with filled letterforms",
    category: "ornate",
  },
  {
    id: "tughra",
    name: "Tughra",
    nameArabic: "طغراء",
    description: "Calligraphic monogram style, highly artistic",
    category: "ornate",
  },
  {
    id: "classic-ornate",
    name: "Classic Ornate",
    nameArabic: "كلاسيكي مزخرف",
    description: "Traditional style with decorative elements",
    category: "ornate",
  },
  // Modern styles
  {
    id: "kufi",
    name: "Kufic",
    nameArabic: "كوفي",
    description: "Geometric angular script, modern and architectural",
    category: "modern",
  },
  {
    id: "kufi-murabba",
    name: "Squared Kufic",
    nameArabic: "كوفي مربع",
    description: "Box-form Kufic, ultra-modern geometric",
    category: "modern",
  },
  {
    id: "modern-simple",
    name: "Modern Simple",
    nameArabic: "عصري بسيط",
    description: "Contemporary minimalist with clean lines",
    category: "modern",
  },
];

// SVG imports mapping
const svgImports: Record<
  CalligraphyStyleId,
  () => Promise<{ default: string }>
> = {
  thuluth: () => import("./thuluth.svg?raw"),
  nastaliq: () => import("./nastaliq.svg?raw"),
  diwani: () => import("./diwani.svg?raw"),
  "diwani-jali": () => import("./diwani-jali.svg?raw"),
  naskh: () => import("./naskh.svg?raw"),
  ruqah: () => import("./ruqah.svg?raw"),
  kufi: () => import("./kufi.svg?raw"),
  "kufi-murabba": () => import("./kufi-murabba.svg?raw"),
  maghribi: () => import("./maghribi.svg?raw"),
  tughra: () => import("./tughra.svg?raw"),
  "modern-simple": () => import("./modern-simple.svg?raw"),
  "classic-ornate": () => import("./classic-ornate.svg?raw"),
};

// Dynamic import function for SVGs
export const getCalligraphySvg = async (
  id: CalligraphyStyleId,
): Promise<string> => {
  try {
    const importFn = svgImports[id];
    if (!importFn) {
      console.warn(`Calligraphy style "${id}" not found, using default`);
      const defaultModule = await svgImports["thuluth"]();
      return defaultModule.default;
    }
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error(`Failed to load calligraphy style "${id}":`, error);
    // Return fallback text as SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" fill="currentColor">
      <text x="200" y="55" text-anchor="middle" font-family="serif" font-size="42" dir="rtl">
        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
      </text>
    </svg>`;
  }
};

// Get calligraphy option by ID
export const getCalligraphyOption = (
  id: CalligraphyStyleId,
): CalligraphyOption | undefined => {
  return calligraphyOptions.find((option) => option.id === id);
};

// Get calligraphy options grouped by category
export const getCalligraphyByCategory = () => {
  return {
    traditional: calligraphyOptions.filter((o) => o.category === "traditional"),
    ornate: calligraphyOptions.filter((o) => o.category === "ornate"),
    modern: calligraphyOptions.filter((o) => o.category === "modern"),
  };
};
