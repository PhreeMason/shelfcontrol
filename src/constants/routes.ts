export const ROUTES = {
  HOME: '/',
  PROFILE: {
    INDEX: '/profile',
    EDIT: '/profile/edit',
    SETTINGS: {
      APPEARANCE: '/profile/settings/appearance',
      READING: '/profile/settings/reading',
      UPDATES: '/profile/settings/updates',
      DATA: '/profile/settings/data',
      ABOUT: '/profile/settings/about',
      WEBVIEW: '/profile/settings/webview',
    },
  },
  AUTH: {
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up',
  },
} as const;
