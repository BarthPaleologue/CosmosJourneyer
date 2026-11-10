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

import "@babylonjs/core/Physics/physicsEngineComponent";

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsShape, PhysicsShapeContainer } from "@babylonjs/core/Physics/v2/physicsShape";
import { PhysicsShapeConvexHull, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createHavokForTests } from "@/frontend/helpers/havokTest";

import { CollisionMask } from "@/settings";

import { createPhysicsShapesFromHierarchy } from "./havok";

describe("createPhysicsShapesFromHierarchy", () => {
    let havok: HavokPhysicsWithBindings;
    let engine: NullEngine;
    let scene: Scene;
    let container: PhysicsShapeContainer | null;
    let shapes: Array<PhysicsShape>;

    beforeAll(async () => {
        havok = await createHavokForTests();
    });

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.enablePhysics(Vector3.Zero(), new HavokPlugin(true, havok));
        container = null;
        shapes = [];
    });

    afterEach(() => {
        container?.dispose();
        for (const shape of shapes.toReversed()) {
            shape.dispose();
        }
        scene.dispose();
        engine.dispose();
    });

    it("creates one mesh shape per child mesh", () => {
        const root = new TransformNode("root", scene);
        const box = CreateBox("box", { size: 1 }, scene);
        box.parent = root;
        const child = new TransformNode("child", scene);
        child.parent = root;

        const result = createPhysicsShapesFromHierarchy(
            root,
            scene,
            (mesh, shapeScene) => new PhysicsShapeMesh(mesh, shapeScene),
        );
        container = result.container;
        shapes = result.shapes;

        expect(shapes).toHaveLength(1);
        const [shape] = shapes;
        expect(shape).toBeInstanceOf(PhysicsShapeMesh);
        expect(shape?.type).toBe(PhysicsShapeType.MESH);
        expect(container.type).toBe(PhysicsShapeType.CONTAINER);
    });

    it("uses the supplied shape factory and lets callers configure the result", () => {
        const root = new TransformNode("root", scene);
        const box = CreateBox("box", { size: 1 }, scene);
        box.parent = root;

        const result = createPhysicsShapesFromHierarchy(
            root,
            scene,
            (mesh, shapeScene) => new PhysicsShapeConvexHull(mesh, shapeScene),
        );
        container = result.container;
        shapes = result.shapes;
        for (const shape of shapes) {
            shape.filterMembershipMask = CollisionMask.INTERACTIVE;
        }

        expect(shapes).toHaveLength(1);
        const [shape] = shapes;
        expect(shape).toBeInstanceOf(PhysicsShapeConvexHull);
        expect(shape?.type).toBe(PhysicsShapeType.CONVEX_HULL);
        expect(shape?.filterMembershipMask).toBe(CollisionMask.INTERACTIVE);
    });
});
