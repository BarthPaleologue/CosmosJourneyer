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

import { Scene } from "@babylonjs/core/scene";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getTransformationQuaternion } from "../src/ts/utils/algebra";

const engine = new NullEngine();
const scene = new Scene(engine);

describe("BasicTransform", () => {
  const transform = new TransformNode("transform", scene);
  it("exists", () => expect(transform).toBeDefined());
});

test("getTransformationQuaternion", () => {
  const from = new Vector3(1, 0, 0);
  const to = new Vector3(0, 1, 0);
  const quaternion = getTransformationQuaternion(from, to);
  expect(quaternion).toBeDefined();
  expect(quaternion).toBeInstanceOf(Quaternion);
  expect(quaternion).toHaveProperty("x");
  expect(quaternion).toHaveProperty("y");
  expect(quaternion).toHaveProperty("z");
  expect(quaternion).toHaveProperty("w");

  from.copyFromFloats(0, 1, 0);
  to.copyFromFloats(0, 1, 0);
  const quaternion2 = getTransformationQuaternion(from, to);
  expect(quaternion2).toBeDefined();
  expect(quaternion2).toBeInstanceOf(Quaternion);
  expect(quaternion2.x).toEqual(0);
  expect(quaternion2.y).toEqual(0);
  expect(quaternion2.z).toEqual(0);
  expect(quaternion2.w).toEqual(1);
});