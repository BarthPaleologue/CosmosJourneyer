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

import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { type ThrusterExhaustCrossSection, ThrusterExhaustMaterial } from "./thrusterExhaustMaterial";

export interface ThrusterExhaustOptions {
    readonly crossSection?: ThrusterExhaustCrossSection;
    readonly emissionIntensity?: number;
    readonly rayMarchStepCount?: number;
}

export class ThrusterExhaust implements Transformable {
    private readonly scene: Scene;
    private readonly transform: TransformNode;

    private proxyMesh: Mesh;
    private readonly material: ThrusterExhaustMaterial;

    private throttle = 0;
    private length = 3.0;
    private pressureRatio = 0.7;
    private roundness = 0.35;
    private exhaustSpeed = 50.0;

    constructor(name: string, scene: Scene, options?: ThrusterExhaustOptions) {
        this.scene = scene;
        this.transform = new TransformNode(`${name}Transform`, scene);

        this.material = new ThrusterExhaustMaterial(name, this.transform, scene, options);

        this.proxyMesh = this.createProxyMesh(`${name}Proxy`, this.length);
        this.proxyMesh.material = this.material.get();

        this.setLength(this.length);
        this.setPressureRatio(this.pressureRatio);
        this.setRoundness(this.roundness);
        this.setExhaustSpeed(this.exhaustSpeed);
        this.setThrottle(0);
    }

    private createProxyMesh(name: string, length: number): Mesh {
        const proxyDiameter = 2 * Math.max(this.material.crossSection.x, this.material.crossSection.z);
        const proxyMesh = CreateBox(
            name,
            {
                width: proxyDiameter,
                height: length,
                depth: proxyDiameter,
            },
            this.scene,
        );
        proxyMesh.parent = this.transform;
        proxyMesh.isPickable = false;
        proxyMesh.bakeTransformIntoVertices(Matrix.Translation(0, -length / 2, 0));
        return proxyMesh;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    isEnabled(): boolean {
        return this.proxyMesh.isEnabled();
    }

    setThrottle(throttle: number) {
        this.throttle = Math.min(Math.max(throttle, 0), 1);
        this.material.setThrottle(this.throttle);
        this.proxyMesh.setEnabled(this.throttle > 0.001);
    }

    setLength(length: number) {
        this.length = Math.max(length, 1e-3);
        this.material.setLength(this.length);

        const nextProxyMesh = this.createProxyMesh(this.proxyMesh.name, this.length);
        nextProxyMesh.setEnabled(this.proxyMesh.isEnabled());
        this.proxyMesh.dispose();
        this.proxyMesh = nextProxyMesh;
        this.proxyMesh.material = this.material.get();
    }

    setPressure(environmentPressure: number, chamberPressure: number) {
        const safeEnvironmentPressure = Math.max(environmentPressure, 0);
        const safeChamberPressure = Math.max(chamberPressure, 1e-6);
        this.setPressureRatio(safeEnvironmentPressure / safeChamberPressure);
    }

    setRoundness(roundness: number) {
        this.roundness = Math.min(Math.max(roundness, 0), 1);
        this.material.setRoundness(this.roundness);
    }

    setExhaustSpeed(exhaustSpeed: number) {
        this.exhaustSpeed = Math.max(exhaustSpeed, 0);
        this.material.setExhaustSpeed(this.exhaustSpeed);
    }

    private setPressureRatio(pressureRatio: number) {
        this.pressureRatio = Math.max(pressureRatio, 1e-6);
        this.material.setPressureRatio(this.pressureRatio);
    }

    getProxyMesh() {
        return this.proxyMesh;
    }

    update(deltaSeconds: number) {
        if (!this.proxyMesh.isEnabled()) {
            return;
        }

        this.material.update(deltaSeconds);
    }

    dispose() {
        this.material.dispose();
        this.proxyMesh.dispose();
        this.transform.dispose();
    }
}
