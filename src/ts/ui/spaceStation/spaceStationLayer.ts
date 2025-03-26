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
import { generateSpaceshipDom } from "./spaceshipDock";
import { alertModal, promptModalString } from "../../utils/dialogModal";
import i18n from "../../i18n";
import { Sounds } from "../../assets/sounds";
import { ExplorationCenterPanel } from "./explorationCenterPanel";
import { EncyclopaediaGalacticaManager } from "../../society/encyclopaediaGalacticaManager";
import { StarSystemDatabase } from "../../starSystem/starSystemDatabase";
import { OrbitalFacilityModel, OrbitalObjectModel } from "../../architecture/orbitalObjectModel";
import { DeepReadonly } from "../../utils/types";

import editIcon from "../../../asset/icons/edit.webp";
import missionsIcon from "../../../asset/icons/space-exploration.webp";
import shipHangarIcon from "../../../asset/icons/spaceship_gear.webp";
import explorationIcon from "../../../asset/icons/telescope.webp";
import tradingIcon from "../../../asset/icons/trade.webp";
import infoIcon from "../../../asset/icons/space-station.webp";
import liftOffIcon from "../../../asset/icons/launch.webp";

const enum MainPanelState {
    NONE,
    INFO,
    MISSIONS,
    SPACE_SHIP,
    EXPLORATION_CENTER
}

export class SpaceStationLayer {
    readonly rootHtml: HTMLElement;

    private readonly header: HTMLElement;
    private readonly headerWelcome: HTMLElement;
    private readonly headerStationName: HTMLElement;

    private readonly playerInfoContainer: HTMLElement;
    private readonly playerNameContainer: HTMLElement;
    private readonly playerName: HTMLElement;
    private readonly editPlayerNameButton: HTMLElement;
    private readonly playerBalance: HTMLElement;

    private readonly mainPanel: HTMLElement;

    private readonly actionsContainer: HTMLElement;
    private readonly missionsButton: HTMLElement;
    private readonly spaceshipHangarButton: HTMLElement;
    private readonly tradingButton: HTMLElement;
    private readonly explorationCenterButton: HTMLElement;
    private readonly infoButton: HTMLElement;
    private readonly takeOffButton: HTMLElement;

    private currentStation: DeepReadonly<OrbitalFacilityModel> | null = null;
    private currentStationParents: DeepReadonly<Array<OrbitalObjectModel>> = [];

    private mainPanelState: MainPanelState = MainPanelState.NONE;

    readonly explorationCenterPanel: ExplorationCenterPanel;

    readonly onTakeOffObservable = new Observable<void>();

