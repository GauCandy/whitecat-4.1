/**
 * i18n - Internationalization Module
 * Simple direct import from TypeScript
 * All translations loaded into RAM on startup - no disk reads during runtime
 */

import vi from './locales/vi';
import enUS from './locales/en-US';

// Supported locales - loaded once into RAM
export const locales = {
  'en-US': enUS,
  'en': enUS,
  'vi-VN': vi,
  'vi': vi,
} as const;

export type Locale = keyof typeof locales;
export type TranslationKey = string;

// Get default locale from environment variable
const DEFAULT_LOCALE = (process.env.DEFAULT_LOCALE || 'en-US') as Locale;

// Current locale
let currentLocale: Locale = DEFAULT_LOCALE;

/**
 * Get default locale from environment
 */
export function getDefaultLocale(): Locale {
  return DEFAULT_LOCALE;
}

/**
 * Initialize i18n system
 * @param locale Default locale to use
 */
export function init(locale?: string): void {
  if (locale && locale in locales) {
    currentLocale = locale as Locale;
  } else {
    currentLocale = DEFAULT_LOCALE;
  }

  console.log(`\x1b[32m✓ i18n initialized with locale: ${currentLocale}\x1b[0m`);
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Set current locale
 * @param locale Locale to set
 */
export function setLocale(locale: Locale): void {
  if (locale in locales) {
    currentLocale = locale;
  }
}

/**
 * Get translation by key
 * @param key Translation key (e.g., 'general.ping.reply')
 * @param replacements Object with placeholder replacements
 * @param locale Override locale for this translation
 * @returns Translated string
 */
export function t(
  key: TranslationKey,
  replacements?: Record<string, string | number>,
  locale?: Locale
): string {
  const targetLocale = locale || currentLocale;
  const translations = locales[targetLocale] || locales[DEFAULT_LOCALE];

  // Navigate through nested keys
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default locale if key not found
      value = locales[DEFAULT_LOCALE];
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // Return key if not found in any locale
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace placeholders
  if (replacements) {
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      value = value.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(replacement));
    }
  }

  return value;
}

/**
 * Get translation function for specific locale
 * @param locale Locale to use
 * @returns Translation function
 */
export function getT(locale: Locale) {
  return (key: TranslationKey, replacements?: Record<string, string | number>) =>
    t(key, replacements, locale);
}

/**
 * Check if locale is supported
 * @param locale Locale to check
 */
export function isLocaleSupported(locale: string): locale is Locale {
  return locale in locales;
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): Locale[] {
  return Object.keys(locales) as Locale[];
}

/**
 * Get all localizations for a translation key
 * Useful for Discord command description localizations
 * @param key Translation key
 * @param replacements Optional replacements
 * @returns Object with all locale translations
 */
export function getAllLocalizations(
  key: TranslationKey,
  replacements?: Record<string, string | number>
): Record<string, string> {
  const result: Record<string, string> = {};

  // Get unique locale codes (exclude aliases)
  const uniqueLocales = ['vi', 'en-US'] as const;

  for (const locale of uniqueLocales) {
    result[locale] = t(key, replacements, locale);
  }

  return result;
}

// Export default
export default {
  init,
  t,
  getT,
  getLocale,
  getDefaultLocale,
  setLocale,
  isLocaleSupported,
  getSupportedLocales,
  getAllLocalizations,
  locales,
};
