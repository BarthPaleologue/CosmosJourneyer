//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { EditorPanel } from "../editorPanel";
import { stripAxisFromQuaternion } from "../../../utils/algebra";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Slider } from "handle-sliderjs";
import { Settings } from "../../../settings";
import { UberScene } from "../../../uberCore/uberScene";
import { ColorCorrection } from "../../../uberCore/postProcesses/colorCorrection";
import { getRotationQuaternion, rotate } from "../../../uberCore/transforms/basicTransform";

import { BoundingSphere } from "../../../architecture/boundingSphere";
import { Transformable } from "../../../architecture/transformable";

export class GeneralPanel extends EditorPanel {
    constructor() {
        super("general");
    }

    init(body: Transformable & BoundingSphere, colorCorrection: ColorCorrection, scene: UberScene) {
        this.enable();

        for (const slider of this.sliders) slider.remove();

        let axialTiltX = stripAxisFromQuaternion(getRotationQuaternion(body.getTransform()), Axis.Y).toEulerAngles().x;
        let axialTiltZ = stripAxisFromQuaternion(getRotationQuaternion(body.getTransform()), Axis.Y).toEulerAngles().z;
        //TODO: do not hardcode here
        const power = 1.4;

        this.sliders = [
            new Slider("axialTiltX", document.getElementById("axialTiltX") as HTMLElement, -180, 180, Math.round((180 * axialTiltX) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                rotate(body.getTransform(), Axis.X, newAxialTilt - axialTiltX);
                axialTiltX = newAxialTilt;
            }),
            new Slider("axialTiltZ", document.getElementById("axialTiltZ") as HTMLElement, -180, 180, Math.round((180 * axialTiltZ) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                rotate(body.getTransform(), Axis.Z, newAxialTilt - axialTiltZ);
                axialTiltZ = newAxialTilt;
            }),
            new Slider(
                "cameraFOV",
                document.getElementById("cameraFOV") as HTMLElement,
                0,
                360,
                (scene.getActiveController().getActiveCamera().fov * 360) / Math.PI,
                (val: number) => {
                    scene.getActiveController().getActiveCamera().fov = (val * Math.PI) / 360;
                    Settings.FOV = (val * Math.PI) / 360;
                }
            ),
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
            })
            /*new Slider("bloomThreshold", document.getElementById("bloomThreshold") as HTMLElement, 0, 100, bloom.threshold * 100, (val: number) => {
                bloom.threshold = val / 100;
            }),
            new Slider("bloomWeight", document.getElementById("bloomWeight") as HTMLElement, 0, 600, bloom.weight * 100, (val: number) => {
                bloom.weight = val / 100;
            })*/
        ];
    }
}
