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

export class ComponentSpecUI {
    readonly root: HTMLElement;

    constructor() {
        this.root = document.createElement("div");
        this.root.className = "componentSpec";

        this.displayComponent(null);
    }

    displayComponent(serializedComponent: SerializedComponent | null) {
        this.root.innerHTML = "";

        if (serializedComponent === null) {
            this.root.innerText = "no component selected";
            return;
        }

        const componentName = document.createElement("h3");
        componentName.textContent = serializedComponent.type;
        this.root.appendChild(componentName);

        const componentSize = document.createElement("p");
        componentSize.textContent = `Size: ${serializedComponent.size}`;
        this.root.appendChild(componentSize);

        const componentQuality = document.createElement("p");
        componentQuality.textContent = `Quality: ${serializedComponent.quality}`;
        this.root.appendChild(componentQuality);
    }
}
