"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLimitError = exports.AppError = void 0;
/**
 * AppError — throw this anywhere in your app.
 * The global error handler reads statusCode, message, and isOperational.
 *
 * isOperational = true  → expected error (wrong input, not found, etc.)
 * isOperational = false → unexpected bug (programmer error)
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Keeps the prototype chain intact for instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);
        // Removes AppError constructor from the stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class SessionLimitError extends AppError {
    sessions;
    constructor(sessions) {
        super("Session limit reached. Please remove a session to continue.", 409);
        this.sessions = sessions;
    }
}
exports.SessionLimitError = SessionLimitError;
//# sourceMappingURL=appError.js.map