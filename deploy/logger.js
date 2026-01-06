// Logging utility for Nebraska Treatment Connect
// Provides controlled logging that can be disabled in production

// Determine if we're in development mode
function isDevelopment() {
    if (typeof window === 'undefined') return false;

    const hostname = window.location.hostname;
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname.includes('.local') ||
           hostname === '';
}

// Get log level from config or default to 'info' in dev, 'error' in prod
function getLogLevel() {
    if (window.APP_CONFIG && window.APP_CONFIG.LOG_LEVEL) {
        return window.APP_CONFIG.LOG_LEVEL;
    }
    return isDevelopment() ? 'debug' : 'error';
}

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
};

// Logger class
class Logger {
    constructor(context = '') {
        this.context = context;
        this.currentLevel = LOG_LEVELS[getLogLevel()] || LOG_LEVELS.info;
    }

    _shouldLog(level) {
        return LOG_LEVELS[level] >= this.currentLevel;
    }

    _formatMessage(message, data) {
        const timestamp = new Date().toISOString();
        const prefix = this.context ? `[${this.context}]` : '';
        return { timestamp, prefix, message, data };
    }

    debug(message, ...data) {
        if (!this._shouldLog('debug')) return;
        const formatted = this._formatMessage(message, data);
        console.log(`${formatted.timestamp} ${formatted.prefix} ${formatted.message}`, ...formatted.data);
    }

    info(message, ...data) {
        if (!this._shouldLog('info')) return;
        const formatted = this._formatMessage(message, data);
        console.info(`${formatted.timestamp} ${formatted.prefix} ${formatted.message}`, ...formatted.data);
    }

    warn(message, ...data) {
        if (!this._shouldLog('warn')) return;
        const formatted = this._formatMessage(message, data);
        console.warn(`${formatted.timestamp} ${formatted.prefix} ${formatted.message}`, ...formatted.data);
    }

    error(message, ...data) {
        if (!this._shouldLog('error')) return;
        const formatted = this._formatMessage(message, data);
        console.error(`${formatted.timestamp} ${formatted.prefix} ${formatted.message}`, ...formatted.data);
    }

    // Create a child logger with a specific context
    child(context) {
        const childContext = this.context ? `${this.context}:${context}` : context;
        return new Logger(childContext);
    }
}

// Create default logger instance
const logger = new Logger();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Logger = Logger;
    window.logger = logger;
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, logger };
}
