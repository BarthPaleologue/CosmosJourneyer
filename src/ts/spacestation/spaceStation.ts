//  This file is part of Cosmos Journeyer
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

import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { isSizeOnScreenEnough } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { SpaceStationModel } from "./spacestationModel";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { OrbitalObject } from "../architecture/orbitalObject";
import { Cullable } from "../utils/cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../orbit/orbitProperties";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { LandingPad } from "../landingPad/landingPad";
import { PhysicsShapeConvexHull, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CollisionMask } from "../settings";
import { CelestialBody } from "../architecture/celestialBody";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { generateSpaceStationName } from "../utils/spaceStationNameGenerator";
import i18n from "../i18n";
import { Objects } from "../assets/objects";

export class SpaceStation implements OrbitalObject, Cullable {
    readonly name: string;

    readonly model: SpaceStationModel;

    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly instance: InstancedMesh;

    readonly ringInstances: InstancedMesh[] = [];
    readonly ringAggregates: PhysicsAggregate[] = [];
    readonly ringsLocalPosition: Vector3[] = [];
    readonly ringsRadius: number[] = [];

    readonly landingPads: LandingPad[] = [];

    readonly parent: OrbitalObject | null = null;

    constructor(scene: Scene, model: SpaceStationModel | number, parentBody: CelestialBody | null = null) {
        this.model = model instanceof SpaceStationModel ? model : new SpaceStationModel(model, parentBody?.model);

        this.name = generateSpaceStationName(this.model.rng, 2756);

        this.parent = parentBody;

        this.instance = Objects.CreateSpaceStationInstance();
        this.instance.name = this.name;

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );

        this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
        this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

        this.aggregate.body.setCollisionCallbackEnabled(true);
        this.aggregate.body.getCollisionObservable().add(() => {
            console.log("collision!");
        });

        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });

        for (const mesh of this.instance.getChildMeshes()) {
            if (mesh.name.toLowerCase().includes("landingpad")) {
                const childShape = new PhysicsShapeConvexHull(mesh as Mesh, scene);
                childShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
                childShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
                this.aggregate.shape.addChildFromParent(this.getTransform(), childShape, mesh);

                const landingPad = new LandingPad(scene, mesh);
                this.landingPads.push(landingPad);

                continue;
            }

            if (mesh.name.toLowerCase().includes("ring")) {
                this.ringInstances.push(mesh as InstancedMesh);

                const ringAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.2 }, scene);
                ringAggregate.body.disablePreStep = false;
                this.ringAggregates.push(ringAggregate);

                this.ringsRadius.push(mesh.getBoundingInfo().boundingSphere.radius);

                this.ringsLocalPosition.push(mesh.position.clone());

                continue;
            }

            const childShape = new PhysicsShapeMesh(mesh as Mesh, scene);
            childShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            childShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
            this.aggregate.shape.addChildFromParent(this.getTransform(), childShape, mesh);
        }

        this.aggregate.body.disablePreStep = false;

        console.log("found", this.landingPads.length, "landing pads");
    }

    updateRings(deltaSeconds: number): void {
        for (let i = 0; i < this.ringInstances.length; i++) {
            const ringAggregate = this.ringAggregates[i];
            const localPosition = this.ringsLocalPosition[i];
            const ringRadius = this.ringsRadius[i];

            // g = v * v / r and T = 2 * pi * r / v => v = sqrt(g * r) and T = 2 * pi * r / sqrt(g * r) = 2 * pi * sqrt(r / g)
            const rotationPeriod = 2 * Math.PI * Math.sqrt(ringRadius / 9.81);

            const clockwise = i % 2 === 0 ? 1 : -1;

            ringAggregate.transformNode.rotate(Vector3.Up(), deltaSeconds * clockwise * ((2 * Math.PI) / rotationPeriod));

            // this is necessary because Havok ignores regular parenting
            ringAggregate.transformNode.setAbsolutePosition(Vector3.TransformCoordinates(localPosition, this.getTransform().getWorldMatrix()));
        }
    }

    handleDockingRequest(): LandingPad | null {
        const availableLandingPads = this.landingPads;
        const nbPads = availableLandingPads.length;

        if (nbPads === 0) return null;

        return availableLandingPads[Math.floor(Math.random() * nbPads)];
    }

    getTransform(): TransformNode {
        return this.instance;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    public getBoundingRadius(): number {
        return 2e3;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:spaceStation");
    }

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }
        for (const mesh of this.instance.getChildMeshes()) {
            mesh.isVisible = isVisible;
        }
    }

    public dispose(): void {
        this.instance.dispose();
    }
}
