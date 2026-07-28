// src/module/purchase/purchase.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AUDIT_ACTIONS } from "../audit/audit.interface";
import * as PurchaseService from "./purchase.service";
import { auditLog } from "../../utils/auditLogger";
import mongoose from "mongoose";
import { CreatePurchaseInput, ListPurchaseQuery } from "./purchase.validation";

// ─── Create ───────────────────────────────────────────────
export const createPurchase = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
    const createdBy = new mongoose.Types.ObjectId(req.user._id!);
    const purchase = await PurchaseService.createPurchase(
      { ...(req.body as CreatePurchaseInput), sellerId, createdBy },
      req,
    );

    return ApiResponse.created(res, purchase, "Purchase created successfully");
  },
);

// ─── Get all ──────────────────────────────────────────────
export const getPurchases = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);

    const query = req.validatedQuery as {
      page: number;
      limit: number;
      vendorId?: string;
      status?: "pending" | "partial" | "paid";
      fromDate?: Date;
      toDate?: Date;
      sortOrder: string;
    };

    const { purchases, total } = await PurchaseService.getPurchases(
      sellerId,
      req.validatedQuery as ListPurchaseQuery,
    );

    return ApiResponse.paginated(
      res,
      "Purchase get successfully!",
      purchases,
      total,
      query.page,
      query.limit,
    );
  },
);

// ─── Get one ──────────────────────────────────────────────
export const getPurchaseById = asyncHandler(
  async (req: Request, res: Response) => {
    const purchase = await PurchaseService.getPurchaseById({
      id: req.params.id as string,
      sellerId: req.user.sellerId!,
    });

    return ApiResponse.success(res, purchase);
  },
);
export const updatePayment = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
    const updatedPurchase = await PurchaseService.updatePayment(
      req.params.id as string,
      sellerId,
      req.body,
      req,
    );
    return ApiResponse.success(
      res,
      updatedPurchase,
      "Purchase payment updated successfully",
    );
  },
);

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
  await PurchaseService.deletePurchase(
    req.params.id as string,
    sellerId,
    req,
  );
  return ApiResponse.success(res, null, "Purchase deleted successfully");
});

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  // const sellerId = new mongoose.Types.ObjectId(req.user.sellerId!);
  const result = await PurchaseService.updateStock(req);
  return ApiResponse.success(res, result, "Purchase deleted successfully");
});
