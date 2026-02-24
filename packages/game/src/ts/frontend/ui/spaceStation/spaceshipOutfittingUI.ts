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

import { getComponentTypeI18n } from "@/backend/spaceship/serializedComponents/component";
import { getComponentValue } from "@/backend/spaceship/serializedComponents/pricing";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Player } from "@/frontend/player/player";
import { deserializeComponent } from "@/frontend/spaceship/components/component";
import { type ComponentSlot } from "@/frontend/spaceship/componentSlot";
import { type SpaceshipInternals } from "@/frontend/spaceship/spaceshipInternals";

import i18n from "@/i18n";
import { Settings } from "@/settings";

import { promptModalBoolean } from "../dialogModal";
import { ComponentBrowserUI } from "./componentBrowserUI";
import { ComponentSpecUI } from "./componentSpecUI";

export class SpaceshipOutfittingUI {
    readonly root: HTMLDivElement;

    private readonly componentList: HTMLDivElement;

    private readonly componentBrowser: ComponentBrowserUI;

    private readonly rightPanel: HTMLDivElement;

    private readonly equippedComponentSpec: ComponentSpecUI;

    private readonly storeButton: HTMLButtonElement;

    private readonly sellButton: HTMLButtonElement;

    private readonly selectedComponentSpec: ComponentSpecUI;

    private readonly buyEquipButton: HTMLButtonElement;

    private readonly equipButton: HTMLButtonElement;

    private activeSlotDiv: HTMLElement | null = null;

    private activeSlot: ComponentSlot | null = null;

    constructor(player: Player, soundPlayer: ISoundPlayer) {
        this.root = document.createElement("div");
        this.root.className = "spaceshipOutfittingUI";

        this.componentList = document.createElement("div");
        this.componentList.className = "flex-column";
        this.root.appendChild(this.componentList);

        this.componentBrowser = new ComponentBrowserUI();
        this.componentBrowser.onComponentSelect.add((component) => {
            this.selectedComponentSpec.displayComponent(component);

            const isComponentOwned = player.spareSpaceshipComponents.has(component);

            this.equipButton.disabled = !isComponentOwned;
            this.buyEquipButton.disabled = isComponentOwned;
        });
        this.root.appendChild(this.componentBrowser.root);

        this.rightPanel = document.createElement("div");
        this.rightPanel.style.display = "flex";
        this.rightPanel.style.flexDirection = "column";
        this.rightPanel.style.background = "transparent";
        this.rightPanel.style.padding = "0px";
        this.rightPanel.style.rowGap = "10px";
        this.root.appendChild(this.rightPanel);

        const equippedComponentTitle = document.createElement("h3");
        equippedComponentTitle.innerText = i18n.t("spaceStation:equippedComponent");
        this.rightPanel.appendChild(equippedComponentTitle);

        this.equippedComponentSpec = new ComponentSpecUI(i18n.t("spaceStation:noComponentEquippedOnSlot"));
        this.equippedComponentSpec.root.style.flexGrow = "1";
        this.equippedComponentSpec.root.style.flex = "1";
        this.rightPanel.appendChild(this.equippedComponentSpec.root);

        const rowContainer = document.createElement("div");
        rowContainer.style.display = "flex";
        rowContainer.style.flexDirection = "row";
        rowContainer.style.columnGap = "10px";
        rowContainer.style.padding = "0px";
        rowContainer.style.background = "transparent";
        this.rightPanel.appendChild(rowContainer);

        this.storeButton = document.createElement("button");
        this.storeButton.style.flexGrow = "1";
        this.storeButton.innerText = i18n.t("spaceStation:storeButton");
        this.storeButton.disabled = true;
        this.storeButton.addEventListener("click", () => {
            if (this.activeSlot === null) {
                return;
            }

            const component = this.activeSlot.getComponent();
            if (component === null) {
                return;
            }

            this.activeSlot.setComponent(null);
            player.spareSpaceshipComponents.add(component.serialize());

            this.handleClickOnSlot(this.activeSlot, player);
        });
        rowContainer.appendChild(this.storeButton);

        this.sellButton = document.createElement("button");
        this.sellButton.style.flexGrow = "1";
        this.sellButton.innerText = i18n.t("spaceStation:sellButton");
        this.sellButton.disabled = true;
        this.sellButton.addEventListener("click", async () => {
            if (this.activeSlot === null) {
                return;
            }

            const component = this.activeSlot.getComponent();
            if (component === null) {
                return;
            }

            soundPlayer.playNow("click");

            const componentValue = getComponentValue(component.serialize());
            const componentSellingPrice = componentValue * 0.75;

            if (
                !(await promptModalBoolean(
                    i18n.t("spaceStation:sellConfirmation", {
                        price: `${componentSellingPrice.toLocaleString()} ${Settings.CREDIT_SYMBOL}`,
                    }),
                    soundPlayer,
                ))
            ) {
                return;
            }

            this.activeSlot.setComponent(null);

            player.earn(componentSellingPrice);

            this.handleClickOnSlot(this.activeSlot, player);
        });
        rowContainer.appendChild(this.sellButton);

        const selectedComponentTitle = document.createElement("h3");
        selectedComponentTitle.innerText = i18n.t("spaceStation:selectedComponent");
        this.rightPanel.appendChild(selectedComponentTitle);

        this.selectedComponentSpec = new ComponentSpecUI(i18n.t("spaceStation:noComponentSelected"));
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
        this.buyEquipButton.innerText = i18n.t("spaceStation:buyEquipButton");
        this.buyEquipButton.disabled = true;
        this.buyEquipButton.addEventListener("click", () => {
            if (this.activeSlot === null) {
                return;
            }

            const selectedComponent = this.componentBrowser.getSelectedComponent();
            if (selectedComponent === null) {
                return;
            }

            const currentComponent = this.activeSlot.getComponent();
            if (currentComponent !== null) {
                this.activeSlot.setComponent(null);
                player.spareSpaceshipComponents.add(currentComponent.serialize());
            }

            const componentPrice = getComponentValue(selectedComponent);
            player.pay(componentPrice);
            this.activeSlot.setComponent(deserializeComponent(selectedComponent));

            this.handleClickOnSlot(this.activeSlot, player);
        });
        rowContainer2.appendChild(this.buyEquipButton);

        this.equipButton = document.createElement("button");
        this.equipButton.style.flexGrow = "1";
        this.equipButton.innerText = i18n.t("spaceStation:equipButton");
        this.equipButton.disabled = true;
        this.equipButton.addEventListener("click", () => {
            if (this.activeSlot === null) {
                return;
            }

            const selectedComponent = this.componentBrowser.getSelectedComponent();
            if (selectedComponent === null) {
                return;
            }

            if (!player.spareSpaceshipComponents.has(selectedComponent)) {
                return;
            }

            const currentComponent = this.activeSlot.getComponent();
            if (currentComponent !== null) {
                this.activeSlot.setComponent(null);
                player.spareSpaceshipComponents.add(currentComponent.serialize());
            }

            this.activeSlot.setComponent(deserializeComponent(selectedComponent));
            player.spareSpaceshipComponents.delete(selectedComponent);

            this.handleClickOnSlot(this.activeSlot, player);
        });
        rowContainer2.appendChild(this.equipButton);
    }

