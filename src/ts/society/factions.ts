import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { uniformRandBool } from "extended-random";

import { getPowerPlayData } from "./powerplay";

export const enum Faction {
    FEYNMAN_INTERSTELLAR,
    CHURCH_OF_AWAKENING,
    HUMAN_COMMONWEALTH,
    SATORI_CONCORD
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

export function getFactionFromGalacticPosition(starSystemPosition: Vector3, rng: (index: number) => number): Faction {
    const powerplayData = getPowerPlayData(starSystemPosition);

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
