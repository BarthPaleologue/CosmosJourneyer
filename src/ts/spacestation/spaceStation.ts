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

import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { isSizeOnScreenEnough } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { SpaceStationModel } from "./spacestationModel";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Assets } from "../assets";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { OrbitalObject } from "../architecture/orbitalObject";
import { Cullable } from "../bodies/cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../orbit/orbitProperties";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core";
import { LandingPad } from "../landingPad/landingPad";
import { PhysicsShapeConvexHull, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { LockConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import { CollisionMask, Settings } from "../settings";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

export class SpaceStation implements OrbitalObject, Cullable {
    readonly name: string;

    readonly model: SpaceStationModel;

    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly instance: InstancedMesh;

    readonly ringInstances: InstancedMesh[] = [];
    readonly ringAggregates: PhysicsAggregate[] = [];

    readonly landingPads: LandingPad[] = [];

    readonly parent: OrbitalObject | null = null;

    constructor(scene: Scene, parentBody: OrbitalObject | null = null) {
        //TODO: do not hardcode name
        this.name = "Spacestation";

        //TODO: do not hardcode seed
        const seed = 1;

        this.model = new SpaceStationModel(seed, parentBody?.model);

        this.parent = parentBody;

        this.instance = Assets.CreateSpaceStationInstance();

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
        this.aggregate.shape.filterCollideMask = CollisionMask.SPACESHIP;

        this.aggregate.body.setCollisionCallbackEnabled(true);
        this.aggregate.body.getCollisionObservable().add(() => {
            console.log("collision!");
        });

        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });

        for (const mesh of this.instance.getChildMeshes()) {
            if (mesh.name.toLowerCase().includes("landingpad")) {
                const childShape = new PhysicsShapeConvexHull(mesh as Mesh, scene);
                //childShape.filterMembershipMask = CollisionMask.LANDING_PADS;
                childShape.filterCollideMask = CollisionMask.SPACESHIP;
                this.aggregate.shape.addChildFromParent(this.getTransform(), childShape, mesh);

                const landingPad = new LandingPad(scene, mesh);
                this.landingPads.push(landingPad);

                /*const constraint = new LockConstraint(Vector3.Zero(), landingPad.getTransform().position.negate(), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene);
        this.aggregate.body.addConstraint(landingPad.aggregate.body, constraint);*/

                continue;
            }

            if (mesh.name.toLowerCase().includes("ring")) {
                this.ringInstances.push(mesh as InstancedMesh);

                const ringAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.2 }, scene);
                ringAggregate.body.disablePreStep = false;
                this.ringAggregates.push(ringAggregate);

                const constraint = new LockConstraint(Vector3.Zero(), mesh.position.negate(), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene);
                this.aggregate.body.addConstraint(ringAggregate.body, constraint);

                continue;
            }

            const childShape = new PhysicsShapeMesh(mesh as Mesh, scene);
            childShape.filterMembershipMask = CollisionMask.SPACE_STATION;
            this.aggregate.shape.addChildFromParent(this.getTransform(), childShape, mesh);
        }

        this.aggregate.body.disablePreStep = false;

        console.log("found", this.landingPads.length, "landing pads");

        //this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
        //this.getTransform().rotate(Axis.Y, this.model.physicalProperties.axialTilt);
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
        return 1e3;
    }

    getTypeName(): string {
        return "Space Station";
    }

    public computeCulling(camera: Camera): void {
        const isVisible = isSizeOnScreenEnough(this, camera);
        for (const mesh of this.instance.getChildMeshes()) {
            mesh.isVisible = isVisible;
        }
    }

    public dispose(): void {
        this.instance.dispose();
    }
}
