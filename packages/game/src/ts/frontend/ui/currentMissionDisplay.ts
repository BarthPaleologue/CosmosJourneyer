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

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { pressInteractionToStrings } from "@/frontend/helpers/inputControlsString";
import { type Mission } from "@/frontend/missions/mission";
import { type MissionContext } from "@/frontend/missions/missionContext";
import { type Player } from "@/frontend/player/player";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import i18n from "@/i18n";

export class CurrentMissionDisplay {
    readonly rootNode: HTMLElement;

    private readonly missionPanel: HTMLElement;

    private readonly missionPanelTitle: HTMLElement;
    private readonly missionPanelDescription: HTMLElement;
    private readonly missionPanelNextTask: HTMLElement;

    private readonly buttonContainer: HTMLElement;

    private readonly previousMissionButton: HTMLElement;
    private readonly missionCounter: HTMLElement;
    private readonly nextMissionButton: HTMLElement;

    private activeMission: Mission | null = null;

    private readonly player: Player;

    constructor(player: Player, starSystemDatabase: StarSystemDatabase, soundPlayer: ISoundPlayer) {
        this.player = player;

        this.rootNode = document.createElement("div");
        this.rootNode.classList.add("currentMissionDisplay", "flex-column");

        this.missionPanel = document.createElement("div");
        this.missionPanel.classList.add("missionPanel", "flex-column");
        this.rootNode.appendChild(this.missionPanel);

        this.missionPanelTitle = document.createElement("h2");
        this.missionPanel.appendChild(this.missionPanelTitle);

        this.missionPanelDescription = document.createElement("p");
        this.missionPanel.appendChild(this.missionPanelDescription);

        this.missionPanelNextTask = document.createElement("p");
        this.missionPanel.appendChild(this.missionPanelNextTask);

        this.buttonContainer = document.createElement("div");
        this.buttonContainer.classList.add("buttonContainer");
        this.rootNode.appendChild(this.buttonContainer);

        this.previousMissionButton = document.createElement("p");
        this.buttonContainer.appendChild(this.previousMissionButton);

        const previousSpan = document.createElement("span");
        previousSpan.innerText = i18n.t("missions:common:previous");
        this.previousMissionButton.appendChild(previousSpan);

        this.missionCounter = document.createElement("p");
        this.buttonContainer.appendChild(this.missionCounter);

        this.nextMissionButton = document.createElement("p");
        this.buttonContainer.appendChild(this.nextMissionButton);

        const nextSpan = document.createElement("span");
        nextSpan.innerText = i18n.t("missions:common:next");
        this.nextMissionButton.appendChild(nextSpan);

        void getGlobalKeyboardLayoutMap().then((keyboardLayoutMap) => {
            pressInteractionToStrings(SpaceShipControlsInputs.map.previousMission, keyboardLayoutMap).forEach((key) => {
                const previousKeySpan = document.createElement("span");
                previousKeySpan.classList.add("keySpan");
                previousKeySpan.innerText = key;
                this.previousMissionButton.appendChild(previousKeySpan);
            });

            pressInteractionToStrings(SpaceShipControlsInputs.map.nextMission, keyboardLayoutMap).forEach((key) => {
                const nextKeySpan = document.createElement("span");
                nextKeySpan.classList.add("keySpan");
                nextKeySpan.innerText = key;
                this.nextMissionButton.appendChild(nextKeySpan);
            });
        });

        const firstMission = this.player.currentMissions[0];
        if (firstMission === undefined) {
            this.setNoMissionActive();
        } else {
            this.setMission(firstMission, starSystemDatabase);
        }

        SpaceShipControlsInputs.map.previousMission.on("complete", () => {
            this.setPreviousMission(starSystemDatabase);
            this.previousMissionButton.animate(
                [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
                {
                    duration: 200,
                    easing: "ease",
                },
            );
            soundPlayer.playNow(SoundType.CLICK);
        });

        SpaceShipControlsInputs.map.nextMission.on("complete", () => {
            this.setNextMission(starSystemDatabase);
            this.nextMissionButton.animate(
                [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
                {
                    duration: 200,
                    easing: "ease",
                },
            );
            soundPlayer.playNow(SoundType.CLICK);
        });
    }

    public update(
        context: MissionContext,
        keyboardLayout: Map<string, string>,
        starSystemDatabase: StarSystemDatabase,
    ) {
        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        this.buttonContainer.hidden = allMissions.length <= 1;

        if (this.activeMission === null && this.player.currentMissions[0] !== undefined) {
            this.setMission(this.player.currentMissions[0], starSystemDatabase);
        } else if (this.activeMission === null && allMissions.length !== 0) {
            const defaultMission = allMissions.at(0);
            if (defaultMission !== undefined) this.setMission(defaultMission, starSystemDatabase);
            else this.setNoMissionActive();
        }

        if (this.activeMission === null) return;

        if (allMissions.indexOf(this.activeMission) === -1) {
            const defaultMission = allMissions.at(0);
            if (defaultMission !== undefined) this.setMission(defaultMission, starSystemDatabase);
            else this.setNoMissionActive();
            return;
        }

        this.rootNode.classList.toggle("completed", this.activeMission.tree.isCompleted());

        const nextTaskText = this.activeMission.describeNextTask(context, keyboardLayout, starSystemDatabase);
        if (nextTaskText !== this.missionPanelNextTask.innerText) this.missionPanelNextTask.innerText = nextTaskText;
    }

    public setNextMission(starSystemDatabase: StarSystemDatabase) {
        if (this.activeMission === null) {
            return;
        }

        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        const currentMissionIndex = allMissions.indexOf(this.activeMission);
        if (currentMissionIndex === -1) {
            const defaultMission = allMissions.at(0);
            if (defaultMission !== undefined) this.setMission(defaultMission, starSystemDatabase);
            else this.setNoMissionActive();
            return;
        }

        const nextMission = allMissions.at(currentMissionIndex + 1);
        if (nextMission === undefined) {
            return;
        }

        this.setMission(nextMission, starSystemDatabase);
    }

    public setPreviousMission(starSystemDatabase: StarSystemDatabase) {
        if (this.activeMission === null) {
            return;
        }

        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        const currentMissionIndex = allMissions.indexOf(this.activeMission);
        if (currentMissionIndex === -1) {
            const defaultMission = allMissions.at(0);
            if (defaultMission !== undefined) this.setMission(defaultMission, starSystemDatabase);
            else this.setNoMissionActive();
            return;
        }

        if (currentMissionIndex === 0) return;

        const previousMission = allMissions.at(currentMissionIndex - 1);
        if (previousMission === undefined) {
            return;
        }

        this.setMission(previousMission, starSystemDatabase);
    }

    private setMission(mission: Mission, starSystemDatabase: StarSystemDatabase) {
        this.activeMission = mission;
        this.missionPanelTitle.innerText = mission.getTypeString();
        this.missionPanelDescription.innerText = mission.describe(starSystemDatabase);

        const allMissions = this.player.completedMissions.concat(this.player.currentMissions);
        const missionIndex = allMissions.indexOf(this.activeMission);
        this.missionCounter.innerText = `${missionIndex + 1}/${allMissions.length}`;
    }

    private setNoMissionActive() {
        this.activeMission = null;

        this.missionPanelTitle.innerText = i18n.t("missions:common:noActiveMission");
        this.missionPanelDescription.innerText = i18n.t("missions:common:whereToGetMissions");
        this.missionCounter.innerText = "0/0";

        this.rootNode.classList.remove("completed");
    }

    public dispose() {
        this.rootNode.remove();
    }
}
