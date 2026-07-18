import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
