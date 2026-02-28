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

import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";
import { afterAll, describe, expect, it } from "vitest";

import { FloatingOriginSystem } from "../floatingOriginSystem";
import { TransformTranslationAnimation } from "./translation";

function expectVectorCloseTo(actual: Vector3, expected: Vector3): void {
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
}

describe("TransformTranslationAnimation", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    afterAll(() => {
        scene.dispose();
        engine.dispose();
    });

    it("applies the final remaining displacement at the end of the animation", () => {
        const transform = new TransformNode("animatedTransform", scene);
        const animation = new TransformTranslationAnimation(transform, new Vector3(10, 0, 0), 1);

        animation.update(0.4);

        expect(transform.getAbsolutePosition().x).toBeLessThan(10);

        animation.update(0.7);

        expect(animation.isFinished()).toBe(true);
        expectVectorCloseTo(transform.getAbsolutePosition(), new Vector3(10, 0, 0));

        transform.dispose();
    });

    it("keeps the child camera aligned after a floating-origin rebase", () => {
        const transform = new TransformNode("controllerTransform", scene);
        const camera = new FreeCamera("controllerCamera", new Vector3(2, 0, 0), scene);
        camera.parent = transform;

        const animation = new TransformTranslationAnimation(transform, new Vector3(100, 0, 0), 1);
        const floatingOriginSystem = new FloatingOriginSystem(scene, 1);

        animation.update(0.5);
        floatingOriginSystem.update(transform.getAbsolutePosition());
        animation.update(0.5);

        expect(animation.isFinished()).toBe(true);
        expectVectorCloseTo(transform.getAbsolutePosition(), new Vector3(50, 0, 0));
        expectVectorCloseTo(camera.getWorldMatrix().getTranslation(), new Vector3(52, 0, 0));

        camera.dispose();
        transform.dispose();
    });
});
