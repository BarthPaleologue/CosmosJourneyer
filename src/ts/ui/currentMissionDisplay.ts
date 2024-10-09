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
import { pressInteractionToStrings } from "../utils/inputControlsString";
import { TutorialControlsInputs } from "./tutorial/tutorialLayerInputs";
import { GeneralInputs } from "../inputs/generalInputs";
import { Sounds } from "../assets/sounds";

export class CurrentMissionDisplay {
    readonly rootNode: HTMLElement;

    private readonly missionPanel: HTMLElement;

    private readonly buttonContainer: HTMLElement;

    private readonly previousMissionButton: HTMLElement;
    private readonly nextMissionButton: HTMLElement;

    private activeMission: Mission | null = null;

    private readonly player: Player;

    constructor(player: Player) {
        this.player = player;

        this.rootNode = document.createElement("div");
        this.rootNode.classList.add("currentMissionDisplay");

        this.missionPanel = document.createElement("div");
        this.missionPanel.classList.add("missionPanel");
        this.rootNode.appendChild(this.missionPanel);

        this.buttonContainer = document.createElement("div");
        this.buttonContainer.classList.add("buttonContainer");
        this.rootNode.appendChild(this.buttonContainer);

        this.previousMissionButton = document.createElement("p");
        this.buttonContainer.appendChild(this.previousMissionButton);

        const previousSpan = document.createElement("span");
        previousSpan.innerText = "Previous";
        this.previousMissionButton.appendChild(previousSpan);

        pressInteractionToStrings(SpaceShipControlsInputs.map.previousMission, null).forEach((key) => {
            const previousKeySpan = document.createElement("span");
            previousKeySpan.classList.add("keySpan");
            previousKeySpan.innerText = key;
            this.previousMissionButton.appendChild(previousKeySpan);
        });

        this.nextMissionButton = document.createElement("p");
        this.buttonContainer.appendChild(this.nextMissionButton);

        const nextSpan = document.createElement("span");
        nextSpan.innerText = "Next";
        this.nextMissionButton.appendChild(nextSpan);

        pressInteractionToStrings(SpaceShipControlsInputs.map.nextMission, null).forEach((key) => {
            const nextKeySpan = document.createElement("span");
            nextKeySpan.classList.add("keySpan");
            nextKeySpan.innerText = key;
            this.nextMissionButton.appendChild(nextKeySpan);
        });

        if (this.player.currentMissions.length === 0) {
            this.setNoMissionActive();
        } else {
            this.setMission(this.player.currentMissions[0]);
        }

        SpaceShipControlsInputs.map.previousMission.on("complete", () => {
            this.setPreviousMission();
            this.previousMissionButton.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
                duration: 200,
                easing: "ease"
            });
            Sounds.MENU_SELECT_SOUND.play();
        });

        SpaceShipControlsInputs.map.nextMission.on("complete", () => {
            this.setNextMission();
            this.nextMissionButton.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
                duration: 200,
                easing: "ease"
            });
            Sounds.MENU_SELECT_SOUND.play();
        });
    }

    public async update(context: MissionContext) {
        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        if (this.activeMission === null && this.player.currentMissions.length !== 0) {
            this.setMission(this.player.currentMissions[0]);
        } else if (this.activeMission === null && allMissions.length !== 0) {
            this.setMission(allMissions[0]);
        }

        if (this.activeMission === null) return;

        this.rootNode.classList.toggle("completed", this.activeMission.tree.isCompleted());

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

        if (currentMissionIndex === 0) return;

        const previousMission = allMissions.at(currentMissionIndex - 1);
        if (previousMission === undefined) {
            return;
        }

        this.setMission(previousMission);
    }

    private setMission(mission: Mission) {
        this.activeMission = mission;

        this.missionPanel.innerHTML = "";

        const missionTitle = document.createElement("h2");
        missionTitle.innerText = mission.getTypeString();
        this.missionPanel.appendChild(missionTitle);

        const missionDescription = document.createElement("p");
        missionDescription.innerText = mission.describe();
        this.missionPanel.appendChild(missionDescription);

        const missionNextTask = document.createElement("p");
        this.missionPanel.appendChild(missionNextTask);
    }

    private setNoMissionActive() {
        this.missionPanel.innerHTML = "";

        const defaultPanelH2 = document.createElement("h2");
        defaultPanelH2.innerText = "You don't have any active mission yet";
        this.missionPanel.appendChild(defaultPanelH2);

        const defaultPanelP = document.createElement("p");
        defaultPanelP.innerText = "You can get missions at space stations.";
        this.missionPanel.appendChild(defaultPanelP);
    }
}
