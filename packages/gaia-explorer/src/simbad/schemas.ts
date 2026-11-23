import { z } from "zod";

const nullableTextColumn = z
    .string()
    .optional()
    .transform((value): string | null => {
        const text = value?.trim() ?? "";
        return text === "" ? null : text;
    });

const nullableNumberColumn = z
    .string()
    .optional()
    .transform((value): number | null => {
        const text = value?.trim() ?? "";
        return text === "" ? null : Number(text);
    })
    .pipe(z.number().nullable());

const identifierListColumn = z
    .string()
    .optional()
    .transform((value) => (value ?? "").split("|").filter((identifier) => identifier !== ""));

export const SimbadRowSchema = z.object({
    input_id: z.string().min(1),
    main_id: z.string().min(1),
    ids: identifierListColumn,
    spectral_type: nullableTextColumn,
    object_type: nullableTextColumn,
    effective_temperature: nullableNumberColumn,
});
export type SimbadRow = z.infer<typeof SimbadRowSchema>;
