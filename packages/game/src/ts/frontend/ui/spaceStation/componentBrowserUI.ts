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

import { getComponentTypeI18n, type SerializedComponent } from "@/backend/spaceship/serializedComponents/component";

import { assertUnreachable } from "@/utils/types";

import i18n from "@/i18n";
import { Settings } from "@/settings";

export class ComponentBrowserUI {
    readonly root: HTMLDivElement;

    private placeHolderText: HTMLElement;

    private selectedComponent: SerializedComponent | null = null;

    readonly onComponentSelect = new Observable<SerializedComponent>();

    constructor() {
        this.root = document.createElement("div");
        this.root.classList.add("componentBrowserUI", "flex-column");
        this.root.style.rowGap = "10px";

        this.placeHolderText = document.createElement("p");
        this.placeHolderText.innerText = i18n.t("spaceStation:noComponentSlotSelected");
        this.placeHolderText.style.flexGrow = "1";
        this.placeHolderText.style.justifyContent = "center";
        this.placeHolderText.style.textAlign = "center";
        this.placeHolderText.style.display = "flex";
        this.placeHolderText.style.alignItems = "center";
        this.root.appendChild(this.placeHolderText);
    }

    public browseCategories(
        types: ReadonlyArray<SerializedComponent["type"]>,
        maxComponentSize: number,
        spareParts: ReadonlySet<SerializedComponent>,
    ) {
        this.root.innerHTML = "";

        types.forEach((type) => {
            this.root.appendChild(this.createCategoryButton(type, maxComponentSize, spareParts));
        });
    }

    private select(serializedComponent: SerializedComponent) {
        this.selectedComponent = serializedComponent;
        this.onComponentSelect.notifyObservers(serializedComponent);
    }

    public browse(
        componentType: SerializedComponent["type"],
        maxComponentSize: number,
        spareParts: ReadonlySet<SerializedComponent>,
    ) {
        this.root.innerHTML = "";

        const sparePartsTitle = document.createElement("h2");
        sparePartsTitle.innerText = i18n.t("spaceStation:yourSpareParts");
        this.root.appendChild(sparePartsTitle);

        const relevantSparePartsContainer = document.createElement("div");
        relevantSparePartsContainer.classList.add("flex-row", "flex-wrap");
        this.root.appendChild(relevantSparePartsContainer);

        const relevantSpareParts = new Set<SerializedComponent>();
        for (const sparePart of spareParts) {
            if (sparePart.type !== componentType || sparePart.size > maxComponentSize) {
                continue;
            }

            relevantSpareParts.add(sparePart);
        }

        relevantSpareParts.forEach((sparePart) => {
            const componentButton = document.createElement("button");
            componentButton.className = "componentCategory";
            componentButton.innerText = `${getComponentTypeI18n(sparePart.type)} ${sparePart.size}${Settings.QUALITY_CHARS.at(sparePart.quality)}`;
            componentButton.addEventListener("click", () => {
                this.select(sparePart);
            });
            relevantSparePartsContainer.appendChild(componentButton);
        });

        if (relevantSpareParts.size === 0) {
            const noSpareParts = document.createElement("p");
            noSpareParts.innerText = i18n.t("spaceStation:noOwnedSparePartsForSlot");
            relevantSparePartsContainer.appendChild(noSpareParts);
        }

        const otherSparePartsTitle = document.createElement("h2");
        otherSparePartsTitle.innerText = i18n.t("spaceStation:availableSpareParts");
        this.root.appendChild(otherSparePartsTitle);

        const otherSparePartsContainer = document.createElement("div");
        otherSparePartsContainer.classList.add("flex-row", "flex-wrap");
        this.root.appendChild(otherSparePartsContainer);

        for (let size = maxComponentSize; size <= maxComponentSize; size++) {
            for (let quality = 0; quality < Settings.QUALITY_CHARS.length; quality++) {
                const componentButton = document.createElement("button");
                componentButton.className = "componentCategory";
                componentButton.style.flex = "1";
                componentButton.innerText = `${getComponentTypeI18n(componentType)} ${size}${Settings.QUALITY_CHARS.at(quality)}`;
                componentButton.addEventListener("click", () => {
                    switch (componentType) {
                        case "warpDrive":
                        case "fuelScoop":
                        case "discoveryScanner":
                        case "thrusters":
                            this.select({
                                type: componentType,
                                size: size,
                                quality: quality,
                            });
                            break;
                        case "fuelTank":
                            this.select({
                                type: componentType,
                                size: size,
                                quality: quality,
                                currentFuel01: 1,
                            });
                            break;
                        default:
                            assertUnreachable(componentType);
                    }
                });
                otherSparePartsContainer.appendChild(componentButton);
            }
        }
    }

    public getSelectedComponent(): SerializedComponent | null {
        return this.selectedComponent;
    }

    private createCategoryButton(
        type: SerializedComponent["type"],
        maxComponentSize: number,
        spareParts: ReadonlySet<SerializedComponent>,
    ): HTMLElement {
        const categoryButton = document.createElement("button");
        categoryButton.className = "componentCategory";
        categoryButton.innerText = getComponentTypeI18n(type);
        categoryButton.addEventListener("click", () => {
            this.browse(type, maxComponentSize, spareParts);
        });
        return categoryButton;
    }
}
