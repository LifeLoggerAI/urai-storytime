export type StorytimeLocaleDirection = "ltr" | "rtl";
export type StorytimeLocaleState = "source" | "hard_off_pending_native_safety_review";

export interface StorytimeLocaleRecord {
  locale: string;
  language: string;
  direction: StorytimeLocaleDirection;
  state: StorytimeLocaleState;
  reviewRequirements: string[];
}

/**
 * Launch-language authority recovered from the URAI 20-Language Launch control plane.
 * This registry is capability planning, not a claim that Storytime is translated or certified.
 * Only en-US is enabled as Storytime source copy until native language, safety, accessibility,
 * layout/RTL, narration and legal review are completed for each additional locale.
 */
export const STORYTIME_LAUNCH_LOCALES: readonly StorytimeLocaleRecord[] = [
  { locale: "en-US", language: "English", direction: "ltr", state: "source", reviewRequirements: ["editorial", "safety", "accessibility"] },
  { locale: "zh-CN", language: "Simplified Mandarin Chinese", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "hi-IN", language: "Hindi", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "es", language: "Spanish", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["LatAm", "Spain", "safety", "accessibility"] },
  { locale: "fr", language: "French", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["multi-region", "safety", "accessibility"] },
  { locale: "ar", language: "Modern Standard Arabic", direction: "rtl", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "rtl", "safety", "accessibility"] },
  { locale: "bn", language: "Bengali", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "pt-BR", language: "Brazilian Portuguese", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["Brazilian-native", "safety", "accessibility"] },
  { locale: "ru", language: "Russian", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "legal-channel", "safety", "accessibility"] },
  { locale: "ur", language: "Urdu", direction: "rtl", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "rtl", "safety", "accessibility"] },
  { locale: "id", language: "Indonesian", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "de", language: "German", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["DACH-native", "safety", "accessibility"] },
  { locale: "ja", language: "Japanese", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "sw", language: "Swahili", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["East-African-native", "safety", "accessibility"] },
  { locale: "tr", language: "Turkish", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "vi", language: "Vietnamese", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "fil", language: "Filipino / Tagalog", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "ko", language: "Korean", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "it", language: "Italian", direction: "ltr", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "safety", "accessibility"] },
  { locale: "fa", language: "Persian / Farsi", direction: "rtl", state: "hard_off_pending_native_safety_review", reviewRequirements: ["native", "rtl", "legal-channel", "safety", "accessibility"] }
] as const;

export const STORYTIME_ENABLED_LOCALES = STORYTIME_LAUNCH_LOCALES
  .filter((record) => record.state === "source")
  .map((record) => record.locale);

export function requireStorytimeLocaleEnabled(locale: string) {
  if (!STORYTIME_ENABLED_LOCALES.includes(locale)) {
    throw new Error(`Storytime locale ${locale} is not yet enabled. Native safety/accessibility review is required.`);
  }
  return locale;
}
