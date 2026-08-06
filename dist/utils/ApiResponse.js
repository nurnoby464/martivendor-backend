"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message = "Success", statusCode = 200, meta) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            ...(meta !== undefined && { meta }),
        });
    }
    static created(res, data, message = "Created successfully") {
        return res.status(201).json({
            success: true,
            message,
            data,
        });
    }
    static error(res, message = "Something went wrong", statusCode = 500, errors) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors: Array.isArray(errors) ? errors : null,
        });
    }
    static paginated(res, message = "Data fetched successfully", data, total, page, limit, meta) {
        const safeLimit = limit || 1;
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / safeLimit),
                hasNext: page < Math.ceil(total / safeLimit),
                hasPrev: page > 1,
            },
            ...(meta !== undefined && { meta }),
        });
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=ApiResponse.js.map