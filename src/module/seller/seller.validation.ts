import z, { email } from "zod";

export const createNewCompanySchema = z.object({
  company_name: z
    .string({ error: "Company name is required" })
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name cannot exceed 200 characters"),

  company_email: z.email("Please enter a valid email").toLowerCase().trim(),
  phone: z
    .string({ error: "Phone number is required" })
    .trim()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^\+?[0-9\s\-().]+$/, "Please enter a valid phone number"),
  address: z
    .string({ error: "Address is required" })
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address cannot exceed 500 characters"),

  logo: z.string().url("Logo must be a valid URL").nullable().optional(),

  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/,
      "Please enter a valid domain (e.g. fashionzone.com.bd)",
    )
    .nullable()
    .optional(),

  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers and hyphens",
    )
    .min(2, "Subdomain must be at least 2 characters")
    .max(63, "Subdomain cannot exceed 63 characters")
    .nullable()
    .optional(),
  status: z
    .enum(["active", "inactive", "suspended"], {
      message: "Invalid status value",
    })
    .default("active"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createCompanyUserSchema = z.object({
  companyId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid company id")
    .optional(),

  email: z.email("Please enter a valid email").toLowerCase().trim(),
  // phone: z
  //   .string({ error: "Phone number is required" })
  //   .trim()
  //   .min(7, "Phone number is too short")
  //   .max(20, "Phone number is too long")
  //   .regex(/^\+?[0-9\s\-().]+$/, "Please enter a valid phone number"),
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(500, "Name cannot exceed 500 characters"),

  role: z.enum(["report", "sales", "inventory", "site_management", "account"], {
    message: "Invalid role value",
  }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export const companyParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid company id"),
});

export const companyQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(parseInt(v ?? "10"), 200)),
  sortBy: z.string().optional(),
  sortOrder: z
    .string()
    .optional()
    .transform((v) => (v === "asc" ? 1 : -1)),
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const updateCompanySchema = z.object({
  company_name: z.string().trim().min(2).max(200).optional(),
  companyNavName: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  address: z.string().trim().min(5).max(500).optional(),
  logo: z.string().url("Logo must be a valid URL").nullable().optional(),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, "Invalid domain")
    .nullable()
    .optional(),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers and hyphens",
    )
    .min(2)
    .max(63)
    .nullable()
    .optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");

export const userQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(parseInt(v ?? "10"), 100)),
  search: z.string().trim().optional(),
  role: z
    .enum([
      "admin",
      "account",
      "site_management",
      "inventory",
      "sales",
      "report",
    ])
    .optional(),
  is_active: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    }),
  sortBy: z
    .enum(["name", "email", "createdAt", "role"])
    .optional()
    .default("createdAt"),
  sortOrder: z
    .string()
    .optional()
    .transform((v) => (v === "asc" ? 1 : -1)),
  sellerId: objectIdSchema.optional(), // super_admin can filter by company
});

// ─── Params schema ────────────────────────────────────────
export const userParamsSchema = z.object({
  id: objectIdSchema,
});
// ─── Update user schema ───────────────────────────────────
export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  is_active: z.boolean().optional(),

  // only super_admin can change role — enforced in service
  role: z
    .enum([
      "admin",
      "account",
      "site_management",
      "inventory",
      "sales",
      "report",
    ])
    .optional(),
});

const urlOrEmpty = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .or(z.literal(""))
  .nullable()
  .optional();

export const updateSocialMediaSchema = z.object({
  social_media: z
    .object({
      facebook: urlOrEmpty,
      instagram: urlOrEmpty,
      twitter: urlOrEmpty,
      youtube: urlOrEmpty,
      tiktok: urlOrEmpty,
      linkedin: urlOrEmpty,
      whatsapp: urlOrEmpty,
      pinterest: urlOrEmpty,
      website: urlOrEmpty,
    })
    .optional(),
});

export type UpdateSocialMediaInput = z.infer<typeof updateSocialMediaSchema>;

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateCompanyInput = z.infer<typeof createNewCompanySchema>;
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;
export type CompanyUserInput = z.infer<typeof createCompanyUserSchema>;
