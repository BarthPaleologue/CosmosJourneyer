import { uniformRandBool } from "extended-random";

import type { StarSystemCoordinates } from "../universe/starSystemCoordinates";
import { getPowerPlayData } from "./powerplay";

export const enum Faction {
    FEYNMAN_INTERSTELLAR,
    CHURCH_OF_AWAKENING,
    HUMAN_COMMONWEALTH,
    SATORI_CONCORD,
}

export function factionToString(faction: Faction): string {
    switch (faction) {
        case Faction.FEYNMAN_INTERSTELLAR:
            return "Feynman Interstellar";
        case Faction.CHURCH_OF_AWAKENING:
            return "Church of Awakening";
        case Faction.HUMAN_COMMONWEALTH:
            return "Human Commonwealth";
        case Faction.SATORI_CONCORD:
            return "Satori Concord";
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
        return Faction.FEYNMAN_INTERSTELLAR;
    } else if (isMaterialist && !isCapitalist) {
        return Faction.HUMAN_COMMONWEALTH;
    } else if (!isMaterialist && isCapitalist) {
        return Faction.CHURCH_OF_AWAKENING;
    } else {
        return Faction.SATORI_CONCORD;
    }
}
