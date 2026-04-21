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

import { ArcRotateCamera, DirectionalLight, HemisphericLight, Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import {
    createProceduralRock,
    DefaultRockParameters,
    type ProceduralRockAsset,
    type RockGenerationParameters,
    updateProceduralRockGeometry,
} from "@/frontend/assets/procedural/rock/rock";
import { RockMaterial } from "@/frontend/assets/procedural/rock/rockMaterial";
import { loadTerrainTextures } from "@/frontend/assets/textures/terrains";

import { createSky } from "./utils";

type SliderControl = {
    element: HTMLElement;
    setValue: (value: number) => void;
};

function createSlider(
    title: string,
    min: number,
    max: number,
    step: number,
    initialValue: number,
    onInput: (value: number) => string,
): SliderControl {
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
    const refreshValue = (value: number) => {
        input.value = String(value);
        valueElement.textContent = onInput(Number(input.value));
    };
    input.addEventListener("input", () => {
        refreshValue(Number(input.value));
    });
    wrapper.appendChild(input);

    refreshValue(initialValue);

    return {
        element: wrapper,
        setValue: refreshValue,
    };
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

function createNumberInput(title: string, initialValue: number, onInput: (value: number) => string): SliderControl {
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
    input.type = "number";
    input.step = "1";
    input.value = String(Math.round(initialValue));
    input.style.padding = "0.55rem 0.65rem";
    input.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    input.style.borderRadius = "0.5rem";
    input.style.background = "rgba(255, 255, 255, 0.08)";
    input.style.color = "white";
    input.style.fontFamily = "monospace";

    const refreshValue = (value: number) => {
        const roundedValue = Math.round(value);
        input.value = String(roundedValue);
        valueElement.textContent = onInput(roundedValue);
    };

    input.addEventListener("change", () => {
        const nextValue = Number(input.value);
        if (Number.isFinite(nextValue)) {
            refreshValue(nextValue);
        }
    });
    wrapper.appendChild(input);

    refreshValue(initialValue);

    return {
        element: wrapper,
        setValue: refreshValue,
    };
}

function createControlPanel(rockAsset: ProceduralRockAsset, parameters: RockGenerationParameters): HTMLDivElement {
    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "1rem";
    panel.style.right = "1rem";
    panel.style.display = "grid";
    panel.style.gap = "0.9rem";
    panel.style.width = "20rem";
    panel.style.maxHeight = "calc(100vh - 2rem)";
    panel.style.overflowY = "auto";
    panel.style.padding = "1rem";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.22)";
    panel.style.borderRadius = "0.75rem";
    panel.style.background = "rgba(5, 10, 20, 0.92)";
    panel.style.color = "white";
    panel.style.fontFamily = "monospace";

    const rebuild = () => {
        updateProceduralRockGeometry(rockAsset, parameters);
    };
    const sliderControls: Array<{ key: keyof RockGenerationParameters; control: SliderControl }> = [];

    const seedControl = createNumberInput("Seed", parameters.seed, (value) => {
        parameters.seed = value;
        rebuild();
        return `seed = ${value}`;
    });
    panel.appendChild(seedControl.element);

    panel.appendChild(
        createButton("Reset parameters", () => {
            Object.assign(parameters, DefaultRockParameters);
            seedControl.setValue(parameters.seed);
            for (const sliderControl of sliderControls) {
                sliderControl.control.setValue(parameters[sliderControl.key]);
            }
            return "Reset parameters";
        }),
    );
    panel.appendChild(
        createButton("Clear rock", () => {
            parameters.seed = 0;
            seedControl.setValue(0);
            for (const sliderControl of sliderControls) {
                const value =
                    sliderControl.key === "verticalSquash"
                        ? 1
                        : sliderControl.key === "warpStrength" ||
                            sliderControl.key === "smoothness" ||
                            sliderControl.key === "macroCellFrequency" ||
                            sliderControl.key === "microCellFrequency"
                          ? DefaultRockParameters[sliderControl.key]
                          : 0;
                sliderControl.control.setValue(value);
            }
            return "Clear rock";
        }),
    );

    const addParameterSlider = (
        label: string,
        min: number,
        max: number,
        step: number,
        key: keyof RockGenerationParameters,
        digits = 2,
    ) => {
        const control = createSlider(label, min, max, step, parameters[key], (value) => {
            parameters[key] = value;
            rebuild();
            return `${key} = ${value.toFixed(digits)}`;
        });

        sliderControls.push({ key, control });
        panel.appendChild(control.element);
    };

    addParameterSlider("Large shape", 0, 1.5, 0.01, "largeStrength");
    addParameterSlider("Medium breakup", 0, 1, 0.01, "mediumStrength");
    addParameterSlider("Chipped detail", 0, 0.4, 0.01, "chippedStrength");
    addParameterSlider("Macro cells freq", 0.4, 2.5, 0.01, "macroCellFrequency");
    addParameterSlider("Macro cells amp", 0, 0.6, 0.01, "macroCellStrength");
    addParameterSlider("Border carving", 0, 0.4, 0.01, "cellBorderStrength");
    addParameterSlider("Micro cells freq", 1, 7, 0.05, "microCellFrequency");
    addParameterSlider("Micro chips", 0, 0.2, 0.01, "microChipStrength");
    addParameterSlider("Bottom flatten", 0, 0.5, 0.01, "bottomFlatteningStrength");
    addParameterSlider("Vertical squash", 0.75, 1, 0.01, "verticalSquash");
    addParameterSlider("Smoothness", 0, 1, 0.01, "smoothness");
    addParameterSlider("Warp strength", 0, 1, 0.01, "warpStrength");

    document.body.appendChild(panel);

    return panel;
}

export async function createRockScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, 1.0, 8, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 40;
    camera.attachControl();

    const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.5;

    const directionalLight = new DirectionalLight("directionalLight", new Vector3(-0.6, -1.0, -0.4), scene);
    directionalLight.position = new Vector3(6, 10, 6);

    createSky(directionalLight.direction.scale(-1), scene);

    const textures = await loadTerrainTextures(scene, progressMonitor);

    const rockMaterial = new RockMaterial(textures.rock, scene);

    const parameters: RockGenerationParameters = { ...DefaultRockParameters };
    const rockAsset = createProceduralRock("rock", scene, parameters, {
        radius: 1.8,
        subdivisions: 9,
    });
    rockAsset.mesh.material = rockMaterial.get();

    rockAsset.mesh.thinInstanceAddSelf();

    for (let i = 0; i < 20; i++) {
        rockAsset.mesh.thinInstanceAdd(
            Matrix.Compose(
                Vector3.One().scale(0.5 + Math.random() * 0.25),
                Quaternion.FromEulerAngles(Math.random() - 0.5, Math.random() * Math.PI * 2, Math.random() - 0.5),
                new Vector3((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 70),
            ),
        );
    }

    const panel = createControlPanel(rockAsset, parameters);

    scene.onDisposeObservable.add(() => {
        panel.remove();
    });

    return Promise.resolve(scene);
}
