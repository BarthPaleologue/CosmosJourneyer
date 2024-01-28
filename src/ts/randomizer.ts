//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { BODY_TYPE } from "./model/common";
import { SystemSeed } from "./utils/systemSeed";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { setRotationQuaternion } from "./uberCore/transforms/basicTransform";

const engine = new CosmosJourneyer();

await engine.setup();

const starSystemView = engine.getStarSystemView();

const scene = starSystemView.scene;

//check if url contains a seed
const urlParams = new URLSearchParams(window.location.search);
const urlStarMapX = urlParams.get("starMapX");
const urlStarMapY = urlParams.get("starMapY");
const urlStarMapZ = urlParams.get("starMapZ");
const urlIndex = urlParams.get("index");
const urlObjectIndex = urlParams.get("objectIndex");
const urlPositionX = urlParams.get("positionX");
const urlPositionY = urlParams.get("positionY");
const urlPositionZ = urlParams.get("positionZ");
const urlRotationX = urlParams.get("rotationQuaternionX");
const urlRotationY = urlParams.get("rotationQuaternionY");
const urlRotationZ = urlParams.get("rotationQuaternionZ");
const urlRotationW = urlParams.get("rotationQuaternionW");

const starMapX = urlStarMapX !== null ? Number(urlStarMapX) : Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const starMapY = urlStarMapY !== null ? Number(urlStarMapY) : Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const starMapZ = urlStarMapZ !== null ? Number(urlStarMapZ) : Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const index = urlIndex !== null ? Number(urlIndex) : 0;
const objectIndex = urlObjectIndex !== null ? Number(urlObjectIndex) : 0;
const positionX = urlPositionX !== null ? Number(urlPositionX) : 0;
const positionY = urlPositionY !== null ? Number(urlPositionY) : 0;
const positionZ = urlPositionZ !== null ? Number(urlPositionZ) : 0;
const rotationX = urlRotationX !== null ? Number(urlRotationX) : 0;
const rotationY = urlRotationY !== null ? Number(urlRotationY) : 0;
const rotationZ = urlRotationZ !== null ? Number(urlRotationZ) : 0;
const rotationW = urlRotationW !== null ? Number(urlRotationW) : 1;

const seed = new SystemSeed(starMapX, starMapY, starMapZ, index);

const starSystem = new StarSystemController(seed, scene);
starSystemView.setStarSystem(starSystem, true);

engine.getStarMap().setCurrentStarSystem(seed);

engine.init(true);

const position = new Vector3(positionX, positionY, positionZ);
const rotation = new Quaternion(rotationX, rotationY, rotationZ, rotationW);

const nbRadius = starSystem.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 3;
if (objectIndex >= starSystem.getOrbitalObjects().length) throw new Error(`Object index (${objectIndex}) out of bound (0 - ${starSystem.getOrbitalObjects().length - 1})!`);
const object = starSystem.getOrbitalObjects().length > 0 ? starSystem.getOrbitalObjects()[objectIndex] : starSystem.stellarObjects[0];
if(position.length() === 0) positionNearObjectBrightSide(scene.getActiveController(), object, starSystem, nbRadius);
else {
    const absolutePosition = Vector3.TransformCoordinates(position, object.getTransform().computeWorldMatrix());
    scene.getActiveController().getTransform().setAbsolutePosition(absolutePosition);

    const absoluteRotationQuaternion = rotation.multiply(object.getTransform().absoluteRotationQuaternion);
    setRotationQuaternion(scene.getActiveController().getTransform(), absoluteRotationQuaternion);
}

starSystemView.ui.setEnabled(true);
starSystemView.showUI();
