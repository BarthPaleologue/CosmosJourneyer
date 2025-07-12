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

import { Axis, Color4 } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { newSeededNeutronStarModel } from "@/backend/universe/proceduralGenerators/stellarObjects/neutronStarModelGenerator";

import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { LensFlarePostProcess } from "@/frontend/postProcesses/lensFlarePostProcess";
import { MatterJetPostProcess } from "@/frontend/postProcesses/matterJetPostProcess";
import { VolumetricLight } from "@/frontend/postProcesses/volumetricLight/volumetricLight";
import { translate } from "@/frontend/uberCore/transforms/basicTransform";
import { NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";

import { getRgbFromTemperature } from "@/utils/specrend";

import { enablePhysics } from "../utils";

export async function createNeutronStarScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const textures = await loadTextures((loadedCount, totalCount, itemName) => {
        progressCallback(loadedCount / totalCount, `Loading ${itemName}`);
    }, scene);

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000;

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();
    camera.maxZ = 0;

    scene.activeCamera = camera;

    const depthRenderer = scene.enableDepthRenderer(camera, true, true);
    depthRenderer.clearColor = new Color4(0, 0, 0, 1);

    const neutronStarModel = newSeededNeutronStarModel("neutronStar", 456, "Neutron Star Demo", []);
    const neutronStar = new NeutronStar(neutronStarModel, textures, scene);
    neutronStar.getTransform().position = new Vector3(0, 0, 1).scaleInPlace(neutronStar.getRadius() * 2000000);

    const volumetricLight = new VolumetricLight(neutronStar.mesh, neutronStar.volumetricLightUniforms, [], scene);
    camera.attachPostProcess(volumetricLight);

    const matterJets = new MatterJetPostProcess(
        neutronStar.getTransform(),
        neutronStar.getRadius(),
        neutronStar.model.dipoleTilt,
        scene,
    );
    camera.attachPostProcess(matterJets);

    const lensFlare = new LensFlarePostProcess(
        neutronStar.getTransform(),
        neutronStar.getRadius(),
        getRgbFromTemperature(neutronStarModel.blackBodyTemperature),
        scene,
    );
    camera.attachPostProcess(lensFlare);

    camera.maxZ = 1e12;
    defaultControls.getTransform().lookAt(neutronStar.getTransform().position);

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        const displacement = defaultControls.update(deltaSeconds);

        neutronStar.getTransform().rotate(Axis.Y, (2 * Math.PI * deltaSeconds) / neutronStarModel.siderealDaySeconds);

        translate(defaultControls.getTransform(), displacement.negate());
        translate(neutronStar.getTransform(), displacement.negate());

        matterJets.update(deltaSeconds);
    });

    progressCallback(1, "Neutron Star Scene Loaded");

    return scene;
}
