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

import { ArcRotateCamera, HemisphericLight, Vector3 } from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { getVestaAuthoredEntityModels } from "@/backend/persistentEntities/authoredEntityModels";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { getBoundingRadius } from "@/frontend/helpers/boundingRadius";
import { initDiaryDiscussion } from "@/frontend/persistentEntities/contentLoader";

export async function createDiaryScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("camera1", Math.PI / 3, Math.PI / 3, 1, new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl();

    new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

    const model = getVestaAuthoredEntityModels()[1].content;

    const root = initDiaryDiscussion(model, scene);

    const boundingRadius = getBoundingRadius(root.getTransform());

    camera.radius = boundingRadius * 1.5;
    camera.maxZ = boundingRadius * 10;

    return Promise.resolve(scene);
}
