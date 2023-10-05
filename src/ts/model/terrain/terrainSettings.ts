// Interface ayant vocation à remplacer toutes les interfaces de paramétrisation du terrain

export interface TerrainSettings {
    continents_frequency: number;
    continents_fragmentation: number; // entre 0 et 1 : 0=pangée 1=ilots
    continent_base_height: number; // élévation du plateau continental

    max_mountain_height: number;
    mountains_frequency: number;

    max_bump_height: number;
    bumps_frequency: number;
}
