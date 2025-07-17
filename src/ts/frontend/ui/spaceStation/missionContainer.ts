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

import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Mission } from "@/frontend/missions/mission";
import { type Player } from "@/frontend/player/player";

import { Settings } from "@/settings";

import { AcceptMissionButton } from "./acceptMissionButton";

export class MissionContainer {
    readonly rootNode: HTMLElement;

    constructor(mission: Mission, player: Player, starSystemDatabase: StarSystemDatabase, soundPlayer: ISoundPlayer) {
        this.rootNode = document.createElement("div");
        this.rootNode.className = "missionItem";

        const descriptionContainer = document.createElement("div");
        descriptionContainer.className = "missionDescription";
        this.rootNode.appendChild(descriptionContainer);

        const missionH4 = document.createElement("h4");
        missionH4.innerText = mission.getTypeString();
        descriptionContainer.appendChild(missionH4);

        const missionP = document.createElement("p");
        missionP.innerText = mission.describe(starSystemDatabase);
        descriptionContainer.appendChild(missionP);

        const rewardP = document.createElement("p");
        rewardP.innerText = `Reward: ${Settings.CREDIT_SYMBOL}${mission.getReward().toLocaleString()}`;
        descriptionContainer.appendChild(rewardP);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "missionButtonContainer";
        this.rootNode.appendChild(buttonContainer);

        const acceptButton = new AcceptMissionButton(mission, player, soundPlayer);
        buttonContainer.appendChild(acceptButton.rootNode);
    }
}
