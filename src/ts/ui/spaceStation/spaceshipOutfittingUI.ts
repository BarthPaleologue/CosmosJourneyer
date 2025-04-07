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
import { deserializeComponent } from "../../spaceship/components/component";
import { ComponentSlot } from "../../spaceship/componentSlot";
import { getComponentValue, SerializedComponent } from "../../spaceship/serializedComponents/component";
import { SpaceshipInternals } from "../../spaceship/spaceshipInternals";
import { ComponentBrowserUI } from "./componentBrowserUI";
import { ComponentSpecUI } from "./componentSpecUI";

export class SpaceshipOutfittingUI {
    readonly root: HTMLDivElement;

    private readonly componentList: HTMLDivElement;

    private readonly componentBrowser: ComponentBrowserUI;

    private readonly rightPanel: HTMLDivElement;

    private readonly currentComponentSpec: ComponentSpecUI;

    private readonly storeButton: HTMLButtonElement;

    private readonly sellButton: HTMLButtonElement;

    private readonly selectedComponentSpec: ComponentSpecUI;

    private readonly buyEquipButton: HTMLButtonElement;

    private readonly equipButton: HTMLButtonElement;

    private activeSlotDiv: HTMLElement | null = null;

    private handleBuyEquipButtonClick: () => void = () => {};

    private handleEquipButtonClick: () => void = () => {};

    private handleSellButtonClick: () => void = () => {};

    private handleStoreButtonClick: () => void = () => {};

    private handleSelectComponent: (component: SerializedComponent) => void = () => {};

    constructor() {
        this.root = document.createElement("div");
        this.root.className = "spaceshipOutfittingUI";

        this.componentList = document.createElement("div");
        this.componentList.className = "flex-column";
        this.root.appendChild(this.componentList);

        this.componentBrowser = new ComponentBrowserUI();
        this.componentBrowser.onComponentSelect.add((component) => {
            this.handleSelectComponent(component);
        });
        this.root.appendChild(this.componentBrowser.root);

        this.rightPanel = document.createElement("div");
        this.rightPanel.style.display = "flex";
        this.rightPanel.style.flexDirection = "column";
        this.rightPanel.style.background = "transparent";
        this.rightPanel.style.padding = "0px";
        this.rightPanel.style.rowGap = "10px";
        this.root.appendChild(this.rightPanel);

        const currentComponentTitle = document.createElement("h3");
        currentComponentTitle.innerText = "Equipped";
        this.rightPanel.appendChild(currentComponentTitle);

        this.currentComponentSpec = new ComponentSpecUI();
        this.currentComponentSpec.root.style.flexGrow = "1";
        this.currentComponentSpec.root.style.flex = "1";
        this.rightPanel.appendChild(this.currentComponentSpec.root);

        const rowContainer = document.createElement("div");
        rowContainer.style.display = "flex";
        rowContainer.style.flexDirection = "row";
        rowContainer.style.columnGap = "10px";
        rowContainer.style.padding = "0px";
        rowContainer.style.background = "transparent";
        this.rightPanel.appendChild(rowContainer);

        this.storeButton = document.createElement("button");
        this.storeButton.style.flexGrow = "1";
        this.storeButton.innerText = i18n.t("spaceStation:store");
        this.storeButton.disabled = true;
        this.storeButton.addEventListener("click", () => {
            this.handleStoreButtonClick();
        });
        rowContainer.appendChild(this.storeButton);

        this.sellButton = document.createElement("button");
        this.sellButton.style.flexGrow = "1";
        this.sellButton.innerText = i18n.t("spaceStation:sell");
        this.sellButton.disabled = true;
        this.sellButton.addEventListener("click", () => {
            this.handleSellButtonClick();
        });
        rowContainer.appendChild(this.sellButton);

        const selectedComponentTitle = document.createElement("h3");
        selectedComponentTitle.innerText = "Selected";
        this.rightPanel.appendChild(selectedComponentTitle);

        this.selectedComponentSpec = new ComponentSpecUI();
        this.selectedComponentSpec.root.style.flexGrow = "1";
        this.selectedComponentSpec.root.style.flex = "1";
        this.rightPanel.appendChild(this.selectedComponentSpec.root);

        const rowContainer2 = document.createElement("div");
        rowContainer2.style.display = "flex";
        rowContainer2.style.flexDirection = "row";
        rowContainer2.style.columnGap = "10px";
        rowContainer2.style.padding = "0px";
        rowContainer2.style.background = "transparent";
        this.rightPanel.appendChild(rowContainer2);

        this.buyEquipButton = document.createElement("button");
        this.buyEquipButton.style.flexGrow = "1";
        this.buyEquipButton.innerText = i18n.t("spaceStation:buyEquip");
        this.buyEquipButton.disabled = true;
        this.buyEquipButton.addEventListener("click", () => {
            this.handleBuyEquipButtonClick();
        });
        rowContainer2.appendChild(this.buyEquipButton);

        this.equipButton = document.createElement("button");
        this.equipButton.style.flexGrow = "1";
        this.equipButton.innerText = i18n.t("spaceStation:equip");
        this.equipButton.disabled = true;
        this.equipButton.addEventListener("click", () => {
            this.handleEquipButtonClick();
        });
        rowContainer2.appendChild(this.equipButton);
    }

