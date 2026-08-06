/**
 * AppError — throw this anywhere in your app.
 * The global error handler reads statusCode, message, and isOperational.
 *
 * isOperational = true  → expected error (wrong input, not found, etc.)
 * isOperational = false → unexpected bug (programmer error)
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export interface ISessionPublic {
    sessionId: string;
    userId: string;
    user_agent: string | null;
    ip: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SessionLimitError extends AppError {
    sessions: ISessionPublic[];
    constructor(sessions: ISessionPublic[]);
}
//# sourceMappingURL=appError.d.ts.map