"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const validate = (schemas) => {
    return (req, res, next) => {
        const errors = [];
        // ─── Validate req.body ────────────────────────────────
        if (schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if (!result.success) {
                result.error.issues.forEach(err => errors.push({
                    field: `body.${err.path.join('.')}`,
                    message: err.message,
                }));
            }
            else {
                req.body = result.data; // replace with clean validated data
            }
        }
        // ─── Validate req.params ──────────────────────────────
        if (schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if (!result.success) {
                result.error.issues.forEach(err => errors.push({
                    field: `params.${err.path.join('.')}`,
                    message: err.message,
                }));
            }
        }
        // ─── Validate req.query ───────────────────────────────
        if (schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if (!result.success) {
                result.error.issues.forEach(err => errors.push({
                    field: `query.${err.path.join('.')}`,
                    message: err.message,
                }));
            }
            else {
                req.validatedQuery = result.data;
            }
        }
        // ─── If any errors — stop here ────────────────────────
        if (errors?.length > 0) {
            return ApiResponse_1.ApiResponse.error(res, 'Validation failed', 400, errors);
        }
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map