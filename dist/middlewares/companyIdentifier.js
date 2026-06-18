"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyIdentifier = void 0;
const company_schema_1 = __importDefault(require("../module/company/company.schema"));
const appError_1 = require("./appError");
const mongoose_1 = __importDefault(require("mongoose"));
const companyIdentifier = async (req, res, next) => {
    let company = null;
    const subdomain = req.headers["x-subdomain"];
    if (subdomain) {
        company = await company_schema_1.default.findOne({
            subdomain: subdomain.toLocaleLowerCase().trim(),
            status: "active",
        })
            .select("_id company_name logo subdomain domain status")
            .lean();
    }
    if (!company) {
        const companyId = req.headers["x-company-id"];
        if (companyId && mongoose_1.default.Types.ObjectId.isValid(companyId)) {
            company = await company_schema_1.default.findOne({ _id: companyId, status: "active" })
                .select("_id company_name logo subdomain domain status")
                .lean();
        }
        console.log("companyId in req.headers", companyId);
    }
    if (!company && req.params.company_id) {
        const company = await company_schema_1.default.findOne({
            _id: req.params.company_id,
            status: "active",
        })
            .select("_id company_name logo subdomain domain status")
            .lean();
    }
    if (!company && req.headers.origin) {
        const origin = req.headers.origin;
        // res.json({"origin":origin});
        const domain = origin
            .replace(/^https?:\/\//, "") // "rubban.com"
            .replace(/:\d+$/, "") // remove port (localhost:3000 → localhost)
            .toLowerCase();
        if (domain && domain !== "localhost") {
            company = await company_schema_1.default.findOne({ domain, status: "active" })
                .select("_id company_name logo subdomain domain status")
                .lean();
        }
    }
    if (!company) {
        return next(new appError_1.AppError("Company not found. Please check your subdomain, domain or company ID.", 404));
    }
    // console.log("company", company);
    req.company = company;
    next();
};
exports.companyIdentifier = companyIdentifier;
//# sourceMappingURL=companyIdentifier.js.map