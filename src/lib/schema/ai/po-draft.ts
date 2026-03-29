import { z } from "zod";

export const poDraftItemSchema = z.object({
    description: z.string().min(1),
    qty: z.number().nullable(),
    unitPrice: z.number().nullable(),
    amount: z.number().nullable(),
    /** Linked merchant product (optional; empty = custom line). */
    productId: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    /** Quick naming / spec keyword (filters search; optional). */
    nameEntryHint: z.string().nullable().optional(),
});

export const poDraftSchema = z.object({
    documentType: z.enum(["receipt", "invoice", "unknown"]),
    vendorName: z.string().nullable(),
    documentNumber: z.string().nullable(),
    documentDate: z.string().nullable(),
    currency: z.string().nullable(),
    subtotal: z.number().nullable(),
    tax: z.number().nullable(),
    total: z.number().nullable(),
    items: z.array(poDraftItemSchema),
    warnings: z.array(z.string()),
    confidence: z.number(),
    rawSummary: z.string(),
});

export type PoDraft = z.infer<typeof poDraftSchema>;
