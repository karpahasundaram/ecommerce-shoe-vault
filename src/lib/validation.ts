import { z } from "zod";
import { SIZES } from "@/lib/constants";

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(40).optional().or(z.literal("")),
  full_name: z.string().min(2, "Enter a name").max(80),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Digits only"),
  line1: z.string().min(3, "Address is required").max(120),
  line2: z.string().max(120).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(60),
  state: z.string().min(2, "State is required").max(60),
  postal_code: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
  country: z.string().default("India"),
  is_default: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const profileSchema = z.object({
  full_name: z.string().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Digits only")
    .optional()
    .or(z.literal("")),
});

const variantSchema = z.object({
  size: z.enum(SIZES as [string, ...string[]]),
  stock_quantity: z.coerce.number().int().min(0).max(100000),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  category_id: z.string().uuid("Choose a category"),
  description: z.string().max(4000).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1000000),
  is_featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  variants: z.array(variantSchema).min(1, "Add at least one size"),
});

export type ProductInput = z.infer<typeof productSchema>;
