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
import { ComponentSlot } from "../../spaceship/componentSlot";
import { Spaceship } from "../../spaceship/spaceship";
import { ComponentBrowserUI } from "./componentBrowserUI";
import { ComponentSpecUI } from "./componentSpecUI";

export class SpaceshipOutfittingUI {
    readonly root: HTMLDivElement;

    private readonly componentList: HTMLDivElement;

    private readonly componentBrowser: ComponentBrowserUI;

    private readonly rightPanel: HTMLDivElement;

    private readonly currentComponentSpec: ComponentSpecUI;

    private readonly unEquipButton: HTMLButtonElement;

    private readonly sellButton: HTMLButtonElement;

    private readonly selectedComponentSpec: ComponentSpecUI;

    private readonly buyButton: HTMLButtonElement;

    private activeSlotDiv: HTMLElement | null = null;

    private handleBuyButtonClick: () => void = () => {};

    private handleSellButtonClick: () => void = () => {};

    private handleUnequipButtonClick: () => void = () => {};

    constructor() {
        this.root = document.createElement("div");
        this.root.className = "spaceshipOutfittingUI";

        this.componentList = document.createElement("div");
        this.componentList.className = "flex-column";
        this.root.appendChild(this.componentList);

        this.componentBrowser = new ComponentBrowserUI();
        this.root.appendChild(this.componentBrowser.root);

        this.rightPanel = document.createElement("div");
        this.rightPanel.style.display = "flex";
        this.rightPanel.style.flexDirection = "column";
        this.rightPanel.style.background = "transparent";
        this.rightPanel.style.padding = "0px";
        this.rightPanel.style.rowGap = "10px";
        this.root.appendChild(this.rightPanel);

        this.currentComponentSpec = new ComponentSpecUI();
        this.currentComponentSpec.root.style.flexGrow = "1";
        this.rightPanel.appendChild(this.currentComponentSpec.root);

        const rowContainer = document.createElement("div");
        rowContainer.style.display = "flex";
        rowContainer.style.flexDirection = "row";
        rowContainer.style.columnGap = "10px";
        rowContainer.style.padding = "0px";
        rowContainer.style.background = "transparent";
        this.rightPanel.appendChild(rowContainer);

        this.unEquipButton = document.createElement("button");
        this.unEquipButton.className = "unEquipButton";
        this.unEquipButton.style.flexGrow = "1";
        this.unEquipButton.innerText = i18n.t("spaceStation:unequip");
        this.unEquipButton.addEventListener("click", () => {
            this.handleUnequipButtonClick();
        });
        rowContainer.appendChild(this.unEquipButton);

        this.sellButton = document.createElement("button");
        this.sellButton.className = "sellButton";
        this.sellButton.style.flexGrow = "1";
        this.sellButton.innerText = i18n.t("spaceStation:sell");
        this.sellButton.addEventListener("click", () => {
            this.handleSellButtonClick();
        });
        rowContainer.appendChild(this.sellButton);

        this.selectedComponentSpec = new ComponentSpecUI();
        this.selectedComponentSpec.root.style.flexGrow = "1";
        this.rightPanel.appendChild(this.selectedComponentSpec.root);

        this.buyButton = document.createElement("button");
        this.buyButton.className = "buyButton";
        this.buyButton.innerText = i18n.t("spaceStation:buy");
        this.buyButton.addEventListener("click", () => {
            this.handleBuyButtonClick();
        });
        this.rightPanel.appendChild(this.buyButton);
    }

    generate(spaceship: Spaceship, player: Player) {
        this.componentList.innerHTML = "";

        const shipInternals = spaceship.getInternals();

        const primaryH2 = document.createElement("h2");
        primaryH2.innerText = i18n.t("spaceStation:primarySlots");
        this.componentList.appendChild(primaryH2);

        const warpDriveSlot = this.createComponentSlotUI(shipInternals.primary.warpDrive, player);
        this.componentList.appendChild(warpDriveSlot);

        const thrustersSlot = this.createComponentSlotUI(shipInternals.primary.thrusters, player);
        this.componentList.appendChild(thrustersSlot);

        const fuelTankSlot = this.createComponentSlotUI(shipInternals.primary.fuelTank, player);
        this.componentList.appendChild(fuelTankSlot);

        const optionalH2 = document.createElement("h2");
        optionalH2.innerText = i18n.t("spaceStation:optionalSlots");
        this.componentList.appendChild(optionalH2);

        for (const componentSlot of shipInternals.optionals) {
            const componentSlotUI = this.createComponentSlotUI(componentSlot, player);
            this.componentList.appendChild(componentSlotUI);
        }
    }

    private createComponentSlotUI(componentSlot: ComponentSlot, player: Player): HTMLElement {
        const slotUI = document.createElement("button");
        slotUI.textContent = componentSlot.getComponent()?.type ?? "empty slot";
        slotUI.classList.add("componentSlot");
        slotUI.addEventListener("click", () => {
            this.handleClickOnSlot(componentSlot, player);

            if (this.activeSlotDiv !== null) {
                this.activeSlotDiv.classList.remove("active");
            }

            this.activeSlotDiv = slotUI;
            slotUI.classList.add("active");

            if (componentSlot.types.length > 1) {
                this.componentBrowser.browseCategories(componentSlot.types, componentSlot.maxSize);
            } else {
                this.componentBrowser.browse(componentSlot.types[0], componentSlot.maxSize);
            }
        });

        return slotUI;
    }

    private handleClickOnSlot(componentSlot: ComponentSlot, player: Player) {
        this.currentComponentSpec.displayComponent(componentSlot.getComponent()?.serialize() ?? null);
    }
}
