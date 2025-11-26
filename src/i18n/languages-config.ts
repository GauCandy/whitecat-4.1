/**
 * Language Configuration
 * Metadata for all supported languages
 *
 * To add a new language:
 * 1. Add locale files in src/i18n/locales/<locale>/
 * 2. Add language metadata here
 * 3. That's it! The language will automatically appear in setup menus
 */

export interface LanguageMetadata {
  label: string;       // Display name
  description: string; // Description for select menu
  emoji: string;       // Flag emoji
}

/**
 * Language metadata for all supported locales
 * Key is the locale code (e.g., 'en-US', 'vi')
 */
export const LANGUAGES_CONFIG: Record<string, LanguageMetadata> = {
  // English
  'en-US': {
    label: 'English',
    description: 'Set server language to English',
    emoji: '🇺🇸',
  },
  'en': {
    label: 'English',
    description: 'Set server language to English',
    emoji: '🇺🇸',
  },

  // Vietnamese
  'vi': {
    label: 'Tiếng Việt',
    description: 'Đặt ngôn ngữ máy chủ thành Tiếng Việt',
    emoji: '🇻🇳',
  },
  'vi-VN': {
    label: 'Tiếng Việt',
    description: 'Đặt ngôn ngữ máy chủ thành Tiếng Việt',
    emoji: '🇻🇳',
  },

  // Add more languages here as needed:
  // 'ja': {
  //   label: '日本語',
  //   description: 'サーバーの言語を日本語に設定',
  //   emoji: '🇯🇵',
  // },
  // 'ko': {
  //   label: '한국어',
  //   description: '서버 언어를 한국어로 설정',
  //   emoji: '🇰🇷',
  // },
  // 'zh-CN': {
  //   label: '简体中文',
  //   description: '将服务器语言设置为简体中文',
  //   emoji: '🇨🇳',
  // },
};

/**
 * Get language metadata for a locale
 * @param locale Locale code
 * @returns Language metadata or fallback
 */
export function getLanguageInfo(locale: string): LanguageMetadata {
  return LANGUAGES_CONFIG[locale] || {
    label: locale,
    description: `Set server language to ${locale}`,
    emoji: '🌐',
  };
}

/**
 * Get primary locales (non-aliases) from config
 * @returns Array of primary locale codes
 */
export function getPrimaryLocales(): string[] {
  return ['en-US', 'vi']; // Update this when adding new primary locales
}

/**
 * Language list for selection menus
 */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  // Add more languages here as needed
];
