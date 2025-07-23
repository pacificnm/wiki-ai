// Browser-compatible client-side logger utility
/* eslint-disable no-console */

class ClientLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  _formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const meta = {
      service: 'wiki-ai-client',
      context: 'client',
      timestamp,
      ...data
    };

    if (this.isDevelopment) {
      return { level, message, meta, timestamp };
    }
    return { level, message, meta };
  }

  _shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.logLevel] || 1;
    return levels[level] <= currentLevel;
  }

  _logToConsole(level, message, data) {
    if (!this.isDevelopment) return;

    const formatted = this._formatMessage(level, message, data);
    const style = {
      error: 'color: #ef4444; font-weight: bold',
      warn: 'color: #f59e0b; font-weight: bold',
      info: 'color: #3b82f6; font-weight: bold',
      debug: 'color: #6b7280; font-weight: normal'
    };

    console.groupCollapsed(`%c[${level.toUpperCase()}] ${message}`, style[level]);
    if (Object.keys(data).length > 0) {
      console.log('Data:', data);
    }
    console.log('Timestamp:', formatted.timestamp);
    console.groupEnd();
  }

  info(message, data = {}) {
    if (this._shouldLog('info')) {
      this._logToConsole('info', message, data);
    }
    this._sendToServer('info', message, data);
  }

  warn(message, data = {}) {
    if (this._shouldLog('warn')) {
      this._logToConsole('warn', message, data);
    }
    this._sendToServer('warn', message, data);
  }

  error(message, data = {}) {
    if (this._shouldLog('error')) {
      this._logToConsole('error', message, data);
    }
    this._sendToServer('error', message, data);
  }

  debug(message, data = {}) {
    if (this._shouldLog('debug')) {
      this._logToConsole('debug', message, data);
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
