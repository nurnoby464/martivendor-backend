// import { Request, Response, NextFunction } from "express";
// import { AppError } from "./appError";
// import mongoose from "mongoose";
// import { Seller } from "../module/seller/seller.schema";

// export const companyIdentifier = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   let company = null;
//   const subdomain = req.headers["x-subdomain"] as string | undefined;

//   if (subdomain) {
//     company = await Seller.findOne({
//       subdomain: subdomain.toLocaleLowerCase().trim(),
//       status: "active",
//     })
//       .select("_id company_name logo subdomain domain status")
//       .lean<any>();
//   }
//   if (!company) {
//     const companyId = req.headers["x-company-id"] as string | undefined;
//     if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
//       company = await Seller.findOne({ _id: companyId, status: "active" })
//         .select("_id company_name logo subdomain domain status")
//         .lean<any>();
//     }
//   }

//   if (!company && req.params.sellerId) {
//     const company = await Seller.findOne({
//       _id: req.params.sellerId,
//       status: "active",
//     })
//       .select("_id company_name logo subdomain domain status")
//       .lean<any>();
//   }

//   if (!company && req.headers.origin) {
//     const origin = req.headers.origin;
//     // res.json({"origin":origin});
//     const domain = origin
//       .replace(/^https?:\/\//, "") // "rubban.com"
//       .replace(/:\d+$/, "") // remove port (localhost:3000 → localhost)
//       .toLowerCase();
//     if (domain && domain !== "localhost") {
//       company = await Seller.findOne({ domain, status: "active" })
//         .select("_id company_name logo subdomain domain status")
//         .lean<any>();
//     }
//   }
//   if (!company) {
//     return next(
//       new AppError(
//         "Company not found. Please check your subdomain, domain or company ID.",
//         404,
//       ),
//     );
//   }
//   // console.log("company", company);
//   req.company = company;
//   next();
// };
