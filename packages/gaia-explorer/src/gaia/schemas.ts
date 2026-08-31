import { z } from "zod";
const nullableNumber = z.union([z.number(), z.null()]);
export const GaiaRowSchema = z.object({
    source_id: z.string().regex(/^\d+$/),
    designation: z.string().nullable(),
    ra: z.number(),
    dec: z.number(),
    parallax: nullableNumber,
    parallax_over_error: nullableNumber,
    ruwe: nullableNumber,
    bp_rp: nullableNumber,
    teff_k: nullableNumber,
});
export type GaiaRow = z.infer<typeof GaiaRowSchema>;
