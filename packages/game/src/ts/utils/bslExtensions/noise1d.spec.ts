//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { NodeMaterialBlockConnectionPointTypes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { f32, outputFragColor, outputVertexPosition, vec3 } from "babylonjs-shading-language";
import { describe, expect, it } from "vitest";

import { noise1d } from "./noise1d";

describe("noise1d", () => {
    it("builds a scalar noise shader graph", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const material = new NodeMaterial("noise", scene);
            const noise = noise1d(f32(-0.25));
            expect(noise.type).toBe(NodeMaterialBlockConnectionPointTypes.Float);
            material.addOutputNode(outputVertexPosition(new Vector4(0, 0, 0, 1)));
            material.addOutputNode(outputFragColor(vec3({ x: noise, y: noise, z: noise })));

            await new Promise<void>((resolve, reject) => {
                material.onBuildObservable.addOnce(() => {
                    resolve();
                });
                material.onBuildErrorObservable.addOnce((error) => {
                    reject(new Error(error));
                });
                material.build();
            });

            expect(material.compiledShaders).toContain("floor(");
            expect(material.compiledShaders).toContain("fract(");
            expect(material.compiledShaders).not.toMatch(/undefined|NaN/);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
