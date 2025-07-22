// Simple client-side logger utility
class ClientLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  info(message, data = {}) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data);
    }
    this._sendToServer('info', message, data);
  }

  warn(message, data = {}) {
    console.warn(`[WARN] ${message}`, data);
    this._sendToServer('warn', message, data);
  }

  error(message, data = {}) {
    console.error(`[ERROR] ${message}`, data);
    this._sendToServer('error', message, data);
  }

  debug(message, data = {}) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  _sendToServer(level, message, data) {
    // Only send error and warn logs to server in production
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      try {
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
        fetch(`${serverUrl}/api/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            level,
            message,
            context: 'client',
            meta: {
              ...data,
              userAgent: navigator.userAgent,
              url: window.location.href,
              timestamp: new Date().toISOString()
            }
          })
        }).catch(() => {
          // Silently fail if logging to server fails
        });
      } catch (error) {
        // Silently fail if logging to server fails
      }
    }
  }
}

export const logger = new ClientLogger();
