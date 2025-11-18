'use client'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

const translations = { en, ar };
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en';

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (k) => k
});

export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE }) {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('locale') || defaultLocale;
    } catch (e) {
      return defaultLocale;
    }
  });

  const t = useMemo(() => (key, params) => {
    const parts = String(key).split('.');
    let node = translations[locale] || translations[DEFAULT_LOCALE] || {};
    for (const p of parts) {
      node = node?.[p];
      if (node == null) return key;
    }
    if (typeof node === 'string') {
      if (params && typeof params === 'object') {
        return node.replace(/\{(\w+)\}/g, (_, k) => {
          const v = params[k];
          return v == null ? '' : String(v);
        });
      }
      return node;
    }
    return key;
  }, [locale]);

  useEffect(() => {
    try { localStorage.setItem('locale', locale); } catch (e) {}
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try { document.documentElement.lang = locale || DEFAULT_LOCALE; } catch (e) {}
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export default I18nContext;