    generate(shipInternals: SpaceshipInternals, player: Player, soundPlayer: ISoundPlayer) {
        this.componentList.innerHTML = "";

        const primaryH2 = document.createElement("h2");
        primaryH2.innerText = i18n.t("spaceStation:primarySlots");
        this.componentList.appendChild(primaryH2);

        const warpDriveSlot = this.createComponentSlotUI(shipInternals.primary.warpDrive, player, soundPlayer);
        this.componentList.appendChild(warpDriveSlot);

        const thrustersSlot = this.createComponentSlotUI(shipInternals.primary.thrusters, player, soundPlayer);
        this.componentList.appendChild(thrustersSlot);

        const fuelTankSlot = this.createComponentSlotUI(shipInternals.primary.fuelTank, player, soundPlayer);
        this.componentList.appendChild(fuelTankSlot);

        const optionalH2 = document.createElement("h2");
        optionalH2.innerText = i18n.t("spaceStation:optionalSlots");
        this.componentList.appendChild(optionalH2);

        for (const componentSlot of shipInternals.optionals) {
            const componentSlotUI = this.createComponentSlotUI(componentSlot, player, soundPlayer);
            this.componentList.appendChild(componentSlotUI);
        }
    }

    private createComponentSlotUI(
        componentSlot: ComponentSlot,
        player: Player,
        soundPlayer: ISoundPlayer,
    ): HTMLElement {
        const slotUI = document.createElement("button");
        const component = componentSlot.getComponent();
        slotUI.textContent = component !== null ? getComponentTypeI18n(component.type) : i18n.t("components:emptySlot");
        slotUI.classList.add("componentSlot");
        slotUI.addEventListener("click", () => {
            soundPlayer.playNow("click");
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
        this.equippedComponentSpec.displayComponent(componentSlot.getComponent()?.serialize() ?? null);
        this.storeButton.disabled = componentSlot.getComponent() === null;
        this.sellButton.disabled = componentSlot.getComponent() === null;

        this.selectedComponentSpec.displayComponent(null);
        this.buyEquipButton.disabled = true;
        this.equipButton.disabled = true;

        this.activeSlot = componentSlot;

        if (componentSlot.types.length > 1) {
            this.componentBrowser.browseCategories(
                componentSlot.types,
                componentSlot.maxSize,
                player.spareSpaceshipComponents,
            );
        } else if (componentSlot.types[0] !== undefined) {
            this.componentBrowser.browse(
                componentSlot.types[0],
                componentSlot.maxSize,
                player.spareSpaceshipComponents,
            );
        }
    }
}
