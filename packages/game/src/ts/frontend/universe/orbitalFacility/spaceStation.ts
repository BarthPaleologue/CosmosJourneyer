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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Light } from "@babylonjs/core/Lights/light";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { SpaceStationModel } from "@cosmos-journeyer/universe-model";

import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import type { Transformable } from "@/frontend/universe/architecture/transformable";
import { LandingPadManager } from "@/frontend/universe/orbitalFacility/landingPadManager";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { createFacilitySections } from "./createFacilitySections";
import type { OrbitalFacilityBase } from "./orbitalFacility";
import type { StationSection } from "./stationSection";

export class SpaceStation implements OrbitalFacilityBase<"spaceStation"> {
    readonly name: string;

    readonly model: DeepReadonly<SpaceStationModel>;

    readonly type = "spaceStation";

    readonly sections: Array<StationSection>;
    readonly landingBays: Array<LandingBay>;

    private readonly root: TransformNode;

    private readonly boundingRadius: number;

    private readonly landingPadManager: LandingPadManager;

    constructor(model: DeepReadonly<SpaceStationModel>, assets: RenderingAssets, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.root = new TransformNode(this.name, scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.sections = createFacilitySections(this.root, model.sections, model.name, assets, scene);
        this.landingBays = this.sections.filter((section): section is LandingBay => section instanceof LandingBay);

        // Now that landing bays are generated, create the landing pad manager with all pads
        const allLandingPads: Array<ILandingPad> = [];
        const landingPadToLandingBay: Map<ILandingPad, { bay: LandingBay; index: number }> = new Map();
        for (const bay of this.landingBays) {
            for (const [landingPadIndex, landingPad] of bay.landingPads.entries()) {
                allLandingPads.push(landingPad);
                landingPadToLandingBay.set(landingPad, { bay, index: landingPadIndex });
            }
        }
        this.landingPadManager = new LandingPadManager(allLandingPads);
        this.landingPadManager.onStatusChanged.add(({ pad, status }) => {
            const padInfo = landingPadToLandingBay.get(pad);
            if (padInfo === undefined) {
                console.warn("Landing pad not found in landing bay map");
                return;
            }

            padInfo.bay.setLandingPadStatus(padInfo.index, status);
        });

        // center the space station on its center of mass
        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        const centerWorld = boundingVectors.max.add(boundingVectors.min).scale(0.5);
        const deltaPosition = this.getTransform().getAbsolutePosition().subtract(centerWorld);

        this.getTransform()
            .getChildTransformNodes(true)
            .forEach((transform) => transform.position.addInPlace(deltaPosition));

        const extendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);
        this.boundingRadius = Math.max(extendSize.x, extendSize.y, extendSize.z);
    }

    getLights(): ReadonlyArray<Light> {
        return this.sections.flatMap((section) => section.getLights());
    }

    getLandingPadManager(): LandingPadManager {
        return this.landingPadManager;
    }

    getLandingBays(): Array<LandingBay> {
        return this.landingBays;
    }

    public getBoundingRadius(): number {
        return this.boundingRadius;
    }

    public computeCulling(camera: Camera): void {
        this.getTransform().setEnabled(isSizeOnScreenEnough(this, camera));
    }

    update(parents: ReadonlyArray<Transformable>, cameraWorldPosition: Vector3, deltaSeconds: number): void {
        for (const section of this.sections) {
            section.update(cameraWorldPosition, deltaSeconds);
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose(): void {
        for (const section of this.sections) {
            section.dispose();
        }
        this.root.dispose();
    }
}
