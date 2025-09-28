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

/* eslint-disable @typescript-eslint/no-unused-expressions */

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";
import { afterAll, describe, expect, it } from "vitest";

describe("BasicTransform", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    afterAll(() => {
        scene.dispose();
        engine.dispose();
    });

    const transform = new TransformNode("transform", scene);
    it("can rotate around a pivot", () => {
        transform.setAbsolutePosition(new Vector3(1, 0, 0));
        transform.rotateAround(new Vector3(0, 0, 0), new Vector3(0, 1, 0), Math.PI / 2);
        expect(transform.getAbsolutePosition().equals(new Vector3(0, 0, -1))).to.be.true;
    });
});
