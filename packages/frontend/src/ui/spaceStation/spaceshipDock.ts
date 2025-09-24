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

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Player } from "@/frontend/player/player";

import i18n from "@/i18n";

import { SpaceshipOutfittingUI } from "./spaceshipOutfittingUI";

export class SpaceshipDockUI {
    readonly root: HTMLDivElement;

    private readonly currentSpaceshipContainer: HTMLDivElement;

    private readonly otherSpaceshipContainer: HTMLDivElement;

    private readonly spaceshipOutfittingUI: SpaceshipOutfittingUI;

    constructor(player: Player, soundPlayer: ISoundPlayer) {
        this.root = document.createElement("div");

        const spaceshipH2 = document.createElement("h2");
        spaceshipH2.innerText = i18n.t("spaceStation:shipHangar");
        this.root.appendChild(spaceshipH2);

        this.currentSpaceshipContainer = document.createElement("div");
        this.currentSpaceshipContainer.classList.add("spaceshipContainer");
        this.root.appendChild(this.currentSpaceshipContainer);

        const otherSpaceshipH2 = document.createElement("h2");
        otherSpaceshipH2.innerText = i18n.t("spaceStation:otherSpaceships");
        this.root.appendChild(otherSpaceshipH2);

        this.otherSpaceshipContainer = document.createElement("div");
        this.root.appendChild(this.otherSpaceshipContainer);

        this.spaceshipOutfittingUI = new SpaceshipOutfittingUI(player, soundPlayer);
    }

    public generate(player: Player, soundPlayer: ISoundPlayer) {
        this.currentSpaceshipContainer.innerHTML = "";

        const currentSpaceship = player.instancedSpaceships.at(0);

        if (currentSpaceship !== undefined) {
            const spaceshipName = document.createElement("h3");
            spaceshipName.innerText = currentSpaceship.name;
            this.currentSpaceshipContainer.appendChild(spaceshipName);

            const fuelManagementContainer = document.createElement("div");
            fuelManagementContainer.classList.add("fuelManagementContainer");
            this.currentSpaceshipContainer.appendChild(fuelManagementContainer);

            const fuelText = document.createElement("p");
            fuelText.innerText = `Fuel: ${currentSpaceship.getRemainingFuel().toFixed(0)} / ${currentSpaceship.getTotalFuelCapacity()}`;
            fuelManagementContainer.appendChild(fuelText);

            const outfittingButton = document.createElement("button");
            outfittingButton.innerText = i18n.t("spaceStation:outfitting");
            fuelManagementContainer.appendChild(outfittingButton);

            outfittingButton.addEventListener("click", () => {
                soundPlayer.playNow(SoundType.CLICK);

                if (outfittingButton.classList.contains("active")) {
                    outfittingButton.classList.remove("active");
                    this.currentSpaceshipContainer.removeChild(this.spaceshipOutfittingUI.root);
                    return;
                }

                outfittingButton.classList.add("active");
                this.spaceshipOutfittingUI.generate(currentSpaceship.getInternals(), player, soundPlayer);
                this.currentSpaceshipContainer.appendChild(this.spaceshipOutfittingUI.root);
            });

            const refuelButton = document.createElement("button");
            refuelButton.innerText = i18n.t("spaceStation:refuel");

            refuelButton.addEventListener("click", () => {
                soundPlayer.playNow(SoundType.CLICK);
                const fuelAmount = currentSpaceship.getTotalFuelCapacity() - currentSpaceship.getRemainingFuel();
                const fuelUnitPrice = 10;
                player.pay(Math.round(fuelAmount * fuelUnitPrice));
                currentSpaceship.refuel(fuelAmount);
                fuelText.innerText = `Fuel: ${currentSpaceship.getRemainingFuel()} / ${currentSpaceship.getTotalFuelCapacity()}`;
            });
            fuelManagementContainer.appendChild(refuelButton);
        } else {
            this.currentSpaceshipContainer.innerText = i18n.t("spaceStation:noSpaceship");
        }

        this.otherSpaceshipContainer.innerHTML = "";

        if (player.serializedSpaceships.length === 0) {
            const noSpaceshipP = document.createElement("p");
            noSpaceshipP.innerText = i18n.t("spaceStation:noOtherSpaceship");
            this.otherSpaceshipContainer.appendChild(noSpaceshipP);
        }

        player.serializedSpaceships.forEach((serializedSpaceship) => {
            const spaceshipContainer = document.createElement("div");
            this.otherSpaceshipContainer.appendChild(spaceshipContainer);

            const spaceshipName = document.createElement("p");
            spaceshipName.innerText = serializedSpaceship.name;
            spaceshipContainer.appendChild(spaceshipName);

            const switchSpaceshipButton = document.createElement("button");
            switchSpaceshipButton.innerText = "Switch to this spaceship";
            switchSpaceshipButton.addEventListener("click", () => {
                throw new Error("Not implemented");
            });
            spaceshipContainer.appendChild(switchSpaceshipButton);
        });
    }
}
