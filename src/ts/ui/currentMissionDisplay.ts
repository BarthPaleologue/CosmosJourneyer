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

import { Player } from "../player/player";
import { Mission } from "../missions/mission";
import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";

export class CurrentMissionDisplay {
    readonly rootNode: HTMLElement;

    private activeMissionIndex: number | null = null;

    private readonly player: Player;

    constructor(player: Player) {
        this.player = player;

        this.rootNode = document.createElement("div");
        this.rootNode.classList.add("currentMissionDisplay");

        if (this.player.currentMissions.length === 0) {
            this.setNoMissionActive();
        } else {
            this.setMission(this.player.currentMissions[0]);
        }

        SpaceShipControlsInputs.map.previousMission.on("complete", () => {
            this.setPreviousMission();
        });

        SpaceShipControlsInputs.map.nextMission.on("complete", () => {
            this.setNextMission();
        });
    }

    public update() {
        if (this.activeMissionIndex === null && this.player.currentMissions.length !== 0) {
            this.setMission(this.player.currentMissions[0]);
        }
    }

    public setNextMission() {
        if (this.activeMissionIndex === null) {
            return;
        }
        const nextMission = this.player.currentMissions.at(this.activeMissionIndex + 1);
        if (nextMission === undefined) {
            return;
        }

        this.setMission(nextMission);
    }

    public setPreviousMission() {
        if (this.activeMissionIndex === null) {
            return;
        }
        const previousMission = this.player.currentMissions.at(this.activeMissionIndex - 1);
        if (previousMission === undefined) {
            return;
        }

        this.setMission(previousMission);
    }

    private setMission(mission: Mission) {
        const missionPanel = document.createElement("div");
        missionPanel.classList.add("missionPanel");

        const missionTitle = document.createElement("h2");
        missionTitle.innerText = mission.getTypeString();
        missionPanel.appendChild(missionTitle);

        const missionDescription = document.createElement("p");
        missionDescription.innerText = mission.describe();
        missionPanel.appendChild(missionDescription);

        this.rootNode.innerHTML = "";
        this.rootNode.appendChild(missionPanel);
    }

    private setNoMissionActive() {
        const defaultPanel = document.createElement("div");
        defaultPanel.classList.add("missionPanel");

        const defaultPanelH2 = document.createElement("h2");
        defaultPanelH2.innerText = "You don't have any active mission yet";
        defaultPanel.appendChild(defaultPanelH2);

        const defaultPanelP = document.createElement("p");
        defaultPanelP.innerText = "You can get missions at space stations.";
        defaultPanel.appendChild(defaultPanelP);

        this.rootNode.innerHTML = "";
        this.rootNode.appendChild(defaultPanel);
    }
}
