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
    ClusteredLightContainer,
    Color3,
    GlowLayer,
    HemisphericLight,
    Scene,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { LandingPad } from "@/frontend/assets/procedural/spaceStation/landingPad/landingPad";
import { LandingPadMaterial } from "@/frontend/assets/procedural/spaceStation/landingPad/landingPadMaterial";
import {
    ProceduralSpotLightInstances,
    type ProceduralSpotLightInstanceData,
} from "@/frontend/assets/procedural/spotLight";
import { loadConcreteTextures } from "@/frontend/assets/textures/concrete";
import { createSquareTextDecalTexture } from "@/frontend/assets/textures/squareTextDecalTexture";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { enablePhysics } from "./utils";

export async function createLandingPadScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.clearColor.set(0.1, 0.1, 0.1, 1);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const controls = new DefaultControls(scene);
    controls.speed = 10;

    const camera = controls.getActiveCamera();
    camera.attachControl();

    controls.getTransform().position.copyFromFloats(0, 30, -100);
    lookAt(controls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    const textures = await loadConcreteTextures(scene, progressMonitor);
    const landingPadMaterial = new LandingPadMaterial(textures, scene);

    const decalTexture = createSquareTextDecalTexture("LandingPadCenterDecal", "A1", scene);

    const landingPad = new LandingPad("LandingPad", LandingPadSize.MEDIUM, landingPadMaterial, scene, {
        centerDecalTexture: decalTexture,
    });

    const spotLights = new ProceduralSpotLightInstances(Math.PI / 2, scene);

    const instanceData: Array<ProceduralSpotLightInstanceData> = [];
    for (const corner of landingPad.getCorners()) {
        instanceData.push({
            rootPosition: corner,
            lookAtTarget: landingPad.getTransform().position,
            color: Color3.White(),
            upDirection: landingPad.getTransform().up,
            range: 50 * landingPad.getPadSize(),
            postHeight: 10 * landingPad.getPadSize(),
            lampSize: 2,
        });
    }
    spotLights.setInstances(instanceData);

    new ClusteredLightContainer("lightContainer", spotLights.lights, scene);

    const ambient = new HemisphericLight("ambientLight", Vector3.Up(), scene);
    ambient.intensity = 0.3;

    new GlowLayer("glow", scene);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        controls.update(deltaSeconds);
    });

    return scene;
}
