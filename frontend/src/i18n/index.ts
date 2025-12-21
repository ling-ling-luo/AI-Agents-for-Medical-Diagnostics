import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

i18n
  .use(LanguageDetector) // 自动检测浏览器语言
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS }
    },
    fallbackLng: 'zh-CN', // 默认中文
    lng: localStorage.getItem('i18nextLng') || 'zh-CN', // 从本地存储读取用户偏好
    interpolation: {
      escapeValue: false // React 已经做了 XSS 防护
    },
    detection: {
      order: ['localStorage', 'navigator'], // 优先使用本地存储的语言设置
      caches: ['localStorage'] // 将用户选择的语言缓存到 localStorage
    }
  });

export default i18n;
