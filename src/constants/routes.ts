export const ROUTES = {
  HOME: '/',
  PROFILE: {
    INDEX: '/profile',
    EDIT: '/profile/edit',
  },
  AUTH: {
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up',
    RESET_PASSWORD_REQUEST: '/reset-password-request',
    RESET_PASSWORD_UPDATE: '/reset-password-update',
  },
} as const;
