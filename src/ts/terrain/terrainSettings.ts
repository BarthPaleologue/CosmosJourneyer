// Interface ayant vocation à remplacer toutes les interfaces de paramétrisation du terrain

export interface TerrainSettings {
    continentsFrequency: number;
    continentsFragmentation: number; // entre 0 et 1 : 0=pangée 1=ilots
    continentBaseHeight: number; // élévation du plateau continental

    maxMountainHeight: number;
    mountainsFrequency: number;
    mountainsMinValue: number;

    maxBumpHeight: number;
    bumpsFrequency: number;
}
