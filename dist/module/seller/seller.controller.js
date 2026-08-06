"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyControllers = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const seller_service_1 = require("./seller.service");
const ApiResponse_1 = require("../../utils/ApiResponse");
const mongoose_1 = require("mongoose");
const createCompanyUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await seller_service_1.CompanyServices.createCompanyUser(req.body, req);
    return ApiResponse_1.ApiResponse.created(res, user, "Company user created successfully");
});
const getAllUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, page, limit, total } = await seller_service_1.CompanyServices.getAllUsers(req.validatedQuery, req);
    return ApiResponse_1.ApiResponse.paginated(res, "User fetch successfully", user, total, page, limit);
    // return ApiResponse.success(res, result, "Users fetched successfully");
});
const getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await seller_service_1.CompanyServices.getUserById(req.params.id, req);
    return ApiResponse_1.ApiResponse.success(res, result, "User fetched successfully");
});
const updateUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await seller_service_1.CompanyServices.updateUser(req.params.id, req.body, req);
    return ApiResponse_1.ApiResponse.success(res, result, "User updated successfully");
});
const deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await seller_service_1.CompanyServices.deleteUser(req.params.id, req);
    return ApiResponse_1.ApiResponse.success(res, null, "User deleted successfully");
});
const getMyCompany = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.company?._id;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Company is required");
    }
    const result = await seller_service_1.CompanyServices.getMyCompany(sellerId);
    return ApiResponse_1.ApiResponse.success(res, result, "My company info fetch successfully");
});
const updateMyCompany = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Company is required");
    }
    const result = await seller_service_1.CompanyServices.updateMyCompany(sellerId, req.body);
    return ApiResponse_1.ApiResponse.success(res, result, "My company info fetch successfully");
});
const updateSocialMedia = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed, Company id is required");
    }
    const data = req.body;
    const updated = await seller_service_1.CompanyServices.updateSocialMedia(sellerId, data);
    return ApiResponse_1.ApiResponse.success(res, updated, "Social media updated successfully");
});
const createHeaderNav = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed, Company id is required");
    }
    const result = await seller_service_1.CompanyServices.createHeaderNav(sellerId, req.body);
    return ApiResponse_1.ApiResponse.created(res, result, "Nav items created successfully");
});
const getHeaderNav = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.company?._id;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed, Company id is required");
    }
    const result = await seller_service_1.CompanyServices.getHeaderNav(sellerId);
    return ApiResponse_1.ApiResponse.success(res, result, "Nav items fetched successfully");
});
const reOrderHeaderNav = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed, Company id is required");
    }
    const navConfigId = req.params.id;
    const result = await seller_service_1.CompanyServices.reOrderHeaderNav(sellerId, new mongoose_1.Types.ObjectId(navConfigId), req.body);
    return ApiResponse_1.ApiResponse.success(res, result, "Nav items reorder successfully");
});
const updateHeaderNav = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed, Company id is required");
    }
    const navId = req.params.id;
    const result = await seller_service_1.CompanyServices.updateHeaderNav(sellerId, new mongoose_1.Types.ObjectId(navId), req.body);
    return ApiResponse_1.ApiResponse.success(res, result, "Nav items deleted successfully");
});
const deleteHeaderNav = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sellerId = req.user.sellerId;
    if (!sellerId) {
        return ApiResponse_1.ApiResponse.error(res, "Failed, Company id is required");
    }
    const payload = {
        id: req.params.id,
        navItemId: req.params.navItemId,
    };
    const result = await seller_service_1.CompanyServices.deleteHeaderNav(sellerId, payload);
    return ApiResponse_1.ApiResponse.success(res, result, "Nav items deleted successfully");
});
exports.CompanyControllers = {
    createCompanyUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getMyCompany,
    updateMyCompany,
    updateSocialMedia,
    createHeaderNav,
    getHeaderNav,
    deleteHeaderNav,
    updateHeaderNav,
    reOrderHeaderNav,
};
//# sourceMappingURL=seller.controller.js.map