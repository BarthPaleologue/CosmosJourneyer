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

import { Settings } from "@/settings";

import { pressInteractionToStrings } from "../helpers/inputControlsString";
import type { InteractionSystem } from "../inputs/interaction/interactionSystem";

export class InteractionLayer {
    readonly root: HTMLDivElement;

    private readonly interactionText: HTMLDivElement;

    private readonly crosshair: HTMLDivElement;

    private readonly interactionSystem: InteractionSystem;

    constructor(interactionSystem: InteractionSystem) {
        this.root = document.createElement("div");
        this.root.style.position = "absolute";
        this.root.style.top = "0";
        this.root.style.left = "0";
        this.root.style.width = "100%";
        this.root.style.height = "100%";
        this.root.style.pointerEvents = "none";
        this.root.style.display = "flex";
        this.root.style.alignItems = "center";
        this.root.style.justifyContent = "center";
        this.root.style.fontFamily = Settings.MAIN_FONT;

        this.interactionText = document.createElement("div");
        this.interactionText.style.textAlign = "center";
        this.interactionText.style.fontSize = "24px";
        this.interactionText.style.color = "white";
        this.interactionText.style.textShadow = "0 0 5px black";
        this.interactionText.style.pointerEvents = "auto";
        this.interactionText.style.display = "none";

        this.root.appendChild(this.interactionText);

        this.crosshair = document.createElement("div");
        this.crosshair.style.width = "5px";
        this.crosshair.style.height = "5px";
        this.crosshair.style.background = "white";
        this.crosshair.style.borderRadius = "50%";
        this.crosshair.style.pointerEvents = "none";

        this.root.appendChild(this.crosshair);

        this.interactionSystem = interactionSystem;
    }

    update() {
        const currentInteractions = this.interactionSystem.getCurrentInteractions();

        if (
            this.interactionSystem.isMakingChoice() ||
            currentInteractions === null ||
            currentInteractions[0] === undefined
        ) {
            this.interactionText.style.display = "none";
            this.crosshair.style.display = "block";
        } else {
            const keys = pressInteractionToStrings(this.interactionSystem.pressInteraction, null);
            const keyString = keys.join(" / ");
            this.interactionText.style.display = "block";
            this.interactionText.innerText = `[${keyString}] ${currentInteractions[0].label}`;
            this.crosshair.style.display = "none";
        }
    }
}
