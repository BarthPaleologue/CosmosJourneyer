import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { getNeighborStarSystemCoordinates } from "../../utils/getNeighborStarSystems";
import { parseDistance } from "../../utils/parseToStrings";
import { Settings } from "../../settings";
import { uniformRandBool } from "extended-random";
import { generateSightseeingMissions } from "../../missions/generateSightSeeingMissions";
import { Player } from "../../player/player";
import { MissionContainer } from "./missionContainer";

import { getRngFromSeed } from "../../utils/getRngFromSeed";
import { getSystemModelFromCoordinates } from "../../starSystem/modelFromCoordinates";
import { StarSystemModelUtils } from "../../starSystem/starSystemModel";

/**
 * Generates all missions available at the given space station for the player. Missions are generated based on the current timestamp (hourly basis).
 * @param stationModel The space station model where the missions are generated
 * @param player The player for which the missions are generated
 * @returns The DOM element containing the generated missions as HTML
 */
export function generateMissionsDom(stationModel: SpaceStationModel, player: Player): HTMLDivElement {
    const starSystemModel = getSystemModelFromCoordinates(stationModel.starSystemCoordinates);
    const sightSeeingMissions = generateSightseeingMissions(stationModel, starSystemModel, player, Date.now());

    const starSystem = starSystemModel;
    const neighborSystems = getNeighborStarSystemCoordinates(starSystem.coordinates, 75);

    const rng = getRngFromSeed(stationModel.seed);

    let neighborSpaceStations: [SpaceStationModel, number][] = [];
    neighborSystems.forEach(([coordinates, position, distance], index) => {
        const systemModel = getSystemModelFromCoordinates(coordinates);
        const spaceStations = StarSystemModelUtils.GetSpaceStations(systemModel).map<[SpaceStationModel, number]>((stationModel) => {
            return [stationModel, distance];
        });
        neighborSpaceStations = neighborSpaceStations.concat(spaceStations);
    });

    const contactStations = neighborSpaceStations
        // prune list randomly based on distance
        .filter(([station, distance], index) => uniformRandBool(1.0 / (1.0 + 0.02 * (distance * distance)), rng, 325 + index))
        // filter out stations of the same faction
        .filter(([station, distance]) => station.faction === stationModel.faction);

    contactStations.sort((a, b) => a[1] - b[1]);

    const mainContainer = document.createElement("div");

    const missionH2 = document.createElement("h2");
    missionH2.innerText = "Missions";
    mainContainer.appendChild(missionH2);

    const explorationMissionH3 = document.createElement("h3");
    explorationMissionH3.innerText = "Exploration";
    mainContainer.appendChild(explorationMissionH3);

    const missionList = document.createElement("div");
    missionList.className = "missionList";
    mainContainer.appendChild(missionList);

    sightSeeingMissions.forEach((mission) => {
        const missionContainer = new MissionContainer(mission, player);
        missionList.appendChild(missionContainer.rootNode);
    });

    const terraformationMissionH3 = document.createElement("h3");
    terraformationMissionH3.innerText = "Terraformation";
    mainContainer.appendChild(terraformationMissionH3);

    const tradingMissionH3 = document.createElement("h3");
    tradingMissionH3.innerText = "Trading";
    mainContainer.appendChild(tradingMissionH3);

    contactStations.forEach(([station, distance]) => {
        const stationP = document.createElement("p");
        stationP.innerText = `${station.name} in ${starSystem.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})`;
        mainContainer.appendChild(stationP);
    });

    return mainContainer;
}
