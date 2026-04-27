import { defineOverridesPreferences } from '@vben/preferences';

export const overridesPreferences = defineOverridesPreferences({
  app: {
    defaultHomePath: '/analytics',
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: {
    enable: false,
  },
  widget: {
    globalSearch: false,
    languageToggle: false,
    lockScreen: false,
    notification: false,
  },
});
