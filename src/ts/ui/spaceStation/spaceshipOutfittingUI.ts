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
import { Component } from "../../spaceship/components/component";
import { Spaceship } from "../../spaceship/spaceship";
import { ComponentSpecUI } from "./componentSpecUI";

export class SpaceshipOutfittingUI {
    readonly root: HTMLDivElement;

    private readonly componentList: HTMLDivElement;

    private readonly browseComponents: HTMLDivElement;

    private readonly componentSpec: ComponentSpecUI;

    private activeSlotDiv: HTMLElement | null = null;

    constructor() {
        this.root = document.createElement("div");
        this.root.className = "spaceshipOutfittingUI";

        this.componentList = document.createElement("div");
        this.componentList.className = "flex-column";
        this.root.appendChild(this.componentList);

        this.browseComponents = document.createElement("div");
        this.browseComponents.innerText = "no component selected";
        this.root.appendChild(this.browseComponents);

        this.componentSpec = new ComponentSpecUI();
        this.root.appendChild(this.componentSpec.root);
    }

    generate(spaceship: Spaceship, player: Player) {
        const primaryH2 = document.createElement("h2");
        primaryH2.innerText = i18n.t("spaceStation:primarySlots");
        this.componentList.appendChild(primaryH2);

        const warpDriveSlot = this.createComponentSlot(spaceship.getWarpDrive());
        this.componentList.appendChild(warpDriveSlot);

        const thrustersSlot = this.createComponentSlot(spaceship.components.primary.thrusters);
        this.componentList.appendChild(thrustersSlot);

        const fuelTankSlot = this.createComponentSlot(spaceship.components.primary.fuelTank);
        this.componentList.appendChild(fuelTankSlot);

        const optionalH2 = document.createElement("h2");
        optionalH2.innerText = i18n.t("spaceStation:optionalSlots");
        this.componentList.appendChild(optionalH2);

        for (const component of spaceship.components.optional) {
            const componentSlot = this.createComponentSlot(component);
            this.componentList.appendChild(componentSlot);
        }
    }

    private createComponentSlot(component: Component | null): HTMLElement {
        const slot = document.createElement("button");
        slot.textContent = component !== null ? component.type : "empty slot";
        slot.classList.add("componentSlot");
        slot.addEventListener("click", () => {
            this.handleClickOnComponent(component);

            if (this.activeSlotDiv !== null) {
                this.activeSlotDiv.classList.remove("active");
            }

            this.activeSlotDiv = slot;
            slot.classList.add("active");

            this.browseComponents.innerText = "Browse components";
        });

        return slot;
    }

    private handleClickOnComponent(component: Component | null) {
        this.componentSpec.displayComponent(component?.serialize() ?? null);
    }
}
