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

import { type SpaceDiscoveryData } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import { type EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Player } from "@/frontend/player/player";
import { connectEncyclopaediaGalacticaModal } from "@/frontend/ui/dialogModal";

import i18n from "@/i18n";
import { Settings } from "@/settings";

import { type INotificationManager } from "../notificationManager";
import { DiscoveryDetails } from "./discoveryDetails";

const ExplorationCenterFilter = {
    LOCAL_ONLY: "localOnly",
    UPLOADED_ONLY: "uploadedOnly",
    ALL: "all",
} as const;
type ExplorationCenterFilter = (typeof ExplorationCenterFilter)[keyof typeof ExplorationCenterFilter];

export class ExplorationCenterPanel {
    readonly htmlRoot: HTMLDivElement;
    readonly discoveryList: HTMLDivElement;
    readonly discoveryDetails: DiscoveryDetails;

    private filter: ExplorationCenterFilter = ExplorationCenterFilter.ALL;

    private selectedDiscovery: HTMLDivElement | null = null;

    private readonly sellAllButton: HTMLButtonElement;

    private readonly discoveryToHtmlItem = new Map<SpaceDiscoveryData, HTMLDivElement>();

    private readonly player: Player;
    private readonly encyclopaedia: EncyclopaediaGalacticaManager;

    private readonly soundPlayer: ISoundPlayer;
    private readonly notificationManager: INotificationManager;

    constructor(
        encyclopaedia: EncyclopaediaGalacticaManager,
        player: Player,
        universeBackend: UniverseBackend,
        soundPlayer: ISoundPlayer,
        notificationManager: INotificationManager,
    ) {
        this.player = player;
        this.encyclopaedia = encyclopaedia;

        this.soundPlayer = soundPlayer;
        this.notificationManager = notificationManager;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("flex-column", "discoveryPanel");

        const title = document.createElement("h2");
        title.textContent = i18n.t("explorationCenter:explorationCenter");
        this.htmlRoot.appendChild(title);

        const encyclopaediaContainer = document.createElement("div");
        encyclopaediaContainer.classList.add("flex-row", "encyclopaediaContainer");
        this.htmlRoot.appendChild(encyclopaediaContainer);

        const activeInstances = document.createElement("p");
        activeInstances.textContent = i18n.t("explorationCenter:activeEncyclopaediaInstances", {
            value: encyclopaedia.getBackendString(),
        });
        encyclopaediaContainer.appendChild(activeInstances);

        const addEncyclopaediaInstanceButton = document.createElement("button");
        addEncyclopaediaInstanceButton.classList.add("disabled");
        addEncyclopaediaInstanceButton.textContent = i18n.t("explorationCenter:addNewInstance");
        addEncyclopaediaInstanceButton.addEventListener("click", async () => {
            this.soundPlayer.playNow(SoundType.CLICK);

            const connectionInfo = await connectEncyclopaediaGalacticaModal(this.soundPlayer);
            if (connectionInfo === null) return;
        });
        encyclopaediaContainer.appendChild(addEncyclopaediaInstanceButton);

        const buttonHorizontalContainer = document.createElement("div");
        buttonHorizontalContainer.classList.add("flex-row", "buttonHorizontalContainer");
        this.htmlRoot.appendChild(buttonHorizontalContainer);

        const discoveryListSelect = document.createElement("select");
        buttonHorizontalContainer.appendChild(discoveryListSelect);

        this.sellAllButton = document.createElement("button");
        this.sellAllButton.addEventListener("click", async () => {
            this.soundPlayer.playNow(SoundType.CLICK);

            for (const discovery of this.player.discoveries.local) {
                const valueResult = await encyclopaedia.estimateDiscovery(discovery.objectId);
                if (!valueResult.success) {
                    this.notificationManager.create("general", "error", valueResult.error, 5_000);
                    continue;
                }
                player.earn(valueResult.value);
                player.discoveries.local = player.discoveries.local.filter((d) => d !== discovery);
                player.discoveries.uploaded.push(discovery);
            }
            await this.populate(universeBackend);
        });
        buttonHorizontalContainer.appendChild(this.sellAllButton);

        const optionLocal = document.createElement("option");
        optionLocal.innerText = i18n.t("explorationCenter:filterLocal");
        optionLocal.value = ExplorationCenterFilter.LOCAL_ONLY;
        discoveryListSelect.appendChild(optionLocal);

        const optionUploaded = document.createElement("option");
        optionUploaded.innerText = i18n.t("explorationCenter:filterUploaded");
        optionUploaded.value = ExplorationCenterFilter.UPLOADED_ONLY;
        discoveryListSelect.appendChild(optionUploaded);

        const optionAll = document.createElement("option");
        optionAll.innerText = i18n.t("explorationCenter:filterAll");
        optionAll.value = ExplorationCenterFilter.ALL;
        discoveryListSelect.appendChild(optionAll);

        discoveryListSelect.value = ExplorationCenterFilter.ALL;
        discoveryListSelect.addEventListener("change", async () => {
            this.soundPlayer.playNow(SoundType.CLICK);

            switch (discoveryListSelect.value) {
                case ExplorationCenterFilter.LOCAL_ONLY:
                case ExplorationCenterFilter.UPLOADED_ONLY:
                case ExplorationCenterFilter.ALL:
                    this.filter = discoveryListSelect.value;
                    await this.populate(universeBackend);
                    break;
                default:
                    throw new Error("Invalid value of discoveryListSelect!");
            }
        });
        discoveryListSelect.addEventListener("click", () => {
            this.soundPlayer.playNow(SoundType.CLICK);
        });

        const horizontalContainer = document.createElement("div");
        horizontalContainer.classList.add("flex-row", "contentHorizontalContainer");
        this.htmlRoot.appendChild(horizontalContainer);

        this.discoveryList = document.createElement("div");
        this.discoveryList.classList.add("flex-column", "overflow-y-auto", "discoveryList");
        horizontalContainer.appendChild(this.discoveryList);

        this.discoveryDetails = new DiscoveryDetails(
            player,
            encyclopaedia,
            universeBackend,
            this.soundPlayer,
            this.notificationManager,
        );
        this.discoveryDetails.onSellDiscovery.add(async () => {
            await this.populate(universeBackend);
        });
        horizontalContainer.appendChild(this.discoveryDetails.htmlRoot);
    }

