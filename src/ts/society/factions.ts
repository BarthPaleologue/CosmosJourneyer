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
