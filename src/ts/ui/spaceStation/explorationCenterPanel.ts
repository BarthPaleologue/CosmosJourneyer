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

import i18n from "../../i18n";
import { Player } from "../../player/player";
import { Settings } from "../../settings";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "../../society/encyclopaediaGalactica";
import { getObjectModelByUniverseId } from "../../utils/coordinates/orbitalObjectId";
import { DiscoveryDetails } from "./discoveryDetails";

const enum ExplorationCenterFilter {
    LOCAL_ONLY = "localOnly",
    UPLOADED_ONLY = "uploadedOnly",
    ALL = "all"
}

export class ExplorationCenterPanel {
    readonly htmlRoot: HTMLDivElement;
    readonly discoveryList: HTMLDivElement;
    readonly discoveryDetails: DiscoveryDetails;

    private filter: ExplorationCenterFilter = ExplorationCenterFilter.ALL;

    private selectedDiscovery: HTMLDivElement | null = null;

    private readonly sellAllButton: HTMLButtonElement;

    private readonly discoveryToHtmlItem = new Map<SpaceDiscoveryData, HTMLDivElement>();

    private readonly player: Player;
    private readonly encyclopaedia: EncyclopaediaGalactica;

    constructor(encyclopaedia: EncyclopaediaGalactica, player: Player) {
        this.player = player;
        this.encyclopaedia = encyclopaedia;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("flex-column", "discoveryPanel");

        const title = document.createElement("h2");
        title.textContent = "Exploration Center";
        this.htmlRoot.appendChild(title);

        const buttonHorizontalContainer = document.createElement("div");
        buttonHorizontalContainer.classList.add("flex-row", "buttonHorizontalContainer");
        this.htmlRoot.appendChild(buttonHorizontalContainer);

        const discoveryListSelect = document.createElement("select");
        buttonHorizontalContainer.appendChild(discoveryListSelect);

        this.sellAllButton = document.createElement("button");
        this.sellAllButton.textContent = "Sell all";
        this.sellAllButton.addEventListener("click", async () => {
            for (const discovery of this.player.discoveries.local) {
                const value = await encyclopaedia.estimateDiscovery(discovery.objectId);
                player.balance += value;
                player.discoveries.local = player.discoveries.local.filter((d) => d !== discovery);
                player.discoveries.uploaded.push(discovery);
            }
            await this.populate();
        });
        buttonHorizontalContainer.appendChild(this.sellAllButton);

        const optionLocal = document.createElement("option");
        optionLocal.innerText = "Local";
        optionLocal.value = ExplorationCenterFilter.LOCAL_ONLY;
        discoveryListSelect.appendChild(optionLocal);

        const optionUploaded = document.createElement("option");
        optionUploaded.innerText = "Uploaded";
        optionUploaded.value = ExplorationCenterFilter.UPLOADED_ONLY;
        discoveryListSelect.appendChild(optionUploaded);

        const optionAll = document.createElement("option");
        optionAll.innerText = "All";
        optionAll.value = ExplorationCenterFilter.ALL;
        discoveryListSelect.appendChild(optionAll);

        discoveryListSelect.value = ExplorationCenterFilter.ALL;
        discoveryListSelect.addEventListener("change", async () => {
            switch (discoveryListSelect.value) {
                case ExplorationCenterFilter.LOCAL_ONLY:
                case ExplorationCenterFilter.UPLOADED_ONLY:
                case ExplorationCenterFilter.ALL:
                    this.filter = discoveryListSelect.value;
                    await this.populate();
                    break;
                default:
                    throw new Error("Invalid value of discoveryListSelect!");
            }
        });

        const horizontalContainer = document.createElement("div");
        horizontalContainer.classList.add("flex-row", "contentHorizontalContainer");
        this.htmlRoot.appendChild(horizontalContainer);

        this.discoveryList = document.createElement("div");
        this.discoveryList.classList.add("flex-column", "overflow-y-auto", "discoveryList");
        horizontalContainer.appendChild(this.discoveryList);

        this.discoveryDetails = new DiscoveryDetails(player, encyclopaedia);
        this.discoveryDetails.onSellDiscovery.add(async (discovery) => {
            await this.populate();
        });
        horizontalContainer.appendChild(this.discoveryDetails.htmlRoot);
    }

    private filterDiscoveryListByQuery(query: string) {
        for (const listItem of this.discoveryList.children) {
            if (!(listItem instanceof HTMLDivElement)) continue;
            listItem.hidden = !listItem.innerHTML.toLowerCase().includes(query);
        }
    }

    async populate() {
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
            totalValue += await this.encyclopaedia.estimateDiscovery(discovery.objectId);
        }
        this.sellAllButton.toggleAttribute("disabled", totalValue === 0);
        this.sellAllButton.innerText = i18n.t("common:sellAllFor", { price: `${totalValue.toLocaleString()}${Settings.CREDIT_SYMBOL}` });

        if (discoveries.length === 0) {
            const container = document.createElement("div");
            container.classList.add("listItemContainer", "flex-column");
            this.discoveryList.appendChild(container);

            const noDiscoveryTitle = document.createElement("h3");
            noDiscoveryTitle.innerText = "No new discoveries";
            container.appendChild(noDiscoveryTitle);

            const noDiscoveryText = document.createElement("p");
            noDiscoveryText.innerText = "The universe awaits!";
            container.appendChild(noDiscoveryText);

            return;
        }

        const searchField = document.createElement("input");
        searchField.type = "search";
        searchField.placeholder = "Search for a discovery";
        searchField.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });
        searchField.addEventListener("input", (e) => {
            this.filterDiscoveryListByQuery(searchField.value.toLowerCase());
        });
        this.discoveryList.appendChild(searchField);

        discoveries.forEach(async (discovery) => {
            const objectModel = getObjectModelByUniverseId(discovery.objectId);

            const discoveryItem = document.createElement("div");
            discoveryItem.classList.add("listItemContainer", "flex-column");
            discoveryItem.classList.toggle("uploaded", this.player.discoveries.uploaded.includes(discovery));
            discoveryItem.addEventListener("click", async () => {
                if (this.selectedDiscovery !== null) {
                    this.selectedDiscovery.classList.remove("selected");
                }
                this.selectedDiscovery = discoveryItem;
                this.selectedDiscovery.classList.add("selected");

                await this.discoveryDetails.setDiscovery(discovery);
            });
            this.discoveryToHtmlItem.set(discovery, discoveryItem);
            this.discoveryList.appendChild(discoveryItem);

            const discoveryName = document.createElement("h3");
            discoveryName.textContent = objectModel.name;
            discoveryItem.appendChild(discoveryName);

            const discoveryDate = document.createElement("p");
            discoveryDate.textContent = new Date(discovery.discoveryTimestamp).toLocaleDateString();
            discoveryItem.appendChild(discoveryDate);

            if (this.player.discoveries.local.includes(discovery)) {
                const discoveryValue = document.createElement("p");
                discoveryValue.textContent = `Value: ${(await this.encyclopaedia.estimateDiscovery(discovery.objectId)).toLocaleString()}${Settings.CREDIT_SYMBOL}`;
                discoveryItem.appendChild(discoveryValue);
            } else {
                const alreadyUploaded = document.createElement("p");
                alreadyUploaded.textContent = "Data already uploaded";
                discoveryItem.appendChild(alreadyUploaded);
            }
        });
    }
}
