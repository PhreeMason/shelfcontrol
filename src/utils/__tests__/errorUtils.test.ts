import {
  isHtmlResponse,
  isAuthError,
  isNetworkError,
  isServerError,
  getUserFriendlyErrorMessage,
  classifyError,
  ERROR_MESSAGE_STRINGS,
} from '../errorUtils';

describe('errorUtils', () => {
  describe('isHtmlResponse', () => {
    it('should detect HTML response with <html> tag', () => {
      const htmlError =
        '<html><head><title>500 Internal Server Error</title></head><body>Error</body></html>';
      expect(isHtmlResponse(htmlError)).toBe(true);
    });

    it('should detect HTML response with <!DOCTYPE>', () => {
      const htmlError = '<!DOCTYPE html><html><body>Error</body></html>';
      expect(isHtmlResponse(htmlError)).toBe(true);
    });

    it('should detect HTML response case-insensitively', () => {
      const htmlError = '<HTML><HEAD><TITLE>Error</TITLE></HEAD></HTML>';
      expect(isHtmlResponse(htmlError)).toBe(true);
    });

    it('should return false for plain text errors', () => {
      expect(isHtmlResponse('Something went wrong')).toBe(false);
    });

    it('should return false for JSON-like errors', () => {
      expect(isHtmlResponse('{"error": "Not found"}')).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should detect 401 status code', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect 403 status code', () => {
      const error = { status: 403, message: 'Forbidden' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect JWT errors', () => {
      const error = new Error('JWT expired');
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect session expired errors', () => {
      const error = new Error('Session has expired');
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect invalid token errors', () => {
      const error = new Error('Invalid token provided');
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect unauthorized errors', () => {
      const error = new Error('User is unauthorized');
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect "not authenticated" errors', () => {
      const error = new Error('User not authenticated');
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect refresh token errors', () => {
      const error = new Error('Invalid refresh token');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error = new Error('Database connection failed');
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      const error = new Error('Network request failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect connection errors', () => {
      const error = new Error('Connection refused');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect timeout errors', () => {
      const error = new Error('Request timeout');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect fetch failed errors', () => {
      const error = new Error('Fetch failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect ECONNREFUSED errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect offline errors', () => {
      const error = new Error('Device is offline');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const error = new Error('Invalid input');
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should detect 500 status code', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      expect(isServerError(error)).toBe(true);
    });

    it('should detect 502 status code', () => {
      const error = { status: 502, message: 'Bad Gateway' };
      expect(isServerError(error)).toBe(true);
    });

    it('should detect 503 status code', () => {
      const error = { status: 503, message: 'Service Unavailable' };
      expect(isServerError(error)).toBe(true);
    });

    it('should detect HTML error responses as server errors', () => {
      const error = new Error(
        '<html><head><title>500 Internal Server Error</title></head></html>'
      );
      expect(isServerError(error)).toBe(true);
    });

    it('should detect "Internal Server Error" text', () => {
      const error = new Error('Internal Server Error');
      expect(isServerError(error)).toBe(true);
    });

    it('should return false for client errors', () => {
      const error = { status: 400, message: 'Bad Request' };
      expect(isServerError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return auth message for auth errors', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.auth);
      expect(getUserFriendlyErrorMessage(error)).toBe('Please sign in again to continue.');
    });

    it('should return network message for network errors', () => {
      const error = new Error('Network request failed');
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.network);
    });

    it('should return server message for server errors', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.server);
    });

    it('should return server message for HTML error responses', () => {
      const error = new Error(
        '<html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1></body></html>'
      );
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.server);
    });

    it('should return default message for unknown errors', () => {
      const error = new Error('Some random error');
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.default);
    });

    it('should handle string errors', () => {
      expect(getUserFriendlyErrorMessage('Network failed')).toBe(
        ERROR_MESSAGE_STRINGS.network
      );
    });

    it('should handle null/undefined gracefully', () => {
      expect(getUserFriendlyErrorMessage(null)).toBe(ERROR_MESSAGE_STRINGS.default);
      expect(getUserFriendlyErrorMessage(undefined)).toBe(ERROR_MESSAGE_STRINGS.default);
    });

    it('should handle Supabase-style error objects', () => {
      const error = { message: 'JWT expired', code: 'PGRST301' };
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.auth);
    });

    it('should prioritize auth errors over server errors', () => {
      // An error that contains both auth and server indicators
      const error = { status: 401, message: 'Internal Server Error' };
      expect(getUserFriendlyErrorMessage(error)).toBe(ERROR_MESSAGE_STRINGS.auth);
    });
  });

  describe('classifyError', () => {
    it('should classify auth errors', () => {
      expect(classifyError({ status: 401 })).toBe('auth');
    });

    it('should classify network errors', () => {
      expect(classifyError(new Error('Network failed'))).toBe('network');
    });

    it('should classify server errors', () => {
      expect(classifyError({ status: 500 })).toBe('server');
    });

    it('should classify unknown errors', () => {
      expect(classifyError(new Error('Something happened'))).toBe('unknown');
    });
  });

  describe('real-world error scenarios', () => {
    it('should handle Cloudflare 500 HTML error', () => {
      const cloudflareError = new Error(
        '<html><head><title>500 Internal Server Error</title></head><body><center><h1>500 Internal Server Error</h1></center><hr><center>cloudflare</center></body></html>'
      );
      expect(getUserFriendlyErrorMessage(cloudflareError)).toBe(
        ERROR_MESSAGE_STRINGS.server
      );
      expect(isHtmlResponse(cloudflareError.message)).toBe(true);
    });

    it('should handle Supabase auth error', () => {
      const supabaseAuthError = {
        message: 'Invalid Refresh Token: Refresh Token Not Found',
        status: 401,
      };
      expect(getUserFriendlyErrorMessage(supabaseAuthError)).toBe(
        ERROR_MESSAGE_STRINGS.auth
      );
    });

    it('should handle React Native fetch failure', () => {
      const fetchError = new Error('TypeError: Network request failed');
      expect(getUserFriendlyErrorMessage(fetchError)).toBe(
        ERROR_MESSAGE_STRINGS.network
      );
    });
  });
});
