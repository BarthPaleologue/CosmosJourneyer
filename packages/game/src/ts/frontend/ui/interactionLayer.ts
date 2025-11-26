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

import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";

import { Settings } from "@/settings";

import { pressInteractionToStrings } from "../helpers/inputControlsString";
import type { InteractionSystem } from "../inputs/interaction/interactionSystem";

export class InteractionLayer {
    readonly root: HTMLDivElement;

    private readonly interactionText: HTMLDivElement;

    private readonly crosshair: HTMLDivElement;

    private readonly interactionSystem: InteractionSystem;

    private bodyToFadeIn: PhysicsBody | null = null;
    private readonly bodiesToFadeOut = new Set<PhysicsBody>();

    private readonly overlayColor = { r: 0.5, g: 0.5, b: 1 };
    private readonly overlayAlpha = 0.2;

    private readonly edgesColor = { r: 0.5, g: 0.5, b: 1 };
    private readonly edgesAlpha = 1;

    private readonly fadeOutSeconds = 0.1;
    private readonly fadeInSeconds = 0.1;

    private readonly keyboardLayoutMap: Map<string, string> | null;

    constructor(interactionSystem: InteractionSystem, keyboardLayoutMap: Map<string, string> | null) {
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
        this.keyboardLayoutMap = keyboardLayoutMap;
    }

    public update(deltaSeconds: number) {
        this.updateFadeAnimations(deltaSeconds);

        const activeCamera = this.interactionSystem.scene.activeCamera;
        if (activeCamera === null) {
            console.warn("No active camera in scene");
            return;
        }

        if (!this.interactionSystem.isEnabledForCamera(activeCamera)) {
            this.setVisible(false);
            return;
        } else {
            this.setVisible(true);
        }

        const currentInteractions = this.interactionSystem.getCurrentInteractions();

        if (
            this.interactionSystem.isMakingChoice() ||
            currentInteractions === null ||
            currentInteractions[0] === undefined
        ) {
            this.interactionText.style.display = "none";
            this.crosshair.style.display = "block";
        } else {
            const keys = pressInteractionToStrings(this.interactionSystem.pressInteraction, this.keyboardLayoutMap);
            const keyString = keys.join(" / ");
            this.interactionText.style.display = "block";
            this.interactionText.innerText = `[${keyString}] ${currentInteractions[0].label}`;
            this.crosshair.style.display = "none";
        }
    }

    private updateFadeAnimations(deltaSeconds: number) {
        const currentTarget = this.interactionSystem.getCurrentTarget();
        if (currentTarget === null && this.bodyToFadeIn !== null) {
            this.bodiesToFadeOut.add(this.bodyToFadeIn);
            this.bodyToFadeIn = null;
        } else if (currentTarget !== null && this.bodyToFadeIn !== currentTarget) {
            if (this.bodyToFadeIn !== null) {
                this.bodiesToFadeOut.add(this.bodyToFadeIn);
            }
            this.bodyToFadeIn = currentTarget;
            this.bodiesToFadeOut.delete(currentTarget);
        }

        this.updateFadeIn(deltaSeconds);
        this.updateFadeOut(deltaSeconds);
    }

    private updateFadeIn(deltaSeconds: number) {
        if (this.bodyToFadeIn === null) {
            return;
        }
        const transform = this.bodyToFadeIn.transformNode;
        if (!(transform instanceof AbstractMesh)) {
            return;
        }

        if (!transform.renderOverlay) {
            transform.renderOverlay = true;
            transform.overlayColor.set(this.overlayColor.r, this.overlayColor.g, this.overlayColor.b);
            transform.overlayAlpha = 0;
        }

        if (transform.edgesRenderer === null) {
            transform.enableEdgesRendering();
            transform.edgesColor.set(this.edgesColor.r, this.edgesColor.g, this.edgesColor.b, 0);
        }

        if (transform.overlayAlpha >= this.overlayAlpha && transform.edgesColor.a >= this.edgesAlpha) {
            return;
        }

        transform.overlayAlpha += this.overlayAlpha * (deltaSeconds / this.fadeInSeconds);
        transform.edgesColor.a += this.edgesAlpha * (deltaSeconds / this.fadeInSeconds);
    }

    private updateFadeOut(deltaSeconds: number) {
        for (const body of this.bodiesToFadeOut) {
            const transform = body.transformNode;
            if (!(transform instanceof AbstractMesh)) {
                this.bodiesToFadeOut.delete(body);
                continue;
            }

            transform.overlayAlpha -= this.overlayAlpha * (deltaSeconds / this.fadeOutSeconds);
            transform.edgesColor.a -= this.edgesAlpha * (deltaSeconds / this.fadeOutSeconds);
            if (transform.overlayAlpha <= 0) {
                transform.renderOverlay = false;
                transform.disableEdgesRendering();
                this.bodiesToFadeOut.delete(body);
            }
        }
    }

    public setVisible(isVisible: boolean) {
        this.root.style.display = isVisible ? "flex" : "none";
    }
}
