import { z } from "zod";

export const paymentResultSchema = z.object({
  id: z.string(),
  email_address: z.string(),
  status: z.string(),
  pricePaid: z.number(),
});

export type PaymentResult = z.infer<typeof paymentResultSchema>;
