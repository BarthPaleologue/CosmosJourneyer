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
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    NodeMaterial,
    Vector3,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture, Control, Rectangle, Slider, StackPanel, TextBlock } from "@babylonjs/gui";
import {
    f,
    normalize,
    outputFragColor,
    outputVertexPosition,
    pbr,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "babylonjs-shading-language";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadTextureAsync } from "@/frontend/assets/textures/utils";

import { getTriPlanarBlending, getTriPlanarUVs, unpackNormal, whiteoutBlend } from "@/utils/bslExtensions";
import { degreesToRadians } from "@/utils/physics/unitConversions";

import normalMapPath from "@assets/testNormal.webp";

export async function createTriPlanarNormalScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "crosshair";

    const camera = new ArcRotateCamera("camera", Math.PI / 3, Math.PI / 3, 30, Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 12;
    camera.attachControl();

    const normalMap = await loadTextureAsync("NormalMap", normalMapPath, scene, progressMonitor);

    const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1).normalize(), scene);

    const ambient = new HemisphericLight("light1", sun.direction, scene);
    ambient.intensity = 0.1;

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 15, segments: 32 }, scene);

    const material = new NodeMaterial("TelluricPlanetMaterial", scene);

    const position = vertexAttribute("position");
    const normal = vertexAttribute("normal");

    const world = uniformWorld();
    const positionW = transformPosition(world, position);
    const normalW = transformDirection(world, normal);

    const viewProjection = uniformViewProjection();
    const positionClipSpace = transformPosition(viewProjection, positionW);

    const vertexOutput = outputVertexPosition(positionClipSpace);

    const { uvX, uvY, uvZ } = getTriPlanarUVs(position);

    const normalTexture = uniformTexture2d(normalMap).source;
    const normalX01 = textureSample(normalTexture, uvX).rgb;
    const normalY01 = textureSample(normalTexture, uvY).rgb;
    const normalZ01 = textureSample(normalTexture, uvZ).rgb;

    const normalStrength = f(2.0);
    const invertY = true;
    const tangentNormalX = unpackNormal(normalX01, { normalStrength, invertY });
    const tangentNormalY = unpackNormal(normalY01, { normalStrength, invertY });
    const tangentNormalZ = unpackNormal(normalZ01, { normalStrength, invertY });

    const { finalNormalX, finalNormalY, finalNormalZ } = whiteoutBlend(
        tangentNormalX,
        tangentNormalY,
        tangentNormalZ,
        normal,
    );

    const blend = getTriPlanarBlending(normal, 16.0);
    const perturbedNormal = normalize(blend(finalNormalX, finalNormalY, finalNormalZ));
    const perturbedNormalW = transformDirection(world, perturbedNormal);

    const cameraPosition = uniformCameraPosition();
    const view = uniformView();
    const pbrShading = pbr(f(0.0), f(0.4), normalW, view, cameraPosition, positionW, {
        perturbedNormal: perturbedNormalW,
    });

    const fragOutput = outputFragColor(pbrShading.lighting);

    material.addOutputNode(vertexOutput);
    material.addOutputNode(fragOutput);
    material.build();

    sphere.material = material;

    createLightControlUi(scene, sun);

    return scene;
}

function updateLightDirection(light: DirectionalLight, azimuthDegrees: number, elevationDegrees: number) {
    const azimuth = degreesToRadians(azimuthDegrees);
    const elevation = degreesToRadians(elevationDegrees);
    const cosElevation = Math.cos(elevation);

    light.direction = new Vector3(
        Math.cos(azimuth) * cosElevation,
        Math.sin(elevation),
        Math.sin(azimuth) * cosElevation,
    ).normalize();
}

function createAngleSlider(
    label: string,
    minimum: number,
    maximum: number,
    value: number,
    onValueChanged: (value: number) => void,
) {
    const labelBlock = new TextBlock(`${label}Label`, `${label}: ${Math.round(value)}°`);
    labelBlock.height = "30px";
    labelBlock.paddingLeft = "10px";
    labelBlock.color = "white";
    labelBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

    const slider = new Slider(`${label}Slider`);
    slider.minimum = minimum;
    slider.maximum = maximum;
    slider.value = value;
    slider.height = "20px";
    slider.onValueChangedObservable.add((nextValue) => {
        const roundedValue = Math.round(nextValue);
        labelBlock.text = `${label}: ${roundedValue}°`;
        onValueChanged(nextValue);
    });

    return { labelBlock, slider };
}

function createLightControlUi(scene: Scene, light: DirectionalLight) {
    const ui = AdvancedDynamicTexture.CreateFullscreenUI("triPlanarNormalUi", true, scene);

    const panelContainer = new Rectangle("lightControlContainer");
    panelContainer.width = "240px";
    panelContainer.height = "140px";
    panelContainer.thickness = 0;
    panelContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panelContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    const panel = new StackPanel("lightControlPanel");
    panel.spacing = 6;

    let azimuth = 0;
    let elevation = 0;

    const azimuthControl = createAngleSlider("Azimuth", -180, 180, azimuth, (value) => {
        azimuth = value;
        updateLightDirection(light, azimuth, elevation);
    });
    const elevationControl = createAngleSlider("Elevation", -85, 85, elevation, (value) => {
        elevation = value;
        updateLightDirection(light, azimuth, elevation);
    });

    panel.addControl(azimuthControl.labelBlock);
    panel.addControl(azimuthControl.slider);
    panel.addControl(elevationControl.labelBlock);
    panel.addControl(elevationControl.slider);

    panelContainer.addControl(panel);
    ui.addControl(panelContainer);

    updateLightDirection(light, azimuth, elevation);

    scene.onDisposeObservable.addOnce(() => {
        ui.dispose();
    });
}