    constructor(player: Player, encyclopaedia: EncyclopaediaGalacticaManager, starSystemDatabase: StarSystemDatabase) {
        player.onBalanceChangedObservable.add((balance) => {
            this.updatePlayerBalance(balance);
        });

        player.onNameChangedObservable.add((name) => {
            this.updatePlayerName(name);
        });

        this.rootHtml = document.createElement("div");
        this.rootHtml.setAttribute("id", "spaceStationUI");
        document.body.appendChild(this.rootHtml);

        this.header = document.createElement("header");
        this.header.setAttribute("class", "spaceStationHeader");
        this.rootHtml.appendChild(this.header);

        this.headerWelcome = document.createElement("p");
        this.headerWelcome.setAttribute("class", "welcomeTo");
        this.headerWelcome.textContent = i18n.t("spaceStation:welcomeTo");
        this.header.appendChild(this.headerWelcome);

        this.headerStationName = document.createElement("p");
        this.headerStationName.setAttribute("class", "spaceStationName");
        this.header.appendChild(this.headerStationName);

        this.playerInfoContainer = document.createElement("div");
        this.playerInfoContainer.setAttribute("class", "playerInfo");
        this.rootHtml.appendChild(this.playerInfoContainer);

        this.playerNameContainer = document.createElement("div");
        this.playerNameContainer.setAttribute("class", "playerName");
        this.playerInfoContainer.appendChild(this.playerNameContainer);

        this.playerName = document.createElement("h2");
        this.playerNameContainer.appendChild(this.playerName);

        this.editPlayerNameButton = document.createElement("button");
        this.editPlayerNameButton.setAttribute("class", "icon");
        this.editPlayerNameButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            const newName = await promptModalString(i18n.t("spaceStation:cmdrNameChangePrompt"), player.getName());
            if (newName === null) return;
            player.setName(newName);
        });

        this.playerNameContainer.appendChild(this.editPlayerNameButton);

        const editPlayerNameButtonIcon = document.createElement("img");
        editPlayerNameButtonIcon.setAttribute("src", editIcon);
        this.editPlayerNameButton.appendChild(editPlayerNameButtonIcon);

        this.playerBalance = document.createElement("p");
        this.playerBalance.setAttribute("class", "playerBalance");
        this.playerInfoContainer.appendChild(this.playerBalance);

        this.mainPanel = document.createElement("div");
        this.mainPanel.setAttribute("class", "mainContainer hidden");
        this.rootHtml.appendChild(this.mainPanel);

        this.explorationCenterPanel = new ExplorationCenterPanel(encyclopaedia, player, starSystemDatabase);

        this.actionsContainer = document.createElement("div");
        this.actionsContainer.setAttribute("class", "spaceStationActions");
        this.rootHtml.appendChild(this.actionsContainer);

        this.missionsButton = document.createElement("div");
        this.missionsButton.setAttribute("class", "spaceStationAction missionsButton");
        this.actionsContainer.appendChild(this.missionsButton);

        const missionButtonIcon = document.createElement("img");
        missionButtonIcon.setAttribute("src", missionsIcon);
        missionButtonIcon.setAttribute("alt", "Mission icon");
        this.missionsButton.appendChild(missionButtonIcon);

        const missionButtonTitle = document.createElement("h2");
        missionButtonTitle.textContent = i18n.t("spaceStation:missions");
        this.missionsButton.appendChild(missionButtonTitle);

        const missionButtonDescription = document.createElement("p");
        missionButtonDescription.textContent = i18n.t("spaceStation:missionsDescription");
        this.missionsButton.appendChild(missionButtonDescription);

        this.spaceshipHangarButton = document.createElement("div");
        this.spaceshipHangarButton.setAttribute("class", "spaceStationAction spaceshipButton");
        this.actionsContainer.appendChild(this.spaceshipHangarButton);

        const spaceshipButtonIcon = document.createElement("img");
        spaceshipButtonIcon.setAttribute("src", shipHangarIcon);
        spaceshipButtonIcon.setAttribute("alt", "Spaceship icon");
        this.spaceshipHangarButton.appendChild(spaceshipButtonIcon);

        const spaceshipButtonTitle = document.createElement("h2");
        spaceshipButtonTitle.textContent = i18n.t("spaceStation:shipHangar");
        this.spaceshipHangarButton.appendChild(spaceshipButtonTitle);

        const spaceshipButtonDescription = document.createElement("p");
        spaceshipButtonDescription.textContent = i18n.t("spaceStation:shipHangarDescription");
        this.spaceshipHangarButton.appendChild(spaceshipButtonDescription);

        this.explorationCenterButton = document.createElement("div");
        this.explorationCenterButton.setAttribute("class", "spaceStationAction explorationCenterButton");
        this.actionsContainer.appendChild(this.explorationCenterButton);

        const explorationButtonIcon = document.createElement("img");
        explorationButtonIcon.setAttribute("src", explorationIcon);
        explorationButtonIcon.setAttribute("alt", "Exploration icon");
        this.explorationCenterButton.appendChild(explorationButtonIcon);

        const explorationButtonTitle = document.createElement("h2");
        explorationButtonTitle.textContent = i18n.t("spaceStation:explorationCenter");
        this.explorationCenterButton.appendChild(explorationButtonTitle);

        const explorationButtonDescription = document.createElement("p");
        explorationButtonDescription.textContent = i18n.t("spaceStation:explorationCenterDescription");
        this.explorationCenterButton.appendChild(explorationButtonDescription);

        this.tradingButton = document.createElement("div");
        this.tradingButton.setAttribute("class", "spaceStationAction tradingButton disabled");
        this.actionsContainer.appendChild(this.tradingButton);

        const tradingButtonIcon = document.createElement("img");
        tradingButtonIcon.setAttribute("src", tradingIcon);
        tradingButtonIcon.setAttribute("alt", "Market icon");
        this.tradingButton.appendChild(tradingButtonIcon);

        const tradingButtonTitle = document.createElement("h2");
        tradingButtonTitle.textContent = i18n.t("spaceStation:market");
        this.tradingButton.appendChild(tradingButtonTitle);

        const tradingButtonDescription = document.createElement("p");
        tradingButtonDescription.textContent = i18n.t("spaceStation:marketDescription");
        this.tradingButton.appendChild(tradingButtonDescription);

        this.infoButton = document.createElement("div");
        this.infoButton.setAttribute("class", "spaceStationAction infoButton");
        this.actionsContainer.appendChild(this.infoButton);

        const infoButtonIcon = document.createElement("img");
        infoButtonIcon.setAttribute("src", infoIcon);
        infoButtonIcon.setAttribute("alt", "Info icon");
        this.infoButton.appendChild(infoButtonIcon);

        const infoButtonTitle = document.createElement("h2");
        infoButtonTitle.textContent = i18n.t("spaceStation:stationInformation");
        this.infoButton.appendChild(infoButtonTitle);

        const infoButtonDescription = document.createElement("p");
        infoButtonDescription.textContent = i18n.t("spaceStation:stationInformationDescription");
        this.infoButton.appendChild(infoButtonDescription);

        const flexGrow = document.createElement("div");
        flexGrow.setAttribute("class", "flexGrow");
        this.actionsContainer.appendChild(flexGrow);

        this.takeOffButton = document.createElement("div");
        this.takeOffButton.setAttribute("class", "spaceStationAction takeOffButton");
        this.actionsContainer.appendChild(this.takeOffButton);

        const takeOffButtonIcon = document.createElement("img");
        takeOffButtonIcon.setAttribute("src", liftOffIcon);
        takeOffButtonIcon.setAttribute("alt", "Take-off icon");
        this.takeOffButton.appendChild(takeOffButtonIcon);

        const takeOffButtonTitle = document.createElement("h2");
        takeOffButtonTitle.textContent = i18n.t("spaceStation:takeOff");
        this.takeOffButton.appendChild(takeOffButtonTitle);

        const takeOffButtonDescription = document.createElement("p");
        takeOffButtonDescription.textContent = i18n.t("spaceStation:takeOffDescription");
        this.takeOffButton.appendChild(takeOffButtonDescription);

        this.missionsButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.MISSIONS, player, starSystemDatabase);
        });

        this.spaceshipHangarButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.SPACE_SHIP, player, starSystemDatabase);
        });

        this.explorationCenterButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.EXPLORATION_CENTER, player, starSystemDatabase);
        });

        this.infoButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            await this.setMainPanelState(MainPanelState.INFO, player, starSystemDatabase);
        });

        this.takeOffButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            this.onTakeOffObservable.notifyObservers();
        });
    }

    private async setMainPanelState(state: MainPanelState, player: Player, starSystemDatabase: StarSystemDatabase) {
        if (this.mainPanelState === state) {
            this.mainPanelState = MainPanelState.NONE;
        } else {
            this.mainPanelState = state;
        }

        if (this.currentStation === null) {
            return await alertModal("No current station");
        }

        switch (this.mainPanelState) {
            case MainPanelState.INFO:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = generateInfoHTML(this.currentStation, this.currentStationParents);
                break;
            case MainPanelState.MISSIONS:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                this.mainPanel.appendChild(generateMissionsDom(this.currentStation, player, starSystemDatabase));
                break;
            case MainPanelState.SPACE_SHIP:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                this.mainPanel.appendChild(generateSpaceshipDom(this.currentStation, player));
                break;
            case MainPanelState.EXPLORATION_CENTER:
                this.mainPanel.classList.remove("hidden");
                this.mainPanel.innerHTML = "";
                await this.explorationCenterPanel.populate(starSystemDatabase);
                this.mainPanel.appendChild(this.explorationCenterPanel.htmlRoot);
                break;
            case MainPanelState.NONE:
                this.mainPanel.classList.add("hidden");
                this.mainPanel.innerHTML = "";
                break;
        }
    }

    public setVisibility(visible: boolean) {
        if (this.rootHtml.style.visibility !== "" && this.isVisible() === visible) return;
        this.rootHtml.style.visibility = visible ? "visible" : "hidden";
    }

    public isVisible(): boolean {
        return this.rootHtml.style.visibility !== "hidden";
    }

    public setStation(
        station: DeepReadonly<OrbitalFacilityModel>,
        stationParents: DeepReadonly<Array<OrbitalObjectModel>>,
        player: Player
    ) {
        if (this.currentStation === station) return;
        this.currentStation = station;
        this.currentStationParents = stationParents;
        this.headerStationName.textContent = station.name;

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
        this.headerStationName.textContent = "";
        this.playerName.textContent = "";
        this.playerBalance.textContent = "";
        this.mainPanel.classList.add("hidden");
        this.mainPanel.innerHTML = "";
    }
}
