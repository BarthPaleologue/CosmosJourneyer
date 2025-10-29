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

import { Axis } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { newSeededNeutronStarModel } from "@/backend/universe/proceduralGenerators/stellarObjects/neutronStarModelGenerator";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadTextures } from "@/frontend/assets/textures";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { LensFlarePostProcess } from "@/frontend/postProcesses/lensFlarePostProcess";
import { MatterJetPostProcess } from "@/frontend/postProcesses/matterJetPostProcess";
import { VolumetricLight } from "@/frontend/postProcesses/volumetricLight/volumetricLight";
import { NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";

import { getRgbFromTemperature } from "@/utils/specrend";

import { enablePhysics } from "../utils";

export async function createNeutronStarScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const textures = await loadTextures(scene, progressMonitor);

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2e9;

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    scene.activeCamera = camera;

    scene.enableDepthRenderer(camera, false, true);

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
    lookAt(defaultControls.getTransform(), neutronStar.getTransform().position, scene.useRightHandedSystem);

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        defaultControls.update(deltaSeconds);
        neutronStar.getTransform().rotate(Axis.Y, (2 * Math.PI * deltaSeconds) / neutronStarModel.siderealDaySeconds);
        matterJets.update(deltaSeconds);
    });

    return scene;
}
