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

        const discoveryListSelect = document.createElement("select");
        this.htmlRoot.appendChild(discoveryListSelect);

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
        discoveryListSelect.addEventListener("change", () => {
            switch (discoveryListSelect.value) {
                case ExplorationCenterFilter.LOCAL_ONLY:
                case ExplorationCenterFilter.UPLOADED_ONLY:
                case ExplorationCenterFilter.ALL:
                    this.filter = discoveryListSelect.value;
                    this.populate();
                    break;
                default:
                    throw new Error("Invalid value of discoveryListSelect!");
            }
        });

        const horizontalContainer = document.createElement("div");
        horizontalContainer.classList.add("flex-row");
        this.htmlRoot.appendChild(horizontalContainer);

        this.discoveryList = document.createElement("div");
        this.discoveryList.classList.add("flex-column", "overflow-y-auto", "flex-1", "discoveryList");
        horizontalContainer.appendChild(this.discoveryList);

        this.discoveryDetails = new DiscoveryDetails(player, encyclopaedia);
        this.discoveryDetails.onSellDiscovery.add((discovery) => {
            this.populate();
        });
        horizontalContainer.appendChild(this.discoveryDetails.htmlRoot);
    }

    populate() {
        this.discoveryList.innerHTML = "";
        this.discoveryToHtmlItem.clear();

        if (this.player.discoveries.local.length === 0) {
            const container = document.createElement("div");
            container.classList.add("listItemContainer");
            this.discoveryList.appendChild(container);

            const noDiscoveryTitle = document.createElement("h3");
            noDiscoveryTitle.innerText = "No new discoveries";
            container.appendChild(noDiscoveryTitle);

            const noDiscoveryText = document.createElement("p");
            noDiscoveryText.innerText = "The universe awaits!";
            container.appendChild(noDiscoveryText);
        }

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

        discoveries.forEach(async (discovery) => {
            const objectModel = getObjectModelByUniverseId(discovery.objectId);

            const discoveryItem = document.createElement("div");
            discoveryItem.classList.add("listItemContainer");
            discoveryItem.addEventListener("click", () => {
                this.discoveryDetails.setDiscovery(discovery);
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
