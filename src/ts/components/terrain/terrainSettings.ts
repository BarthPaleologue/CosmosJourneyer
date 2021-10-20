// Interface ayant vocation à remplacer toutes les interfaces de paramétrisation du terrain

export interface TerrainSettings {
    continentsFragmentation: number; // entre 0 et 1 : 0=pangée 1=ilots

    maxMountainHeight: number;
    mountainsFrequency: number;

    maxBumpHeight: number;
    bumpsFrequency: number;
}