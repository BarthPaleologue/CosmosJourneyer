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
import { getOrbitalPeriod } from "@cosmos-journeyer/physics";
import { getObjectModelById } from "@cosmos-journeyer/universe-model";
import type { TFunction } from "i18next";

import type { EncyclopaediaGalactica, SpaceDiscoveryData } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { Player } from "@/frontend/gameplay/player/player";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import type { ISoundPlayer } from "@/frontend/presentation/audio/soundPlayer";
import { alertModal } from "@/frontend/presentation/ui/dialogModal";

import { parseDistance, parseSecondsPrecise } from "@/utils/strings/parseToStrings";

import { Settings } from "@/settings";

import type { INotificationManager } from "../notificationManager";

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
    private readonly notificationManager: INotificationManager;

    private readonly t: TFunction;

    constructor(
        player: Player,
        encyclopaedia: EncyclopaediaGalactica,
        universeBackend: UniverseBackend,
        soundPlayer: ISoundPlayer,
        notificationManager: INotificationManager,
        t: TFunction,
    ) {
        this.soundPlayer = soundPlayer;
        this.notificationManager = notificationManager;

        this.t = t;

        this.player = player;
        this.encyclopaedia = encyclopaedia;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("flex-column", "discoveryDetails");

        this.placeHolderText = document.createElement("p");
        this.placeHolderText.textContent = this.t("explorationCenter:detailsPlaceholder");

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

            this.soundPlayer.playNow("success");
            const valueResult = await encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId);
            if (!valueResult.success) {
                this.notificationManager.create("general", "error", valueResult.error, 5_000);
                return;
            }

            player.earn(valueResult.value);
            player.discoveries.local = player.discoveries.local.filter((d) => d !== this.currentDiscovery);
            player.discoveries.uploaded.push(this.currentDiscovery);

            this.onSellDiscovery.notifyObservers(this.currentDiscovery);
            await this.setDiscovery(null, universeBackend);
        });

        void this.setDiscovery(null, universeBackend);
    }

    async setDiscovery(discovery: SpaceDiscoveryData | null, universeBackend: UniverseBackend): Promise<void> {
        this.htmlRoot.innerHTML = "";
        this.htmlRoot.classList.toggle("empty", discovery === null);
        this.currentDiscovery = discovery;

        if (this.currentDiscovery === null) {
            this.htmlRoot.appendChild(this.placeHolderText);
            return;
        }

        const systemModel = universeBackend.getSystemModelFromCoordinates(
            this.currentDiscovery.objectId.systemCoordinates,
        );

        if (systemModel === null) {
            console.error(discovery);
            await alertModal(
                "System could not be found for the discovery. More information in the console.",
                this.soundPlayer,
                this.t,
            );
            return;
        }

        const objectModel = getObjectModelById(this.currentDiscovery.objectId.idInSystem, systemModel);

        this.objectName.innerText = objectModel?.name ?? this.t("common:unknown");
        this.htmlRoot.appendChild(this.objectName);

        if (objectModel === null) {
            console.error(discovery);
            await alertModal(
                "Object could not be found for the discovery. More information in the console.",
                this.soundPlayer,
                this.t,
            );
            return;
        }

        this.objectType.innerText = this.t("orbitalObject:type", {
            value: getOrbitalObjectTypeToI18nString(objectModel, this.t),
        });
        this.htmlRoot.appendChild(this.objectType);

        this.siderealDayDuration.innerText = this.t("orbitalObject:siderealDayDuration", {
            value: parseSecondsPrecise(objectModel.rotation.siderealPeriod, this.t),
        });
        this.htmlRoot.appendChild(this.siderealDayDuration);

        const parentIds = objectModel.orbit.parentIds;
        const parentModels = parentIds.map((id) => getObjectModelById(id, systemModel));
        const parentMass = parentModels.reduce((acc, model) => acc + (model?.mass ?? 0), 0);

        const orbitalPeriod = getOrbitalPeriod(objectModel.orbit.semiMajorAxis, parentMass);
        this.orbitDuration.innerText = this.t("orbit:period", {
            value: parseSecondsPrecise(orbitalPeriod, this.t),
        });
        this.htmlRoot.appendChild(this.orbitDuration);

        this.orbitRadius.innerText = this.t("orbit:radius", {
            value: parseDistance(objectModel.orbit.semiMajorAxis, this.t),
        });
        this.htmlRoot.appendChild(this.orbitRadius);

        if (this.player.discoveries.local.includes(this.currentDiscovery)) {
            const sellingPrice = await this.encyclopaedia.estimateDiscovery(this.currentDiscovery.objectId);
            if (sellingPrice.success) {
                this.htmlRoot.appendChild(this.sellDiscoveryButton);

                this.sellDiscoveryButton.textContent = this.t("common:sellFor", {
                    price: `${sellingPrice.value.toLocaleString()}${Settings.CREDIT_SYMBOL}`,
                });
            } else {
                console.error(sellingPrice.error);
                await alertModal(
                    "Could not estimate the selling price. More information in the console.",
                    this.soundPlayer,
                    this.t,
                );
            }
        }
    }
}
