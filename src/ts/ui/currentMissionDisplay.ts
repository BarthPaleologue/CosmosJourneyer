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
import { MissionContext } from "../missions/missionContext";

export class CurrentMissionDisplay {
    readonly rootNode: HTMLElement;

    private activeMission: Mission | null = null;

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

    public async update(context: MissionContext) {
        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        if (this.activeMission === null && allMissions.length !== 0) {
            this.setMission(allMissions[0]);
        }

        if (this.activeMission === null) return;

        const missionPanel = this.rootNode.querySelector<HTMLDivElement>(".missionPanel");
        if (missionPanel === null) {
            throw new Error("Could not find mission panel");
        }
        missionPanel.classList.toggle("completed", this.activeMission.tree.isCompleted());

        const descriptionBlocks = this.rootNode.querySelectorAll<HTMLParagraphElement>(".missionPanel p");
        const descriptionBlock = descriptionBlocks[0];
        const newDescriptionText = this.activeMission.describe();
        if (newDescriptionText !== descriptionBlock.innerText) descriptionBlock.innerText = newDescriptionText;

        const nextTaskBlock = descriptionBlocks[1];
        const nextTaskText = await this.activeMission.describeNextTask(context);
        if (nextTaskText !== nextTaskBlock.innerText) nextTaskBlock.innerText = nextTaskText;
    }

    public setNextMission() {
        if (this.activeMission === null) {
            return;
        }

        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        const currentMissionIndex = allMissions.indexOf(this.activeMission);
        if (currentMissionIndex === -1) {
            throw new Error("Could not find current mission in all missions");
        }

        const nextMission = allMissions.at(currentMissionIndex + 1);
        if (nextMission === undefined) {
            return;
        }

        this.setMission(nextMission);
    }

    public setPreviousMission() {
        if (this.activeMission === null) {
            return;
        }

        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        const currentMissionIndex = allMissions.indexOf(this.activeMission);
        if (currentMissionIndex === -1) {
            throw new Error("Could not find current mission in all missions");
        }

        const previousMission = allMissions.at(currentMissionIndex - 1);
        if (previousMission === undefined) {
            return;
        }

        this.setMission(previousMission);
    }

    private setMission(mission: Mission) {
        this.activeMission = mission;

        const missionPanel = document.createElement("div");
        missionPanel.classList.add("missionPanel");

        const missionTitle = document.createElement("h2");
        missionTitle.innerText = mission.getTypeString();
        missionPanel.appendChild(missionTitle);

        const missionDescription = document.createElement("p");
        missionDescription.innerText = mission.describe();
        missionPanel.appendChild(missionDescription);

        const missionNextTask = document.createElement("p");
        missionPanel.appendChild(missionNextTask);

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
