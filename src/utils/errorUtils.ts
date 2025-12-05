/**
 * Error Utilities
 *
 * Centralized error handling, detection, and user-friendly message mapping.
 * Ensures users never see raw HTML error responses or technical error messages.
 */

// User-friendly error messages
// Note: Auth errors will first trigger an automatic token refresh.
// Users only see the auth message if the refresh token itself has expired.
const ERROR_MESSAGES = {
  auth: 'Please sign in again to continue.',
  network: 'Unable to connect. Check your connection and try again.',
  server: 'Something went wrong. Please try again later.',
  default: 'An unexpected error occurred. Please try again.',
} as const;

// Auth error patterns to detect
const AUTH_ERROR_PATTERNS = [
  '401',
  '403',
  'jwt',
  'token',
  'session',
  'unauthorized',
  'not authenticated',
  'invalid token',
  'expired',
  'auth',
  'unauthenticated',
  'invalid refresh token',
  'refresh token not found',
] as const;

// Network error patterns to detect
const NETWORK_ERROR_PATTERNS = [
  'network',
  'connection',
  'timeout',
  'fetch failed',
  'econnrefused',
  'enotfound',
  'socket',
  'etimedout',
  'econnreset',
  'offline',
  'internet',
] as const;

// Server error patterns to detect
const SERVER_ERROR_PATTERNS = [
  '500',
  '502',
  '503',
  '504',
  'internal server error',
  'bad gateway',
  'service unavailable',
  'gateway timeout',
] as const;

/**
 * Gets the error message string from various error types
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    // Handle Supabase/PostgrestError format
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    // Handle error objects with code
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
  }
  return '';
};

/**
 * Gets the error status code if available
 */
const getErrorStatusCode = (error: unknown): number | null => {
  if (error && typeof error === 'object') {
    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }
    if ('code' in error && typeof error.code === 'number') {
      return error.code;
    }
  }
  return null;
};

/**
 * Checks if a string contains HTML content
 */
export const isHtmlResponse = (message: string): boolean => {
  const htmlPatterns = [
    '<html',
    '<!doctype',
    '<head>',
    '<body>',
    '</html>',
    '<title>',
  ];
  const lowerMessage = message.toLowerCase();
  return htmlPatterns.some(pattern => lowerMessage.includes(pattern));
};

/**
 * Checks if the error is an authentication/authorization error
 */
export const isAuthError = (error: unknown): boolean => {
  const statusCode = getErrorStatusCode(error);
  if (statusCode === 401 || statusCode === 403) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return AUTH_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

/**
 * Checks if the error is a network/connection error
 */
export const isNetworkError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return NETWORK_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

/**
 * Checks if the error is a server error (5xx)
 */
export const isServerError = (error: unknown): boolean => {
  const statusCode = getErrorStatusCode(error);
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();

  // Check for HTML responses (often server errors)
  if (isHtmlResponse(message)) {
    return true;
  }

  return SERVER_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

/**
 * Gets a user-friendly error message based on the error type.
 * Never returns raw error messages or HTML content.
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  // Check error types in order of specificity
  if (isAuthError(error)) {
    return ERROR_MESSAGES.auth;
  }

  if (isNetworkError(error)) {
    return ERROR_MESSAGES.network;
  }

  if (isServerError(error)) {
    return ERROR_MESSAGES.server;
  }

  // Check if the raw message is HTML (shouldn't be shown to users)
  const message = getErrorMessage(error);
  if (isHtmlResponse(message)) {
    return ERROR_MESSAGES.server;
  }

  return ERROR_MESSAGES.default;
};

/**
 * Type for error classification results
 */
export type ErrorType = 'auth' | 'network' | 'server' | 'unknown';

/**
 * Classifies an error into a category
 */
export const classifyError = (error: unknown): ErrorType => {
  if (isAuthError(error)) return 'auth';
  if (isNetworkError(error)) return 'network';
  if (isServerError(error)) return 'server';
  return 'unknown';
};

/**
 * Export error messages for testing
 */
export const ERROR_MESSAGE_STRINGS = ERROR_MESSAGES;
