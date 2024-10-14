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

import spaceStationHTML from "../../../html/spaceStationUI.html";
import { SpaceStationModel } from "../../spacestation/spacestationModel";
import { Observable } from "@babylonjs/core/Misc/observable";
import { generateInfoHTML } from "./spaceStationInfos";
import { Player } from "../../player/player";
import { generateMissionsDom } from "./spaceStationMissions";
import { Settings } from "../../settings";
import { OrbitalObjectModel } from "../../architecture/orbitalObject";

const enum MainPanelState {
    NONE,
    INFO,
    MISSIONS
}

export class SpaceStationLayer {
    private parentNode: HTMLElement;
    private spaceStationHeader: HTMLElement;

    private currentStation: SpaceStationModel | null = null;
    private currentStationParents: OrbitalObjectModel[] = [];

    private readonly playerName: HTMLElement;
    private readonly playerBalance: HTMLElement;

    private readonly mainPanel: HTMLElement;

    private readonly missionsButton: HTMLElement;

    private readonly infoButton: HTMLElement;

    private readonly takeOffButton: HTMLElement;

    private mainPanelState: MainPanelState = MainPanelState.NONE;

    readonly onTakeOffObservable = new Observable<void>();

    readonly player: Player;

    constructor(player: Player) {
        this.player = player;

        if (document.querySelector("#spaceStationUI") === null) {
            document.body.insertAdjacentHTML("beforeend", spaceStationHTML);
        }
        this.parentNode = document.getElementById("spaceStationUI") as HTMLElement;
        this.spaceStationHeader = document.getElementById("spaceStationHeader") as HTMLElement;

        this.playerName = document.querySelector<HTMLElement>("#spaceStationUI .playerName") as HTMLElement;
        this.playerBalance = document.querySelector<HTMLElement>("#spaceStationUI .playerBalance") as HTMLElement;

        this.mainPanel = document.querySelector<HTMLElement>("#spaceStationUI .mainContainer") as HTMLElement;

        const missionsButton = document.querySelector<HTMLElement>(".spaceStationAction.missionsButton");
        if (missionsButton === null) {
            throw new Error("Missions button not found");
        }
        this.missionsButton = missionsButton;
        this.missionsButton.addEventListener("click", () => {
            this.setMainPanelState(MainPanelState.MISSIONS);
        });

        const infoButton = document.querySelector<HTMLElement>(".spaceStationAction.infoButton");
        if (infoButton === null) {
            throw new Error("Info button not found");
        }
        this.infoButton = infoButton;
        this.infoButton.addEventListener("click", () => {
            this.setMainPanelState(MainPanelState.INFO);
        });

        const takeOffButton = document.querySelector<HTMLElement>(".spaceStationAction.takeOffButton");
        if (takeOffButton === null) {
            throw new Error("Take off button not found");
        }
        this.takeOffButton = takeOffButton;
        this.takeOffButton.addEventListener("click", () => {
            this.onTakeOffObservable.notifyObservers();
        });
    }

    private setMainPanelState(state: MainPanelState) {
        if (this.mainPanelState === state) {
            this.mainPanelState = MainPanelState.NONE;
        } else {
            this.mainPanelState = state;
        }

        switch (this.mainPanelState) {
            case MainPanelState.INFO:
                if (this.currentStation === null) {
                    throw new Error("No current station");
                }
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = generateInfoHTML(this.currentStation, this.currentStationParents);
                break;
            case MainPanelState.MISSIONS:
                if (this.currentStation === null) {
                    throw new Error("No current station");
                }
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                this.mainPanel.appendChild(generateMissionsDom(this.currentStation, this.player));
                break;
            case MainPanelState.NONE:
                this.mainPanel.classList.add("hidden");
                this.mainPanel.innerHTML = "";
                break;
        }
    }

    public setVisibility(visible: boolean) {
        if (this.isVisible() === visible) return;
        this.parentNode.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.parentNode.style.visibility !== "hidden";
    }

    public setStation(station: SpaceStationModel, stationParents: OrbitalObjectModel[], player: Player) {
        this.currentStation = station;
        this.currentStationParents = stationParents;
        this.spaceStationHeader.innerHTML = `
            <p class="welcomeTo">Welcome to</p>
            <p class="spaceStationName">${station.name}</p>`;

        this.playerName.textContent = `CMDR ${player.name}`;
        this.playerBalance.textContent = `Balance: ${Settings.CREDIT_SYMBOL}${player.balance.toLocaleString()}`;
    }

    public reset() {
        this.currentStation = null;
        this.spaceStationHeader.innerHTML = "";
        this.playerName.textContent = "";
        this.playerBalance.textContent = "";
        this.mainPanel.innerHTML = "";
    }
}
