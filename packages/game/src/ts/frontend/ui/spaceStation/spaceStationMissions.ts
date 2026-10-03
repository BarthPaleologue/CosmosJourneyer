//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { OrbitalFacilityModel } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { generateSightseeingMissions } from "@/frontend/missions/generateSightSeeingMissions";
import type { Player } from "@/frontend/player/player";

import { MissionContainer } from "./missionContainer";

/**
 * Generates all missions available at the given space station for the player. Missions are generated based on the current timestamp (hourly basis).
 * @param stationModel The space station model where the missions are generated
 * @param player The player for which the missions are generated
 * @returns The DOM element containing the generated missions as HTML
 */
export function generateMissionsDom(
    stationModel: DeepReadonly<OrbitalFacilityModel>,
    player: Player,
    universeBackend: UniverseBackend,
    soundPlayer: ISoundPlayer,
    t: TFunction,
): HTMLDivElement {
    const systemContentModel = universeBackend.getSystemContentModelAt(stationModel.starSystemCoordinates);
    if (systemContentModel === null) {
        throw new Error("Cannot generate missions for a space station in an unknown star system");
    }

    const sightSeeingMissions = generateSightseeingMissions(
        stationModel,
        systemContentModel,
        universeBackend,
        player,
        Date.now(),
    );

    const htmlRoot = document.createElement("div");

    const missionH2 = document.createElement("h2");
    missionH2.innerText = "Missions";
    htmlRoot.appendChild(missionH2);

    const explorationMissionH3 = document.createElement("h3");
    explorationMissionH3.innerText = "Exploration";
    htmlRoot.appendChild(explorationMissionH3);

    const missionList = document.createElement("div");
    missionList.className = "missionList";
    htmlRoot.appendChild(missionList);

    sightSeeingMissions.forEach((mission) => {
        const missionContainer = new MissionContainer(mission, player, universeBackend, soundPlayer, t);
        missionList.appendChild(missionContainer.rootNode);
    });

    const terraformationMissionH3 = document.createElement("h3");
    terraformationMissionH3.innerText = "Terraformation";
    htmlRoot.appendChild(terraformationMissionH3);

    const tradingMissionH3 = document.createElement("h3");
    tradingMissionH3.innerText = "Trading";
    htmlRoot.appendChild(tradingMissionH3);

    return htmlRoot;
}
