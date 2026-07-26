import mongoose from "mongoose";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as StaffServices from "./staff.service";
import { Request, Response } from "express";
import { AppError } from "../../middlewares/appError";
import { GetCustomerQuery } from "./staff.validation";

export const getCustomerList = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.company?._id;
  if(!companyId){
    throw new AppError("Company not found",404);
  }
  
  
  const result = await StaffServices.getCustomerList(req.validatedQuery as GetCustomerQuery,companyId);
  return ApiResponse.created(res, result, "sales created successfully");
});
