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

import { Observable } from "@babylonjs/core/Misc/observable";
import { generateInfoHTML } from "./spaceStationInfos";
import { Player } from "../../player/player";
import { generateMissionsDom } from "./spaceStationMissions";
import { Settings } from "../../settings";
import { OrbitalObjectModel } from "../../architecture/orbitalObject";
import { OrbitalFacilityModel } from "../../spacestation/orbitalFacility";
import { generateSpaceshipDom } from "./spaceshipDock";
import { promptModalString } from "../../utils/dialogModal";
import i18n from "../../i18n";
import { Sounds } from "../../assets/sounds";
import { ExplorationCenterPanel } from "./explorationCenterPanel";
import { EncyclopaediaGalacticaManager } from "../../society/encyclopaediaGalacticaManager";

const enum MainPanelState {
    NONE,
    INFO,
    MISSIONS,
    SPACE_SHIP,
    EXPLORATION_CENTER
}

export class SpaceStationLayer {
    private parentNode: HTMLElement;

    private currentStation: OrbitalFacilityModel | null = null;
    private currentStationParents: OrbitalObjectModel[] = [];

    private readonly spaceStationName: HTMLElement;

    private readonly playerName: HTMLElement;
    private readonly editPlayerNameButton: HTMLElement;

    private readonly playerBalance: HTMLElement;

    private readonly mainPanel: HTMLElement;

    private readonly missionsButton: HTMLElement;

    private readonly explorationCenterButton: HTMLElement;

    private readonly spaceshipButton: HTMLElement;

    private readonly infoButton: HTMLElement;

    private readonly takeOffButton: HTMLElement;

    private mainPanelState: MainPanelState = MainPanelState.NONE;

    readonly explorationCenterPanel: ExplorationCenterPanel;

    readonly onTakeOffObservable = new Observable<void>();

    constructor(player: Player, encyclopaedia: EncyclopaediaGalacticaManager) {
        player.onBalanceChangedObservable.add((balance) => {
            this.updatePlayerBalance(balance);
        });

        player.onNameChangedObservable.add((name) => {
            this.updatePlayerName(name);
        });

        this.parentNode = document.getElementById("spaceStationUI") as HTMLElement;

        this.explorationCenterPanel = new ExplorationCenterPanel(encyclopaedia, player);

        this.spaceStationName = document.querySelector<HTMLElement>("#spaceStationUI .spaceStationName") as HTMLElement;

        this.playerName = document.querySelector<HTMLElement>("#spaceStationUI .playerName h2") as HTMLElement;

        this.editPlayerNameButton = document.querySelector<HTMLElement>("#spaceStationUI .playerName button") as HTMLElement;
        this.editPlayerNameButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            const newName = await promptModalString(i18n.t("spaceStation:cmdrNameChangePrompt"), player.getName());
            if (newName === null) return;
            player.setName(newName);
        });

        this.playerBalance = document.querySelector<HTMLElement>("#spaceStationUI .playerBalance") as HTMLElement;

        this.mainPanel = document.querySelector<HTMLElement>("#spaceStationUI .mainContainer") as HTMLElement;

        const missionsButton = document.querySelector<HTMLElement>(".spaceStationAction.missionsButton");
        if (missionsButton === null) {
            throw new Error("Missions button not found");
        }
        this.missionsButton = missionsButton;
        this.missionsButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.MISSIONS, player);
        });

        const spaceshipButton = document.querySelector<HTMLElement>(".spaceStationAction.spaceshipButton");
        if (spaceshipButton === null) {
            throw new Error("Spaceship button not found");
        }
        this.spaceshipButton = spaceshipButton;
        this.spaceshipButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.SPACE_SHIP, player);
        });

        const explorationCenterButton = document.querySelector<HTMLElement>(".spaceStationAction.explorationCenterButton");
        if (explorationCenterButton === null) {
            throw new Error("Exploration center button not found");
        }
        this.explorationCenterButton = explorationCenterButton;
        this.explorationCenterButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.EXPLORATION_CENTER, player);
        });

        const infoButton = document.querySelector<HTMLElement>(".spaceStationAction.infoButton");
        if (infoButton === null) {
            throw new Error("Info button not found");
        }
        this.infoButton = infoButton;
        this.infoButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.INFO, player);
        });

        const takeOffButton = document.querySelector<HTMLElement>(".spaceStationAction.takeOffButton");
        if (takeOffButton === null) {
            throw new Error("Take off button not found");
        }
        this.takeOffButton = takeOffButton;
        this.takeOffButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            this.onTakeOffObservable.notifyObservers();
        });
    }

    private async setMainPanelState(state: MainPanelState, player: Player) {
        if (this.mainPanelState === state) {
            this.mainPanelState = MainPanelState.NONE;
        } else {
            this.mainPanelState = state;
        }

        if (this.currentStation === null) {
            throw new Error("No current station");
        }

        switch (this.mainPanelState) {
            case MainPanelState.INFO:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = generateInfoHTML(this.currentStation, this.currentStationParents);
                break;
            case MainPanelState.MISSIONS:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                this.mainPanel.appendChild(generateMissionsDom(this.currentStation, player));
                break;
            case MainPanelState.SPACE_SHIP:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                this.mainPanel.appendChild(generateSpaceshipDom(this.currentStation, player));
                break;
            case MainPanelState.EXPLORATION_CENTER:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                await this.explorationCenterPanel.populate();
                this.mainPanel.appendChild(this.explorationCenterPanel.htmlRoot);
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

    public setStation(station: OrbitalFacilityModel, stationParents: OrbitalObjectModel[], player: Player) {
        if (this.currentStation === station) return;
        this.currentStation = station;
        this.currentStationParents = stationParents;
        this.spaceStationName.textContent = station.name;

        this.updatePlayerName(player.getName());
        this.updatePlayerBalance(player.getBalance());
    }

    private updatePlayerName(name: string) {
        this.playerName.textContent = `CMDR ${name}`;
    }

    private updatePlayerBalance(balance: number) {
        this.playerBalance.textContent = `Balance: ${Settings.CREDIT_SYMBOL}${balance.toLocaleString()}`;
    }

    public reset() {
        this.currentStation = null;
        this.spaceStationName.textContent = "";
        this.playerName.textContent = "";
        this.playerBalance.textContent = "";
        this.mainPanel.classList.add("hidden");
        this.mainPanel.innerHTML = "";
    }
}
