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

import { Sounds } from "../../assets/sounds";
import { Player } from "../../player/player";
import { Settings } from "../../settings";
import { EncyclopaediaGalactica } from "../../society/encyclopaediaGalactica";
import { getObjectModelByUniverseId } from "../../utils/coordinates/orbitalObjectId";

export function generateExplorationCenterDom(encyclopaedia: EncyclopaediaGalactica, player: Player) {
    const root = document.createElement("div");
    root.classList.add("flex-column", "discoveryPanel");

    const title = document.createElement("h2");
    title.textContent = "Exploration Center";
    root.appendChild(title);

    const discoveryListTitle = document.createElement("h3");
    discoveryListTitle.textContent = "New discoveries";
    root.appendChild(discoveryListTitle);

    const horizontalContainer = document.createElement("div");
    horizontalContainer.classList.add("flex-row");
    root.appendChild(horizontalContainer);

    const discoveryList = document.createElement("div");
    discoveryList.classList.add("flex-column", "overflow-y-auto", "flex-1", "discoveryList");
    horizontalContainer.appendChild(discoveryList);

    player.discoveries.local.forEach((discovery) => {
        const objectModel = getObjectModelByUniverseId(discovery.objectId);

        const discoveryItem = document.createElement("div");
        discoveryItem.classList.add("listItemContainer");
        discoveryList.appendChild(discoveryItem);

        const discoveryName = document.createElement("h3");
        discoveryName.textContent = objectModel.name;
        discoveryItem.appendChild(discoveryName);

        const discoveryDate = document.createElement("p");
        discoveryDate.textContent = new Date(discovery.discoveryTimestamp).toLocaleDateString();
        discoveryItem.appendChild(discoveryDate);

        const discoveryValue = document.createElement("p");
        discoveryValue.textContent = `Value: ${encyclopaedia.estimateDiscovery(discovery.objectId).toLocaleString()}${Settings.CREDIT_SYMBOL}`;
        discoveryItem.appendChild(discoveryValue);

        const sellDiscoveryButton = document.createElement("button");
        sellDiscoveryButton.textContent = "Sell";
        sellDiscoveryButton.addEventListener("click", () => {
            Sounds.ECHOED_BLIP_SOUND.play();
            const value = encyclopaedia.estimateDiscovery(discovery.objectId);
            player.balance += value;
            player.discoveries.local = player.discoveries.local.filter((d) => d !== discovery);
            player.discoveries.uploaded.push(discovery);
            discoveryItem.remove();
        });
        discoveryItem.appendChild(sellDiscoveryButton);
    });

    const discoveryDetails = document.createElement("div");
    discoveryDetails.classList.add("flex-column", "flex-3", "discoveryDetails");
    horizontalContainer.appendChild(discoveryDetails);

    const discoveryPlaceholderText = document.createElement("p");
    discoveryPlaceholderText.textContent = "Select a discovery to see more details.";
    discoveryDetails.appendChild(discoveryPlaceholderText);

    return root;
}
