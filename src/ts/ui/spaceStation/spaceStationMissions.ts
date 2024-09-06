import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { getNeighborStarSystems } from "../../utils/getNeighborStarSystems";
import { SeededStarSystemModel } from "../../starSystem/seededStarSystemModel";
import { parseDistance } from "../../utils/parseToStrings";
import { Settings } from "../../settings";
import { uniformRandBool } from "extended-random";
import { getSpaceStationModels } from "../../utils/getModelsFromSystemModel";
import { generateSightseeingMissions } from "../../missions/generator";
import { getStarGalacticCoordinates } from "../../utils/getStarGalacticCoordinates";
import { Player } from "../../player/player";

export function generateMissionsDom(stationModel: SpaceStationModel, player: Player): HTMLDivElement {
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
        const missionContainer = document.createElement("div");
        missionContainer.className = "missionItem";
        missionList.appendChild(missionContainer);

        const descriptionContainer = document.createElement("div");
        descriptionContainer.className = "missionDescription";
        missionContainer.appendChild(descriptionContainer);

        const missionH4 = document.createElement("h4");
        missionH4.innerText = mission.getTypeString();
        descriptionContainer.appendChild(missionH4);

        const missionP = document.createElement("p");
        missionP.innerText = mission.describe();
        descriptionContainer.appendChild(missionP);

        const rewardP = document.createElement("p");
        rewardP.innerText = `Reward: ${Settings.CREDIT_SYMBOL}${mission.getReward().toLocaleString()}`;
        descriptionContainer.appendChild(rewardP);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "missionButtonContainer";
        missionContainer.appendChild(buttonContainer);

        const acceptButton = document.createElement("button");
        acceptButton.className = "missionButton";
        acceptButton.innerText = "Accept";
        buttonContainer.appendChild(acceptButton);

        if(player.currentMissions.find((m) => m.equals(mission))) {
            acceptButton.classList.add("accepted");
            acceptButton.innerText = "Accepted";
        }

        acceptButton.addEventListener("click", () => {
            if(player.currentMissions.find((m) => m.equals(mission))) {
                acceptButton.classList.remove("accepted");
                acceptButton.innerText = "Accept";
                player.currentMissions = player.currentMissions.filter((m) => !m.equals(mission));
                return;
            }

            acceptButton.classList.add("accepted");
            acceptButton.innerText = "Accepted";
            player.currentMissions.push(mission);

            console.log(player.currentMissions);
        });
    });

    const terraformationMissionH3 = document.createElement("h3");
    terraformationMissionH3.innerText = "Terraformation";
    mainContainer.appendChild(terraformationMissionH3);

    const tradingMissionH3 = document.createElement("h3");
    tradingMissionH3.innerText = "Trading";
    mainContainer.appendChild(tradingMissionH3);

    contactStations.forEach(([station, distance]) => {
        const stationP = document.createElement("p");
        stationP.innerText = `${station.name} in ${station.starSystem.name} (${parseDistance(distance * Settings.LIGHT_YEAR)})`;
        mainContainer.appendChild(stationP);
    });

    return mainContainer;
}
