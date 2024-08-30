import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { getNeighborStarSystems } from "../../utils/getNeighborStarSystems";
import { SeededStarSystemModel } from "../../starSystem/seededStarSystemModel";
import { parseDistance } from "../../utils/parseToStrings";
import { Settings } from "../../settings";
import { uniformRandBool } from "extended-random";
import { getSpaceStationModels } from "../../utils/getModelsFromSystemModel";
import { generateSightseeingMissions } from "../../missions/generator";
import { getStarGalacticCoordinates } from "../../utils/getStarGalacticCoordinates";

export function generateMissionsHTML(stationModel: SpaceStationModel) {
    const sightSeeingMissions = generateSightseeingMissions(stationModel, Date.now());

    const starSystem = stationModel.starSystem;
    if (!(starSystem instanceof SeededStarSystemModel)) {
        throw new Error("Star system is not seeded, hence missions cannot be generated");
    }
    const starSystemPosition = getStarGalacticCoordinates(starSystem.seed);
    const neighborSystems = getNeighborStarSystems(starSystem.seed, 75);

    let neighborSpaceStations: [SpaceStationModel, number][] = [];
    neighborSystems.forEach(([seed, coordinates, distance], index) => {
        const systemModel = new SeededStarSystemModel(seed);
        const spaceStations = getSpaceStationModels(systemModel).map<[SpaceStationModel, number]>((stationModel) => {
            return [stationModel, distance];
        });
        neighborSpaceStations = neighborSpaceStations.concat(spaceStations);
    });

    const contactStations = neighborSpaceStations
        // prune list randomly based on distance
        .filter(([station, distance], index) => uniformRandBool(1.0 / (1.0 + 0.02 * (distance * distance)), stationModel.rng, 325 + index))
        // filter out stations of the same faction
        .filter(([station, distance]) => station.faction === stationModel.faction);
    contactStations.sort((a, b) => a[1] - b[1]);

    return `
        <h2>Missions</h2>
        
        <h3>Exploration</h3>
        
        ${sightSeeingMissions
            .map((mission) => {
                return `<div class="missionItem">
                    <p>${mission.describe()}</p>
                    </div>`;
            })
            .join("")}
        
        <h3>Terraformation</h3>
        
        <h3>Trading</h3>
        
        ${contactStations.map(([station, distance]) => `${station.name} in ${station.starSystem.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})`).join("<br>")}
    `;
}
