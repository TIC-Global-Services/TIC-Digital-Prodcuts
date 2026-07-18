import { z } from "zod";

export const ingestPurchaseSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email(),
  }),
  order: z.object({
    orderId: z.string().trim().min(1),
    amount: z.number().positive(),
    currency: z.string().trim().min(1).max(10),
    paidAt: z.string().trim().min(1),
  }),
  payment: z.object({
    cfPaymentId: z.string().nullable().optional(),
  }),
  product: z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
});

export type IngestPurchaseInput = z.infer<typeof ingestPurchaseSchema>;
