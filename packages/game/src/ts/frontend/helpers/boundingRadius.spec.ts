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
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getBoundingRadius } from "./boundingRadius";

describe("getBoundingRadius", () => {
    let engine: NullEngine;
    let scene: Scene;
    let root: TransformNode;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        root = new TransformNode("root", scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("returns the half diagonal for geometry centered on the root", () => {
        CreateBox("box", { size: 2 }, scene).parent = root;
        expect(getBoundingRadius(root)).toBeCloseTo(Math.sqrt(3));
    });

    it("includes the farthest corner of geometry offset from the root", () => {
        const box = CreateBox("box", { size: 2 }, scene);
        box.parent = root;
        box.position.set(3, -4, 0);
        expect(getBoundingRadius(root)).toBeCloseTo(Math.sqrt(42));
    });

    it("measures from the root under a translated and rotated parent", () => {
        const placement = new TransformNode("placement", scene);
        placement.position.set(100, 200, 300);
        placement.rotation.y = Math.PI / 2;
        root.parent = placement;
        root.position.set(10, 20, 30);
        const box = CreateBox("box", { size: 2 }, scene);
        box.parent = root;
        box.position.set(3, -4, 0);
        expect(getBoundingRadius(root)).toBeCloseTo(Math.sqrt(42));
    });
});
