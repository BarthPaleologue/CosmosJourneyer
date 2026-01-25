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

import { Vector3, type AbstractEngine, type Scene } from "@babylonjs/core";

import { getSolSystemModel } from "@/backend/universe/customSystems/sol/sol";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { UberScene } from "@/frontend/helpers/uberScene";
import { PostProcessManager } from "@/frontend/postProcesses/postProcessManager";
import { TargetCursorLayer } from "@/frontend/ui/targetCursorLayer";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import { StarSystemController } from "@/frontend/universe/starSystemController";
import { StarSystemLoader } from "@/frontend/universe/starSystemLoader";

import { initI18n } from "@/i18n";
import { Settings } from "@/settings";

import { enablePhysics } from "../utils";

export async function createSolScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new UberScene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    await enablePhysics(scene);

    await initI18n();

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const scalingFactor = 6_000e3 * 11;

    const controls = new DefaultControls(scene);

    const camera = controls.getActiveCamera();
    controls.speed = scalingFactor;
    camera.maxZ *= scalingFactor;

    await scene.setActiveControls(controls);

    scene.enableDepthRenderer(null, false, true);

    const chunkForge = new ChunkForgeWorkers(Settings.VERTEX_RESOLUTION);

    const starSystemLoader = new StarSystemLoader();
    const starSystemController = await StarSystemController.CreateAsync(
        getSolSystemModel(),
        starSystemLoader,
        assets,
        scene,
    );
    starSystemController.initPositions(2, chunkForge, Date.now() / 1000);

    const sun = starSystemController.getStellarObjects()[0];

    controls.getTransform().position = sun
        .getTransform()
        .position.add(new Vector3(0, 1, -2).scaleInPlace(sun.getBoundingRadius() * 7));
    lookAt(controls.getTransform(), sun.getTransform().position, scene.useRightHandedSystem);

    const postProcessManager = new PostProcessManager(assets.textures, scene);
    postProcessManager.addCelestialBodies(
        starSystemController.getCelestialBodies(),
        starSystemController.getStellarObjects(),
        [starSystemController.starFieldBox.mesh],
    );

    const targetCursorLayer = new TargetCursorLayer();

    for (const bodies of starSystemController.getCelestialBodies()) {
        targetCursorLayer.addObject(bodies);
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        controls.update(deltaSeconds);

        chunkForge.update(assets);
        postProcessManager.update(deltaSeconds);
        starSystemController.update(deltaSeconds, chunkForge);
        targetCursorLayer.update(camera);
    });

    return scene;
}
