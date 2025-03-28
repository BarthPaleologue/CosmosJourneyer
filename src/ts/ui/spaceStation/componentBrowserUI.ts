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

import { SerializedComponent } from "../../spaceship/serializedComponents/component";

export class ComponentBrowserUI {
    readonly root: HTMLDivElement;

    constructor() {
        this.root = document.createElement("div");
        this.root.classList.add("componentBrowserUI", "flex-row", "flex-wrap");
        this.root.innerText = "no component selected";
    }

    browserAllCategories(maxComponentSize: number) {
        this.root.innerHTML = "";

        const warpDriveCategory = this.createCategoryButton("warpDrive", maxComponentSize);
        this.root.appendChild(warpDriveCategory);

        const fuelTankCategory = this.createCategoryButton("fuelTank", maxComponentSize);
        this.root.appendChild(fuelTankCategory);

        const fuelScoopCategory = this.createCategoryButton("fuelScoop", maxComponentSize);
        this.root.appendChild(fuelScoopCategory);

        const thrustersCategory = this.createCategoryButton("thrusters", maxComponentSize);
        this.root.appendChild(thrustersCategory);
    }

    browse(componentType: SerializedComponent["type"], maxComponentSize: number) {
        this.root.innerHTML = "";

        this.root.innerText = `Browsing ${componentType} components below size ${maxComponentSize}`;
    }

    private createCategoryButton(type: SerializedComponent["type"], maxComponentSize: number): HTMLElement {
        const categoryButton = document.createElement("button");
        categoryButton.className = "componentCategory";
        categoryButton.innerText = type;
        categoryButton.addEventListener("click", () => {
            this.browse(type, maxComponentSize);
        });
        return categoryButton;
    }
}
