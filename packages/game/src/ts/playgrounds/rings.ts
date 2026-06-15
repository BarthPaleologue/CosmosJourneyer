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

import { DirectionalLight, MeshBuilder, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { type RingsModel } from "@cosmos-journeyer/universe-model";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { lookAt } from "@/frontend/helpers/transform";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";

import { ItemPool } from "@/utils/itemPool";

export async function createRingsScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    const scalingFactor = 10_000e3;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 5, -10).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);
    camera.attachControl();

    const depthRendererManager = new DepthRendererManager(scene);

    const light = new DirectionalLight("light1", new Vector3(1, -0.5, 2).normalize(), scene);
    light.intensity = 0.7;

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 * scalingFactor, segments: 32 }, scene);

    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));

    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get("seed");

    const ringsModel: RingsModel = {
        innerRadius: 1.7 * scalingFactor,
        outerRadius: 3.5 * scalingFactor,
        type: "procedural",
        seed: seed !== null ? Number(seed) : Math.random() * 1000,
        frequency: 10.0,
        iceAlbedo: { r: 0.93, g: 0.92, b: 0.9 },
        dustAlbedo: { r: 156 / 255, g: 132 / 255, b: 108 / 255 },
    };

    const ringsUniforms = RingsUniforms.NewProcedural(ringsModel, ringsLutPool, 0, scene);

    await new Promise<void>((resolve) => {
        if (ringsUniforms.patternLut.type === "procedural") {
            ringsUniforms.patternLut.lut.getTexture().executeWhenReady(() => {
                resolve();
            });
        }
    });

    const rings = new CelestialBodyUberShaderPass(
        sphere,
        scalingFactor,
        false,
        {
            atmosphere: null,
            clouds: null,
            ocean: null,
            rings: ringsUniforms,
        },
        [light],
        [
            {
                getTransform: () => sphere,
                getBoundingRadius: () => scalingFactor,
            },
        ],
        null,
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(rings);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    return scene;
}
