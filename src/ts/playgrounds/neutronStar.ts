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

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { enablePhysics } from "./utils";
import { DefaultControls } from "../defaultControls/defaultControls";
import { Assets } from "../assets/assets";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { newSeededNeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModelGenerator";
import { MatterJetPostProcess } from "../postProcesses/matterJetPostProcess";
import { VolumetricLight } from "../volumetricLight/volumetricLight";
import { translate } from "../uberCore/transforms/basicTransform";

export async function createNeutronStarScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    await Assets.Init(scene);

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000;

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    scene.activeCamera = camera;

    scene.enableDepthRenderer(camera, false, true);

    const neutronStarModel = newSeededNeutronStarModel(456, "Neutron Star Demo", []);
    const neutronStar = new NeutronStar(neutronStarModel, scene);
    neutronStar.getTransform().position = new Vector3(0, 0, 1).scaleInPlace(neutronStar.getRadius() * 10);

    const volumetricLight = new VolumetricLight(neutronStar.mesh, neutronStar.volumetricLightUniforms, [], scene);
    camera.attachPostProcess(volumetricLight);

    const matterJets = new MatterJetPostProcess(neutronStar.getTransform(), neutronStar.getRadius(), scene);
    camera.attachPostProcess(matterJets);

    camera.maxZ = neutronStar.getRadius() * 100;
    defaultControls.getTransform().lookAt(neutronStar.getTransform().position);

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        const displacement = defaultControls.update(deltaSeconds);

        translate(defaultControls.getTransform(), displacement.negate());
        translate(neutronStar.getTransform(), displacement.negate());

        matterJets.update(deltaSeconds);
    });

    return scene;
}