    private filterDiscoveryListByQuery(query: string) {
        for (const listItem of this.discoveryList.children) {
            if (!(listItem instanceof HTMLDivElement)) continue;
            listItem.hidden = !listItem.innerHTML.toLowerCase().includes(query);
        }
    }

    async populate(universeBackend: UniverseBackend) {
        this.discoveryList.innerHTML = "";
        this.discoveryToHtmlItem.clear();

        const discoveries: SpaceDiscoveryData[] = [];
        switch (this.filter) {
            case ExplorationCenterFilter.LOCAL_ONLY:
                discoveries.push(...this.player.discoveries.local);
                break;
            case ExplorationCenterFilter.UPLOADED_ONLY:
                discoveries.push(...this.player.discoveries.uploaded);
                break;
            case ExplorationCenterFilter.ALL:
                discoveries.push(...this.player.discoveries.local, ...this.player.discoveries.uploaded);
        }

        let totalValue = 0;
        for (const discovery of this.player.discoveries.local) {
            const result = await this.encyclopaedia.estimateDiscovery(discovery.objectId);
            if (!result.success) {
                this.notificationManager.create("general", "error", result.error, 5_000);
                continue;
            }

            totalValue += result.value;
        }
        this.sellAllButton.toggleAttribute("disabled", totalValue === 0);
        this.sellAllButton.innerText = i18n.t("common:sellAllFor", {
            price: `${totalValue.toLocaleString()}${Settings.CREDIT_SYMBOL}`,
        });

        if (discoveries.length === 0) {
            const container = document.createElement("div");
            container.classList.add("listItemContainer", "flex-column");
            this.discoveryList.appendChild(container);

            const noDiscoveryTitle = document.createElement("h3");
            noDiscoveryTitle.innerText = i18n.t("explorationCenter:noDiscoveryTitle");
            container.appendChild(noDiscoveryTitle);

            const noDiscoveryText = document.createElement("p");
            noDiscoveryText.innerText = i18n.t("explorationCenter:noDiscoveryText");
            container.appendChild(noDiscoveryText);

            return;
        }

        const searchField = document.createElement("input");
        searchField.type = "search";
        searchField.placeholder = i18n.t("explorationCenter:searchForADiscovery");
        searchField.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });
        searchField.addEventListener("input", () => {
            this.filterDiscoveryListByQuery(searchField.value.toLowerCase());
        });
        this.discoveryList.appendChild(searchField);

        discoveries.forEach((discovery) => {
            const objectModel = universeBackend.getObjectModelByUniverseId(discovery.objectId);

            const discoveryItem = document.createElement("div");
            discoveryItem.classList.add("listItemContainer", "flex-column");
            discoveryItem.classList.toggle("uploaded", this.player.discoveries.uploaded.includes(discovery));
            discoveryItem.addEventListener("click", async () => {
                this.soundPlayer.playNow(SoundType.CLICK);

                if (this.selectedDiscovery !== null) {
                    this.selectedDiscovery.classList.remove("selected");
                }
                this.selectedDiscovery = discoveryItem;
                this.selectedDiscovery.classList.add("selected");

                await this.discoveryDetails.setDiscovery(discovery, universeBackend);
            });
            this.discoveryToHtmlItem.set(discovery, discoveryItem);
            this.discoveryList.appendChild(discoveryItem);

            const discoveryName = document.createElement("h3");
            discoveryName.textContent = objectModel?.name ?? i18n.t("common:unknown");
            discoveryItem.appendChild(discoveryName);

            const discoveryDate = document.createElement("p");
            discoveryDate.textContent = new Date(discovery.discoveryTimestamp).toLocaleDateString();
            discoveryItem.appendChild(discoveryDate);
        });
    }
}
