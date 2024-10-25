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

import { EditorPanel } from "../editorPanel";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Slider } from "handle-sliderjs";
import { Settings } from "../../../settings";
import { ColorCorrection } from "../../../postProcesses/colorCorrection";
import { getRotationQuaternion, rotate } from "../../../uberCore/transforms/basicTransform";

import { HasBoundingSphere } from "../../../architecture/hasBoundingSphere";
import { Transformable } from "../../../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";
import { Tools } from "@babylonjs/core/Misc/tools";
import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";

export class GeneralPanel extends EditorPanel {
    constructor() {
        super("general");
    }

    init(body: Transformable & HasBoundingSphere, colorCorrection: ColorCorrection, bloom: BloomEffect, scene: Scene) {
        this.enable();

        for (const slider of this.sliders) slider.remove();

        const axialTilt = getRotationQuaternion(body.getTransform()).toEulerAngles();

        const power = 2.0;

        this.sliders = [
            new Slider("axialTiltX", document.getElementById("axialTiltX") as HTMLElement, -180, 180, Math.round(Tools.ToDegrees(axialTilt.x)), (val: number) => {
                const newAxialTilt = Tools.ToRadians(val);
                rotate(body.getTransform(), Axis.X, newAxialTilt - axialTilt.x);
                axialTilt.x = newAxialTilt;
            }),
            new Slider("axialTiltZ", document.getElementById("axialTiltZ") as HTMLElement, -180, 180, Math.round(Tools.ToDegrees(axialTilt.z)), (val: number) => {
                const newAxialTilt = Tools.ToRadians(val);
                rotate(body.getTransform(), Axis.Z, newAxialTilt - axialTilt.z);
                axialTilt.z = newAxialTilt;
            }),
            new Slider("cameraFOV", document.getElementById("cameraFOV") as HTMLElement, 0, 360, Tools.ToDegrees(Settings.FOV), (val: number) => {
                scene.cameras.forEach((camera) => (camera.fov = Tools.ToRadians(val)));
                console.log(val);
                Settings.FOV = Tools.ToRadians(val);
            }),
            new Slider("timeModifier", document.getElementById("timeModifier") as HTMLElement, -200, 400, Math.pow(Settings.TIME_MULTIPLIER, 1 / power), (val: number) => {
                Settings.TIME_MULTIPLIER = Math.sign(val) * Math.pow(Math.abs(val), power);
            }),
            new Slider("exposure", document.getElementById("exposure") as HTMLElement, 0, 200, colorCorrection.exposure * 100, (val: number) => {
                colorCorrection.exposure = val / 100;
            }),
            new Slider("contrast", document.getElementById("contrast") as HTMLElement, 0, 200, colorCorrection.contrast * 100, (val: number) => {
                colorCorrection.contrast = val / 100;
            }),
            new Slider("brightness", document.getElementById("brightness") as HTMLElement, -100, 100, colorCorrection.brightness * 100, (val: number) => {
                colorCorrection.brightness = val / 100;
            }),
            new Slider("saturation", document.getElementById("saturation") as HTMLElement, 0, 200, colorCorrection.saturation * 100, (val: number) => {
                colorCorrection.saturation = val / 100;
            }),
            new Slider("gamma", document.getElementById("gamma") as HTMLElement, 0, 300, colorCorrection.gamma * 100, (val: number) => {
                colorCorrection.gamma = val / 100;
            }),
            new Slider("bloomThreshold", document.getElementById("bloomThreshold") as HTMLElement, 0, 100, bloom.threshold * 100, (val: number) => {
                bloom.threshold = val / 100;
            }),
            new Slider("bloomWeight", document.getElementById("bloomWeight") as HTMLElement, 0, 600, bloom.weight * 100, (val: number) => {
                bloom.weight = val / 100;
            }),
            new Slider("bloomKernel", document.getElementById("bloomKernel") as HTMLElement, 0, 100, bloom.kernel, (val: number) => {
                bloom.kernel = val;
            })
        ];
    }
}
