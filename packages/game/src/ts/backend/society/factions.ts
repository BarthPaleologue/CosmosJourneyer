import { uniformRandBool } from "extended-random";

import { assertUnreachable } from "@/utils/types";

import type { StarSystemCoordinates } from "../universe/starSystemCoordinates";
import { getPowerPlayData } from "./powerplay";

export type Faction = "feynman_interstellar" | "church_of_awakening" | "human_commonwealth" | "satori_concord";

export function factionToString(faction: Faction): string {
    switch (faction) {
        case "feynman_interstellar":
            return "Feynman Interstellar";
        case "church_of_awakening":
            return "Church of Awakening";
        case "human_commonwealth":
            return "Human Commonwealth";
        case "satori_concord":
            return "Satori Concord";
        default:
            return assertUnreachable(faction);
    }
}

export function getFactionFromCoordinates(coordinates: StarSystemCoordinates, rng: (index: number) => number): Faction {
    const powerplayData = getPowerPlayData({
        x: coordinates.starSectorX,
        y: coordinates.starSectorY,
        z: coordinates.starSectorZ,
    });

    const isMaterialist = uniformRandBool(powerplayData.materialistSpiritualist, rng, 249);
    const isCapitalist = uniformRandBool(powerplayData.capitalistCommunist, rng, 498);

    if (isMaterialist && isCapitalist) {
        return "feynman_interstellar";
    } else if (isMaterialist && !isCapitalist) {
        return "human_commonwealth";
    } else if (!isMaterialist && isCapitalist) {
        return "church_of_awakening";
    } else {
        return "satori_concord";
    }
}
