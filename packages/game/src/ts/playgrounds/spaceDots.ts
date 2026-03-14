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

import { Color4, FreeCamera, GlowLayer, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { SpaceDots } from "@/frontend/assets/procedural/spaceDots";

const DEFAULT_THROTTLE = 0.6;

export function createSpaceDotsScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor = new Color4(0, 0, 0, 1);

    const camera = new FreeCamera("camera", new Vector3(0, 0, 80), scene);
    camera.setTarget(new Vector3(0, 0, -80));
    camera.minZ = 0.1;
    camera.attachControl();

    const spaceDots = new SpaceDots(scene);
    spaceDots.setThrottle(DEFAULT_THROTTLE);
    const controls = createControlPanel(spaceDots);

    new GlowLayer("glow", scene);

    scene.onBeforeRenderObservable.add(() => {
        if (controls.isPaused()) {
            return;
        }

        const deltaSeconds = engine.getDeltaTime() / 1000;
        spaceDots.update(deltaSeconds);
    });

    return Promise.resolve(scene);
}

function createSlider(
    title: string,
    min: number,
    max: number,
    step: number,
    initialValue: number,
    onInput: (value: number) => string,
): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.style.display = "grid";
    wrapper.style.gap = "0.35rem";

    const titleElement = document.createElement("span");
    titleElement.textContent = title;
    titleElement.style.fontSize = "0.9rem";
    titleElement.style.fontWeight = "600";
    wrapper.appendChild(titleElement);

    const valueElement = document.createElement("span");
    valueElement.style.fontFamily = "monospace";
    valueElement.style.fontSize = "0.75rem";
    valueElement.style.opacity = "0.8";
    wrapper.appendChild(valueElement);

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initialValue);
    input.addEventListener("input", () => {
        valueElement.textContent = onInput(Number(input.value));
    });
    wrapper.appendChild(input);

    valueElement.textContent = onInput(initialValue);

    return wrapper;
}

function createButton(label: string, onClick: () => string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.padding = "0.65rem 0.8rem";
    button.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    button.style.borderRadius = "0.65rem";
    button.style.background = "rgba(255, 255, 255, 0.08)";
    button.style.color = "white";
    button.style.cursor = "pointer";
    button.style.fontFamily = "monospace";
    button.style.fontSize = "0.85rem";
    button.addEventListener("click", () => {
        button.textContent = onClick();
    });

    return button;
}

function createControlPanel(spaceDots: SpaceDots): { panel: HTMLDivElement; isPaused: () => boolean } {
    let paused = false;

    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "1rem";
    panel.style.right = "1rem";
    panel.style.display = "grid";
    panel.style.gap = "0.9rem";
    panel.style.width = "18rem";
    panel.style.padding = "1rem";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    panel.style.borderRadius = "0.75rem";
    panel.style.background = "rgba(5, 10, 20, 0.72)";
    panel.style.color = "white";
    panel.style.fontFamily = "monospace";

    panel.appendChild(
        createSlider("Throttle", 0, 1, 0.01, DEFAULT_THROTTLE, (value) => {
            spaceDots.setThrottle(value);
            return `throttle = ${value.toFixed(2)}`;
        }),
    );

    panel.appendChild(
        createButton("Pause time", () => {
            paused = !paused;
            return paused ? "Resume time" : "Pause time";
        }),
    );

    document.body.appendChild(panel);
    return {
        panel,
        isPaused: () => paused,
    };
}
