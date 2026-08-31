import { z } from "zod";
const nullableString = z.string().nullable();
export const SimbadRowSchema = z.object({
    input_id: z.string().min(1),
    main_id: z.string().min(1),
    ids: z.array(z.string()),
    spectral_type: nullableString,
    object_type: nullableString,
    effective_temperature: z.number().nullable(),
});
export type SimbadRow = z.infer<typeof SimbadRowSchema>;
