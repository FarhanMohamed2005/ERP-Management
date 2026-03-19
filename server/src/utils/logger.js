const fs = require('fs');
const path = require('path');
const config = require('../config');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG',
};

// Color codes for console output
const COLOR_CODES = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m', // Reset
};

/**
 * Logger class for application logging
 * Supports both file and console logging
 */
class Logger {
  constructor() {
    this.logFile = config.logging.file || 'logs/app.log';
    this.logLevel = config.logging.level || 'info';
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ' | ' + JSON.stringify(meta) : '';
    return `[${timestamp}] [${LOG_LEVELS[level]}] ${message}${metaStr}`;
  }

  /**
   * Write log to file
   */
  writeToFile(message) {
    try {
      const logPath = path.join(__dirname, '../../', this.logFile);
      const logDir = path.dirname(logPath);

      // Ensure directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Append to log file
      fs.appendFileSync(logPath, message + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }

  /**
   * Write to console with color coding
   */
  writeToConsole(level, message) {
    const color = COLOR_CODES[level] || '';
    const reset = COLOR_CODES.reset;
    console.log(`${color}${message}${reset}`);
  }

  /**
   * Get numeric log level for comparison
   */
  getLogLevelValue(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] || 1;
  }

  /**
   * Should log based on configured level
   */
  shouldLog(level) {
    const currentLevel = this.getLogLevelValue(this.logLevel);
    const messageLevel = this.getLogLevelValue(level);
    return messageLevel >= currentLevel;
  }

  /**
   * Log error
   */
  error(message, error = null, meta = {}) {
    if (!this.shouldLog('error')) return;

    let errorDetails = {};
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        stack: config.nodeEnv === 'development' ? error.stack : undefined,
      };
    } else if (typeof error === 'object') {
      errorDetails = error;
    }

    const fullMeta = { ...meta, ...errorDetails };
    const formatted = this.formatMessage('error', message, fullMeta);

    this.writeToConsole('error', formatted);
    this.writeToFile(formatted);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;

    const formatted = this.formatMessage('warn', message, meta);

    this.writeToConsole('warn', formatted);
    this.writeToFile(formatted);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage('info', message, meta);

    this.writeToConsole('info', formatted);
    this.writeToFile(formatted);
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('debug', message, meta);

    this.writeToConsole('debug', formatted);
    this.writeToFile(formatted);
  }
}

// Export singleton instance
module.exports = new Logger();
