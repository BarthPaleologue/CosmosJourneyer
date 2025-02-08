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
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LandingPad, LandingPadSize } from "../assets/procedural/landingPad/landingPad";
import { Transformable } from "../architecture/transformable";
import { TransformNode } from "@babylonjs/core";
import { Assets } from "../assets/assets";
import { enablePhysics } from "./utils";
import { DefaultControls } from "../defaultControls/defaultControls";
import { Spaceship } from "../spaceship/spaceship";

export async function createAutomaticLandingScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    await Assets.Init(scene);

    const ship = Spaceship.CreateDefault(scene);
    ship.getTransform().position.copyFromFloats(0, 20, 0);

    const defaultControls = new DefaultControls(scene);
    defaultControls.getTransform().position.copyFromFloats(0, 10, -50);
    defaultControls.speed *= 10;

    const camera = defaultControls.getActiveCamera();
    camera.minZ = 0.1;
    camera.attachControl();

    const landingPad = new LandingPad(0, LandingPadSize.SMALL, scene);

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 1.0;

    const sunTransform = new TransformNode("sun", scene);
    sunTransform.position.copyFromFloats(0, 50, 0);

    const sun: Transformable = {
        getTransform: () => sunTransform,
        dispose: () => sunTransform.dispose()
    };

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        ship.update(deltaSeconds);

        defaultControls.update(deltaSeconds);

        landingPad.update([sun], camera.globalPosition);
    });

    return scene;
}