    generate(shipInternals: SpaceshipInternals, player: Player) {
        this.componentList.innerHTML = "";

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

        this.handleSelectComponent = (component) => {
            this.selectedComponentSpec.displayComponent(component);

            const isComponentOwned = player.spareSpaceshipComponents.has(component);

            this.equipButton.disabled = !isComponentOwned;
            this.buyEquipButton.disabled = isComponentOwned;
        };
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
        });

        return slotUI;
    }

    private handleClickOnSlot(componentSlot: ComponentSlot, player: Player) {
        this.currentComponentSpec.displayComponent(componentSlot.getComponent()?.serialize() ?? null);
        this.storeButton.disabled = componentSlot.getComponent() === null;
        this.sellButton.disabled = componentSlot.getComponent() === null;

        this.selectedComponentSpec.displayComponent(null);
        this.buyEquipButton.disabled = true;
        this.equipButton.disabled = true;

        if (componentSlot.types.length > 1) {
            this.componentBrowser.browseCategories(
                componentSlot.types,
                componentSlot.maxSize,
                player.spareSpaceshipComponents
            );
        } else {
            this.componentBrowser.browse(
                componentSlot.types[0],
                componentSlot.maxSize,
                player.spareSpaceshipComponents
            );
        }

        this.handleSellButtonClick = () => {
            const component = componentSlot.getComponent();
            if (component === null) {
                return;
            }

            componentSlot.setComponent(null);

            const componentPrice = getComponentValue(component.serialize());
            player.earn(componentPrice);

            this.handleClickOnSlot(componentSlot, player);
        };

        this.handleBuyEquipButtonClick = () => {
            const selectedComponent = this.componentBrowser.getSelectedComponent();
            if (selectedComponent === null) {
                return;
            }

            const currentComponent = componentSlot.getComponent();
            if (currentComponent !== null) {
                componentSlot.setComponent(null);
                player.spareSpaceshipComponents.add(currentComponent.serialize());
            }

            const componentPrice = getComponentValue(selectedComponent);
            player.pay(componentPrice);
            componentSlot.setComponent(deserializeComponent(selectedComponent));

            this.handleClickOnSlot(componentSlot, player);
        };

        this.handleStoreButtonClick = () => {
            const component = componentSlot.getComponent();
            if (component === null) {
                return;
            }

            componentSlot.setComponent(null);
            player.spareSpaceshipComponents.add(component.serialize());

            this.handleClickOnSlot(componentSlot, player);
        };

        this.handleEquipButtonClick = () => {
            const selectedComponent = this.componentBrowser.getSelectedComponent();
            if (selectedComponent === null) {
                return;
            }

            if (!player.spareSpaceshipComponents.has(selectedComponent)) {
                return;
            }

            const currentComponent = componentSlot.getComponent();
            if (currentComponent !== null) {
                componentSlot.setComponent(null);
                player.spareSpaceshipComponents.add(currentComponent.serialize());
            }

            componentSlot.setComponent(deserializeComponent(selectedComponent));
            player.spareSpaceshipComponents.delete(selectedComponent);

            this.handleClickOnSlot(componentSlot, player);
        };
    }
}
