import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { getNeighborStarSystems } from "../../utils/getNeighborStarSystems";
import { SeededStarSystemModel } from "../../starSystem/seededStarSystemModel";
import { placeSpaceStations } from "../../society/spaceStationPlacement";
import { getSpaceStationSeed } from "../../planets/common";
import { parseDistance } from "../../utils/parseToStrings";
import { Settings } from "../../settings";
import { uniformRandBool } from "extended-random";
import { BodyType } from "../../architecture/bodyType";

export function generateMissionsHTML(stationModel: SpaceStationModel) {
    const starSystem = stationModel.starSystem;
    if (!(starSystem instanceof SeededStarSystemModel)) {
        throw new Error("Star system is not seeded, hence missions cannot be generated");
    }
    const neighborSystems = getNeighborStarSystems(starSystem.seed, 75);

    const systemsWithAnomalies: [SeededStarSystemModel, number][] = [];
    const systemsWithNeutronStars: [SeededStarSystemModel, number][] = [];
    const systemsWithBlackHoles: [SeededStarSystemModel, number][] = [];

    let neighborSpaceStations: [SpaceStationModel, number][] = [];
    neighborSystems.forEach(([seed, coordinates, distance], index) => {
        const systemModel = new SeededStarSystemModel(seed);
        if(systemModel.getNbAnomalies() > 0 && uniformRandBool(1.0 / (1.0 + 0.4 * distance), systemModel.rng, 6254 + index)) {
            systemsWithAnomalies.push([systemModel, distance]);
        }

        if(systemModel.getStellarObjects().find(([bodyType, seed]) => bodyType === BodyType.NEUTRON_STAR)) {
            systemsWithNeutronStars.push([systemModel, distance]);
        }

        if(systemModel.getStellarObjects().find(([bodyType, seed]) => bodyType === BodyType.BLACK_HOLE)) {
            systemsWithBlackHoles.push([systemModel, distance]);
        }

        const spaceStationParents = placeSpaceStations(systemModel);
        const spaceStations = spaceStationParents.map<[SpaceStationModel, number]>((planet) => {
            return [new SpaceStationModel(getSpaceStationSeed(planet, 0), systemModel, planet), distance];
        });
        neighborSpaceStations = neighborSpaceStations.concat(spaceStations);
    });

    systemsWithAnomalies.sort((a, b) => a[1] - b[1]);
    systemsWithNeutronStars.sort((a, b) => a[1] - b[1]);
    systemsWithBlackHoles.sort((a, b) => a[1] - b[1]);

    const contactStations = neighborSpaceStations
        // prune list randomly based on distance
        .filter(([station, distance], index) => uniformRandBool(1.0 / (1.0 + 0.02 * (distance * distance)), stationModel.rng, 325 + index))
        // filter out stations of the same faction
        .filter(([station, distance]) => station.faction === stationModel.faction);
    contactStations.sort((a, b) => a[1] - b[1]);

    return `
        <h2>Missions</h2>
        
        <h3>Exploration</h3>
        
        ${systemsWithNeutronStars
        .map(([system, distance]) => {
            return `<div class="missionItem">
                    <p>Visit the neutron star in ${system.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})</p>
                    </div>`;
        }).join("")}
        
        ${systemsWithBlackHoles
        .map(([system, distance]) => {
            return `<div class="missionItem">
                    <p>Visit the black hole in ${system.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})</p>
                    </div>`;
        }).join("")}
        
        ${systemsWithAnomalies
        .map(([system, distance]) => {
            return `<div class="missionItem">
                    <p>Go investigate the anomaly in ${system.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})</p>
                    </div>`;
        }).join("")}
        
        <h3>Terraformation</h3>
        
        <h3>Trading</h3>
        
        ${contactStations.map(([station, distance]) => `${station.name} in ${station.starSystem.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})`).join("<br>")}
    `;
}
