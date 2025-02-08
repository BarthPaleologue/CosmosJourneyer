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

import { Observable } from "@babylonjs/core";
import { Sounds } from "../../assets/sounds";
import { Player } from "../../player/player";
import { EncyclopaediaGalactica, SpaceDiscoveryData } from "../../society/encyclopaediaGalactica";
import { getObjectModelByUniverseId } from "../../utils/coordinates/orbitalObjectId";
import { getOrbitalObjectTypeToI18nString } from "../../utils/strings/orbitalObjectTypeToDisplay";
import { parseDistance, parseSecondsPrecise } from "../../utils/strings/parseToStrings";
import i18n from "../../i18n";
import { Settings } from "../../settings";
import { StarSystemDatabase } from "../../starSystem/starSystemDatabase";

export class DiscoveryDetails {
    readonly htmlRoot: HTMLElement;

    readonly placeHolderText: HTMLParagraphElement;

    private currentDiscovery: SpaceDiscoveryData | null = null;

    readonly onSellDiscovery: Observable<SpaceDiscoveryData> = new Observable();

    readonly objectName: HTMLHeadingElement;

    readonly objectType: HTMLParagraphElement;

    readonly siderealDayDuration: HTMLParagraphElement;

    readonly orbitDuration: HTMLParagraphElement;

    readonly orbitRadius: HTMLParagraphElement;

    readonly sellDiscoveryButton: HTMLButtonElement;

    private readonly player: Player;

    private readonly encyclopaedia: EncyclopaediaGalactica;

    constructor(player: Player, encyclopaedia: EncyclopaediaGalactica, starSystemDatabase: StarSystemDatabase) {
        this.player = player;
        this.encyclopaedia = encyclopaedia;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("flex-column", "discoveryDetails");

        this.placeHolderText = document.createElement("p");
        this.placeHolderText.textContent = i18n.t("explorationCenter:detailsPlaceholder");

        this.objectName = document.createElement("h2");

        this.objectType = document.createElement("p");

        this.siderealDayDuration = document.createElement("p");

        this.orbitDuration = document.createElement("p");

        this.orbitRadius = document.createElement("p");

        this.sellDiscoveryButton = document.createElement("button");
        this.sellDiscoveryButton.textContent = "Sell";
        this.sellDiscoveryButton.addEventListener("click", async () => {
            if (this.currentDiscovery === null) {
                throw new Error("The sell button should not be displayed when currentDiscovery is null");
            }

            Sounds.SUCCESS.play();
            const value = await encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId);
            player.earn(value);
            player.discoveries.local = player.discoveries.local.filter((d) => d !== this.currentDiscovery);
            player.discoveries.uploaded.push(this.currentDiscovery);

            this.onSellDiscovery.notifyObservers(this.currentDiscovery);
            await this.setDiscovery(null, starSystemDatabase);
        });

        void this.setDiscovery(null, starSystemDatabase);
    }

    async setDiscovery(discovery: SpaceDiscoveryData | null, starSystemDatabase: StarSystemDatabase) {
        this.htmlRoot.innerHTML = "";
        this.htmlRoot.classList.toggle("empty", discovery === null);
        this.currentDiscovery = discovery;

        if (this.currentDiscovery === null) {
            this.htmlRoot.appendChild(this.placeHolderText);
            return;
        }

        const model = getObjectModelByUniverseId(this.currentDiscovery.objectId, starSystemDatabase);

        this.objectName.innerText = model?.name ?? i18n.t("common:unknown");
        this.htmlRoot.appendChild(this.objectName);

        this.objectType.innerText = i18n.t("orbitalObject:type", {
            value: model !== null ? getOrbitalObjectTypeToI18nString(model) : i18n.t("common:unknown")
        });
        this.htmlRoot.appendChild(this.objectType);

        this.siderealDayDuration.innerText = i18n.t("orbitalObject:siderealDayDuration", {
            value: model !== null ? parseSecondsPrecise(model.siderealDaySeconds) : i18n.t("common:unknown")
        });
        this.htmlRoot.appendChild(this.siderealDayDuration);

        /*this.orbitDuration.innerText = i18n.t("orbit:period", {
            value: model !== null ? parseSecondsPrecise(model.orbit.period) : i18n.t("common:unknown")
        });*/
        this.htmlRoot.appendChild(this.orbitDuration);

        this.orbitRadius.innerText = i18n.t("orbit:radius", {
            value: model !== null ? parseDistance(model.orbit.semiMajorAxis) : i18n.t("common:unknown")
        });
        this.htmlRoot.appendChild(this.orbitRadius);

        if (this.player.discoveries.local.includes(this.currentDiscovery)) {
            this.htmlRoot.appendChild(this.sellDiscoveryButton);

            this.sellDiscoveryButton.textContent = i18n.t("common:sellFor", {
                price: `${(await this.encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId)).toLocaleString()}${Settings.CREDIT_SYMBOL}`
            });
        }
    }
}
