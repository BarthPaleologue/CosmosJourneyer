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

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes";
import { rotateVector3AroundInPlace } from "../../src/ts/utils/algebra";

const engine = new NullEngine();
const scene = new Scene(engine);

describe("BasicTransform", () => {
  const transform = new TransformNode("transform", scene);
  it("exists", () => expect(transform).toBeDefined());
  transform.setAbsolutePosition(new Vector3(10, 0, 0));

  const pivotPoint = new Vector3(0, 5, 0);
  const rotationAxis = new Vector3(0, 1, 0);

  const finalPosition1 = rotateVector3AroundInPlace(transform.getAbsolutePosition(), pivotPoint, rotationAxis, Math.PI / 2);
  transform.rotateAround(pivotPoint, rotationAxis, Math.PI / 2);
  const finalPosition2 = transform.getAbsolutePosition();

  it("can rotate around a pivot", () => {
    expect(finalPosition1.equalsWithEpsilon(finalPosition2)).toBeTruthy();
  });
});