import { z } from "zod";

export const TvaRateSchema = z.union([z.literal(5.5), z.literal(10), z.literal(20)]);
export type TvaRate = z.infer<typeof TvaRateSchema>;