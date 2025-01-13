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
import { clearAllEventListenersById } from "../../../utils/html";
import { Settings } from "../../../settings";
import { Slider } from "handle-sliderjs";
import { AtmosphereUniforms } from "../../../postProcesses/atmosphericScatteringPostProcess";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class AtmospherePanel extends EditorPanel {
    constructor() {
        super("atmosphere");
    }

    init(planetRadius: number, atmosphereUniforms: AtmosphereUniforms) {
        for (const slider of this.sliders) slider.remove();

        const atmosphereToggler = clearAllEventListenersById("atmosphereToggler");
        atmosphereToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            atmosphereUniforms.atmosphereRadius = checkbox.checked ? planetRadius + Settings.EARTH_ATMOSPHERE_THICKNESS : 0;
        });

        const rayleighScatteringColorPicker = document.getElementById("rayleighScattering") as HTMLInputElement;
        const rayleighConversionFactor = 128e-6;
        rayleighScatteringColorPicker.value = new Color3(
            atmosphereUniforms.rayleighScatteringCoefficients.x / rayleighConversionFactor,
            atmosphereUniforms.rayleighScatteringCoefficients.y / rayleighConversionFactor,
            atmosphereUniforms.rayleighScatteringCoefficients.z / rayleighConversionFactor
        ).toHexString();
        rayleighScatteringColorPicker.addEventListener("input", () => {
            const color = rayleighScatteringColorPicker.value;
            const color01 = Color3.FromHexString(color);
            atmosphereUniforms.rayleighScatteringCoefficients = new Vector3(color01.r, color01.g, color01.b).scaleInPlace(rayleighConversionFactor);
        });

        const mieScatteringColorPicker = document.getElementById("mieScattering") as HTMLInputElement;
        const mieConversionFactor = 16e-6;
        mieScatteringColorPicker.value = new Color3(
            atmosphereUniforms.mieScatteringCoefficients.x / mieConversionFactor,
            atmosphereUniforms.mieScatteringCoefficients.y / mieConversionFactor,
            atmosphereUniforms.mieScatteringCoefficients.z / mieConversionFactor
        ).toHexString();
        mieScatteringColorPicker.addEventListener("input", () => {
            const color = mieScatteringColorPicker.value;
            const color01 = Color3.FromHexString(color);
            atmosphereUniforms.mieScatteringCoefficients = new Vector3(color01.r, color01.g, color01.b).scaleInPlace(mieConversionFactor);
        });

        const ozoneAbsorptionColorPicker = document.getElementById("ozoneAbsorption") as HTMLInputElement;
        const ozoneConversionFactor = 8e-6;
        ozoneAbsorptionColorPicker.value = new Color3(
            atmosphereUniforms.ozoneAbsorptionCoefficients.x / ozoneConversionFactor,
            atmosphereUniforms.ozoneAbsorptionCoefficients.y / ozoneConversionFactor,
            atmosphereUniforms.ozoneAbsorptionCoefficients.z / ozoneConversionFactor
        ).toHexString();
        ozoneAbsorptionColorPicker.addEventListener("input", () => {
            const color = ozoneAbsorptionColorPicker.value;
            const color01 = Color3.FromHexString(color);
            atmosphereUniforms.ozoneAbsorptionCoefficients = new Vector3(color01.r, color01.g, color01.b).scaleInPlace(ozoneConversionFactor);
        });

        this.sliders = [
            new Slider("intensity", document.getElementById("intensity") as HTMLElement, 0, 60, atmosphereUniforms.lightIntensity, (val: number) => {
                atmosphereUniforms.lightIntensity = val;
            }),
            new Slider(
                "atmosphereRadius",
                document.getElementById("atmosphereRadius") as HTMLElement,
                0,
                100,
                (atmosphereUniforms.atmosphereRadius - planetRadius) / 10000,
                (val: number) => {
                    atmosphereUniforms.atmosphereRadius = planetRadius + val * 10000;
                }
            ),
            new Slider("rayleighHeight", document.getElementById("rayleighHeight") as HTMLElement, 0, 50, atmosphereUniforms.rayleighHeight / 1e3, (val: number) => {
                atmosphereUniforms.rayleighHeight = val * 1e3;
            }),
            new Slider("mieHeight", document.getElementById("mieHeight") as HTMLElement, 0, 50, atmosphereUniforms.mieHeight / 1e2, (val: number) => {
                atmosphereUniforms.mieHeight = val * 1e2;
            }),
            new Slider("mieAsymmetry", document.getElementById("mieAsymmetry")!, -100, 100, atmosphereUniforms.mieAsymmetry * 100, (val: number) => {
                atmosphereUniforms.mieAsymmetry = val / 100;
            }),
            new Slider("ozoneLayerHeight", document.getElementById("ozoneLayerHeight") as HTMLElement, 0, 50, atmosphereUniforms.ozoneHeight / 1e3, (val: number) => {
                atmosphereUniforms.ozoneHeight = val * 1e3;
            }),
            new Slider("ozoneHeight", document.getElementById("ozoneHeight") as HTMLElement, 0, 50, atmosphereUniforms.ozoneFalloff / 1e3, (val: number) => {
                atmosphereUniforms.ozoneFalloff = val * 1e3;
            })
        ];
    }
}
