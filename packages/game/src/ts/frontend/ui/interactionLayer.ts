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

import type { NonEmptyArray } from "@/utils/types";

import { Settings } from "@/settings";

import type { Interaction, InteractionSystem } from "../inputs/interaction/interactionSystem";

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
        this.interactionSystem.onTargetChanged.add((target) => {
            if (target === null) {
                this.interactionText.style.display = "none";
                this.crosshair.style.display = "block";
            } else {
                this.interactionText.style.display = "block";
                this.interactionText.innerText = `[E] ${target[0].label}`;
                this.crosshair.style.display = "none";
            }
        });

        this.interactionSystem.onChoiceStarted.add(() => {
            this.interactionText.style.display = "none";
        });

        this.interactionSystem.onChoiceEnded.add(() => {
            this.interactionText.style.display = "block";
        });
    }

    chooseInteraction(interactions: NonEmptyArray<Interaction>): Promise<Interaction> {
        // display a circle with options around the crosshair
        // await user choice
        const circle = document.createElement("div");
        circle.style.position = "absolute";
        circle.style.top = "50%";
        circle.style.left = "50%";
        circle.style.transform = "translate(-50%, -50%)";
        circle.style.width = "200px";
        circle.style.height = "200px";
        circle.style.borderRadius = "50%";
        circle.style.pointerEvents = "auto";
        circle.style.display = "flex";
        circle.style.alignItems = "center";
        circle.style.justifyContent = "center";
        circle.style.background = "rgba(0, 0, 0, 0.5)";

        this.root.appendChild(circle);

        for (const interaction of interactions) {
            const button = document.createElement("button");
            button.innerText = interaction.label;
            button.style.margin = "10px";
            button.style.padding = "10px";
            button.style.fontSize = "18px";
            button.style.cursor = "pointer";
            button.onclick = () => {
                this.root.removeChild(circle);
                resolve(interaction);
            };
            circle.appendChild(button);
        }

        let resolve: (interaction: Interaction) => void;
        const promise = new Promise<Interaction>((res) => {
            resolve = res;
        });

        return promise;
    }
}
