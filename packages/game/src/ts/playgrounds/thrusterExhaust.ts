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

import {
    ArcRotateCamera,
    Color3,
    DirectionalLight,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { ThrusterExhaust } from "@/frontend/spaceship/thrusterExhaust";

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

function createControlPanel(exhaust: ThrusterExhaust): HTMLDivElement {
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
        createSlider("Throttle", 0, 1, 0.01, 0.75, (value) => {
            exhaust.setThrottle(value);
            return `throttle = ${value.toFixed(2)}`;
        }),
    );
    panel.appendChild(
        createSlider("Pressure ratio", 0.005, 1, 0.001, 0.7, (value) => {
            exhaust.setPressure(value, 1);
            return `ratio = ${value.toFixed(6)}`;
        }),
    );
    panel.appendChild(
        createSlider("Roundness", 0, 1, 0.01, 1.0, (value) => {
            exhaust.setRoundness(value);
            return `roundness = ${value.toFixed(2)}`;
        }),
    );
    panel.appendChild(
        createSlider("Exhaust speed", 0, 150, 1, 50.0, (value) => {
            exhaust.setExhaustSpeed(value);
            return `speed = ${value.toFixed(0)}`;
        }),
    );

    document.body.appendChild(panel);
    return panel;
}

export function createThrusterExhaustScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const camera = new ArcRotateCamera(
        "thrusterExhaustCamera",
        -Math.PI * 0.5 * 0,
        Math.PI * 0.5,
        5,
        new Vector3(0, -2, 0),
        scene,
    );
    camera.lowerRadiusLimit = 2.5;
    camera.upperRadiusLimit = 30;
    camera.wheelPrecision = 35;
    camera.attachControl();
    scene.activeCamera = camera;

    const hemi = new HemisphericLight("thrusterExhaustHemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.35;

    const dir = new DirectionalLight("thrusterExhaustDir", new Vector3(0.4, -1, 0.3), scene);
    dir.intensity = 0.5;

    const body = MeshBuilder.CreateCylinder("thrusterBody", { height: 0.5, diameter: 0.5, tessellation: 48 }, scene);

    const nozzleHeight = 0.7;
    const nozzle = MeshBuilder.CreateCylinder(
        "thrusterNozzle",
        { height: nozzleHeight, diameterTop: 0.12, diameterBottom: 0.8, tessellation: 64, cap: Mesh.NO_CAP },
        scene,
    );
    nozzle.position.y = -nozzleHeight / 2;

    const metal = new PBRMetallicRoughnessMaterial("thrusterMetal", scene);
    metal.baseColor = new Color3(0.25, 0.26, 0.28);
    metal.metallic = 1.0;
    metal.roughness = 0.35;
    metal.backFaceCulling = false;
    body.material = metal;
    nozzle.material = metal;

    const exhaust = new ThrusterExhaust("playgroundThrusterExhaust", scene, {
        emissionIntensity: 1.0,
    });
    exhaust.getTransform().parent = nozzle;
    exhaust.setThrottle(0.75);
    exhaust.setLength(4);
    exhaust.getTransform().position.y = -nozzleHeight / 2;

    const panel = createControlPanel(exhaust);
    scene.onDisposeObservable.add(() => {
        panel.remove();
    });

    scene.onBeforeRenderObservable.add(() => {
        exhaust.update(engine.getDeltaTime() / 1000);
    });

    return Promise.resolve(scene);
}
