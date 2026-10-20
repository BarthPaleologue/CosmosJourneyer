import type { SimbadMetadata } from "./metadata";
export type StarNature = "main-sequence" | "white-dwarf" | "neutron-star" | "black-hole";
/**
 * Classifies a star from its SIMBAD object and spectral types.
 * @param metadata SIMBAD metadata for the star, when available.
 * @returns The inferred stellar nature, defaulting to main sequence when unknown.
 */
export function classifyStar(metadata: SimbadMetadata | undefined): StarNature {
    if (metadata === undefined) {
        return "main-sequence";
    }
    const objectType = (metadata.objectType ?? "").toUpperCase();
    const spectralType = (metadata.spectralType ?? "").toUpperCase();
    if (objectType.includes("WD") || spectralType.startsWith("D")) {
        return "white-dwarf";
    }
    if (
        objectType.includes("NS") ||
        objectType.includes("XNS") ||
        objectType.includes("PSR") ||
        spectralType.startsWith("NS")
    ) {
        return "neutron-star";
    }
    if (objectType.includes("BH") || objectType.includes("XRB") || objectType.includes("XB?")) {
        return "black-hole";
    }
    return "main-sequence";
}
