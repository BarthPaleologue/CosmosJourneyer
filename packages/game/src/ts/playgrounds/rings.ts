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

import { MeshBuilder, PointLight, Vector3 } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type RingsModel } from "@/backend/universe/orbitalObjects/ringsModel";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { RingsPostProcess } from "@/frontend/postProcesses/rings/ringsPostProcess";
import { RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";

import { ItemPool } from "@/utils/itemPool";

export async function createRingsScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { floatingOriginMode: true });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    const scalingFactor = 10_000e3;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    controls.getTransform().setAbsolutePosition(new Vector3(0, 5, -10).scaleInPlace(scalingFactor));
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.enableDepthRenderer();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new PointLight("light1", new Vector3(-1, 0.5, -2).scaleInPlace(10 * scalingFactor), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, options, scene
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 * scalingFactor, segments: 32 }, scene);

    const ringsLutPool = new ItemPool<RingsProceduralPatternLut>(() => new RingsProceduralPatternLut(scene));

    const ringsModel: RingsModel = {
        innerRadius: 1.7 * scalingFactor,
        outerRadius: 3.5 * scalingFactor,
        type: "procedural",
        seed: 0,
        frequency: 10.0,
        albedo: { r: 120 / 255, g: 112 / 255, b: 104 / 255 },
    };

    const ringsUniforms = RingsUniforms.NewProcedural(ringsModel, ringsLutPool, 0, scene);

    await new Promise<void>((resolve) => {
        if (ringsUniforms.patternLut.type === "procedural") {
            ringsUniforms.patternLut.lut.getTexture().executeWhenReady(() => {
                resolve();
            });
        }
    });

    const rings = new RingsPostProcess(
        sphere,
        ringsUniforms,
        { name: "Sphere", radius: 1 * scalingFactor },
        [light],
        scene,
    );
    camera.attachPostProcess(rings);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    return scene;
}
