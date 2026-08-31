import { readFile } from "node:fs/promises";

import { z } from "zod";

export const TemperatureMin = 800;
export const TemperatureMax = 40000;
export const MainSequenceTemperatureMin = 900;
export const MainSequenceTemperatureMax = 10000;
export const WhiteDwarfTemperatureMin = 2500;
const StarSchema = z.object({
    name: z.string(),
    relative_position: z.tuple([z.number(), z.number(), z.number()]),
    temperature: z.number().nullable(),
    nature: z.enum(["main-sequence", "white-dwarf", "neutron-star", "black-hole"]).nullable(),
});
export const DatasetSchema = z.object({
    metadata: z.record(z.string(), z.unknown()),
    selection: z.record(z.string(), z.unknown()).optional(),
    cubes: z.record(
        z.string(),
        z.object({
            index: z.tuple([z.number(), z.number(), z.number()]),
            origin: z.tuple([z.number(), z.number(), z.number()]),
            stars: z.array(StarSchema),
        }),
    ),
});
export type ValidationResult = Readonly<{
    success: boolean;
    schemaIssues: ReadonlyArray<string>;
    issues: ReadonlyArray<string>;
}>;
type ValidatedStar = z.infer<typeof StarSchema>;
function validateStar(star: ValidatedStar, cubeId: string): ReadonlyArray<string> {
    const issues: string[] = [];
    if (star.nature === null) {
        issues.push(`Missing nature for ${star.name} in cube ${cubeId}`);
    }
    if (star.temperature === null) {
        issues.push(`Missing temperature for ${star.name} in cube ${cubeId}`);
        return issues;
    }
    if (star.temperature < TemperatureMin || star.temperature > TemperatureMax) {
        issues.push(`Temperature ${star.temperature}K out of bounds for ${star.name} in cube ${cubeId}`);
    }
    if (
        star.nature === "main-sequence" &&
        (star.temperature < MainSequenceTemperatureMin || star.temperature > MainSequenceTemperatureMax)
    ) {
        issues.push(
            `Main-sequence star ${star.name} has suspicious temperature ${star.temperature}K in cube ${cubeId}`,
        );
    }
    if (star.nature === "white-dwarf" && star.temperature < WhiteDwarfTemperatureMin) {
        issues.push(`White dwarf ${star.name} has low temperature ${star.temperature}K in cube ${cubeId}`);
    }
    return issues;
}
export function validateDataset(input: unknown): ValidationResult {
    const parsed = DatasetSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            schemaIssues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
            issues: [],
        };
    }
    const issues = Object.entries(parsed.data.cubes).flatMap(([cubeId, cube]) =>
        cube.stars.flatMap((star) => validateStar(star, cubeId)),
    );
    if (Object.keys(parsed.data.metadata).length === 0) {
        issues.push("Missing metadata block");
    }
    return { success: issues.length === 0, schemaIssues: [], issues };
}
export async function validateFile(path: string): Promise<ValidationResult> {
    return validateDataset(JSON.parse(await readFile(path, "utf8")) as unknown);
}
