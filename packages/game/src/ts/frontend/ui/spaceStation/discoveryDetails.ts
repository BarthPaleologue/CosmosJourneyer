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

import { type EncyclopaediaGalactica, type SpaceDiscoveryData } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { getObjectModelById } from "@/backend/universe/starSystemModel";

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { type Player } from "@/frontend/player/player";
import { alertModal } from "@/frontend/ui/dialogModal";
import { createNotification, NotificationIntent, NotificationOrigin } from "@/frontend/ui/notification";

import { getOrbitalPeriod } from "@/utils/physics/orbit";
import { parseDistance, parseSecondsPrecise } from "@/utils/strings/parseToStrings";

import i18n from "@/i18n";
import { Settings } from "@/settings";

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

    private readonly soundPlayer: ISoundPlayer;

    constructor(
        player: Player,
        encyclopaedia: EncyclopaediaGalactica,
        starSystemDatabase: StarSystemDatabase,
        soundPlayer: ISoundPlayer,
    ) {
        this.soundPlayer = soundPlayer;

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

            this.soundPlayer.playNow(SoundType.SUCCESS);
            const valueResult = await encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId);
            if (!valueResult.success) {
                createNotification(
                    NotificationOrigin.GENERAL,
                    NotificationIntent.ERROR,
                    valueResult.error,
                    5_000,
                    this.soundPlayer,
                );
                return;
            }

            player.earn(valueResult.value);
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

        const systemModel = starSystemDatabase.getSystemModelFromCoordinates(
            this.currentDiscovery.objectId.systemCoordinates,
        );

        if (systemModel === null) {
            console.error(discovery);
            await alertModal(
                "System could not be found for the discovery. More information in the console.",
                this.soundPlayer,
            );
            return;
        }

        const objectModel = getObjectModelById(this.currentDiscovery.objectId.idInSystem, systemModel);

        this.objectName.innerText = objectModel?.name ?? i18n.t("common:unknown");
        this.htmlRoot.appendChild(this.objectName);

        if (objectModel === null) {
            console.error(discovery);
            await alertModal(
                "Object could not be found for the discovery. More information in the console.",
                this.soundPlayer,
            );
            return;
        }

        this.objectType.innerText = i18n.t("orbitalObject:type", {
            value: getOrbitalObjectTypeToI18nString(objectModel),
        });
        this.htmlRoot.appendChild(this.objectType);

        this.siderealDayDuration.innerText = i18n.t("orbitalObject:siderealDayDuration", {
            value: parseSecondsPrecise(objectModel.siderealDaySeconds),
        });
        this.htmlRoot.appendChild(this.siderealDayDuration);

        const parentIds = objectModel.orbit.parentIds;
        const parentModels = parentIds.map((id) => getObjectModelById(id, systemModel));
        const parentMass = parentModels.reduce((acc, model) => acc + (model?.mass ?? 0), 0);

        const orbitalPeriod = getOrbitalPeriod(objectModel.orbit.semiMajorAxis, parentMass);
        this.orbitDuration.innerText = i18n.t("orbit:period", {
            value: parseSecondsPrecise(orbitalPeriod),
        });
        this.htmlRoot.appendChild(this.orbitDuration);

        this.orbitRadius.innerText = i18n.t("orbit:radius", {
            value: parseDistance(objectModel.orbit.semiMajorAxis),
        });
        this.htmlRoot.appendChild(this.orbitRadius);

        if (this.player.discoveries.local.includes(this.currentDiscovery)) {
            const sellingPrice = await this.encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId);
            if (sellingPrice.success) {
                this.htmlRoot.appendChild(this.sellDiscoveryButton);

                this.sellDiscoveryButton.textContent = i18n.t("common:sellFor", {
                    price: `${sellingPrice.value.toLocaleString()}${Settings.CREDIT_SYMBOL}`,
                });
            } else {
                console.error(sellingPrice.error);
                await alertModal(
                    "Could not estimate the selling price. More information in the console.",
                    this.soundPlayer,
                );
            }
        }
    }
}
