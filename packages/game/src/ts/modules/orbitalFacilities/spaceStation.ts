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
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import type { SystemContent, SystemContentFactoryContext } from "@/frontend/systemEntity/systemEntity";
import { LandingPadProvider } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadProvider";

import { createFacilitySections } from "./createFacilitySections";
import type { SpaceStationModel } from "./spaceStationModel";
import type { StationSection } from "./stationSection";

export class SpaceStation implements SystemContent {
    readonly name: string;

    readonly sections: Array<StationSection>;
    readonly landingBays: Array<LandingBay>;

    private readonly root: TransformNode;

    private readonly boundingRadius: number;

    private readonly landingPadProvider: LandingPadProvider;

    constructor(
        model: DeepReadonly<SystemEntityModel<SpaceStationModel>>,
        { assets, scene }: SystemContentFactoryContext,
    ) {
        this.name = model.name;

        this.root = new TransformNode(this.name, scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.sections = createFacilitySections(this.root, model.content.sections, model.name, assets, scene);
        this.landingBays = this.sections.filter((section) => section instanceof LandingBay);

        // Now that landing bays are generated, create the landing pad manager with all pads
        const allLandingPads: Array<ILandingPad> = [];
        const landingPadToLandingBay: Map<ILandingPad, { bay: LandingBay; index: number }> = new Map();
        for (const bay of this.landingBays) {
            for (const [landingPadIndex, landingPad] of bay.landingPads.entries()) {
                allLandingPads.push(landingPad);
                landingPadToLandingBay.set(landingPad, { bay, index: landingPadIndex });
            }
        }
        this.landingPadProvider = new LandingPadProvider(allLandingPads);
        this.landingPadProvider.onStatusChanged.add(({ pad, status }) => {
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

    getLandingPadProvider(): LandingPadProvider {
        return this.landingPadProvider;
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

    update(observerPosition: Vector3, deltaSeconds: number): void {
        for (const section of this.sections) {
            section.update(observerPosition, deltaSeconds);
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
