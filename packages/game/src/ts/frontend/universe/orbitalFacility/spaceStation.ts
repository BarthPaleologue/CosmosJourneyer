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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { ClusteredLightContainer } from "@babylonjs/core/Lights/Clustered/clusteredLightContainer";
import type { Light } from "@babylonjs/core/Lights/light";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";

import { type SpaceStationModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spacestationModel";

import { EngineBay } from "@/frontend/assets/procedural/spaceStation/engineBay";
import { CylinderHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/cylinder/cylinderHabitat";
import { HelixHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/helix/helixHabitat";
import { RingHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/ring/ringHabitat";
import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { SolarSection } from "@/frontend/assets/procedural/spaceStation/solarSection";
import { TokamakSection } from "@/frontend/assets/procedural/spaceStation/tokamakSection";
import { UtilitySection } from "@/frontend/assets/procedural/spaceStation/utilitySection";
import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { ObjectTargetCursorType, type Targetable, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { type Transformable } from "@/frontend/universe/architecture/transformable";
import { LandingPadManager, type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { assertUnreachable, type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { type OrbitalFacilityBase } from "./orbitalFacility";
import type { StationSection } from "./stationSection";

export class SpaceStation implements OrbitalFacilityBase<"spaceStation"> {
    readonly name: string;

    readonly model: DeepReadonly<SpaceStationModel>;

    readonly type = "spaceStation";

    readonly sections: Array<StationSection> = [];
    readonly landingBays: Array<LandingBay> = [];

    private readonly root: TransformNode;

    private readonly scene: Scene;

    private readonly boundingRadius: number;

    readonly targetInfo: TargetInfo;

    private readonly landingPadManager: LandingPadManager;

    private readonly lightContainer: ClusteredLightContainer;

    constructor(model: DeepReadonly<SpaceStationModel>, assets: RenderingAssets, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.root = new TransformNode(this.name, scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.scene = scene;

        this.generate(assets);

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

        this.targetInfo = {
            type: ObjectTargetCursorType.FACILITY,
            minDistance: this.getBoundingRadius() * 6.0,
            maxDistance: 0.0,
        };

        this.lightContainer = new ClusteredLightContainer(`${this.name}_lightContainer`, this.getLights(), scene);
    }

    getLights(): Array<Light> {
        return this.sections.flatMap((section) => section.getLights());
    }

    getLandingPadManager(): LandingPadManager {
        return this.landingPadManager;
    }

    getSubTargets(): ReadonlyArray<Targetable> {
        return this.getLandingPadManager().getLandingPads();
    }

    public getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    public computeCulling(camera: Camera): void {
        this.getTransform().setEnabled(isSizeOnScreenEnough(this, camera));
    }

    private generate(assets: RenderingAssets) {
        const rng = getRngFromSeed(this.model.seed);
        for (const section of this.model.sections) {
            let newSection: StationSection;
            switch (section.type) {
                case "engineBay":
                    newSection = new EngineBay(assets, this.scene);
                    break;
                case "utility":
                    newSection = new UtilitySection(
                        rng(132 + 10 * this.sections.length) * Settings.SEED_HALF_RANGE,
                        assets,
                        this.scene,
                    );
                    break;
                case "solar":
                    newSection = new SolarSection(
                        section.surface,
                        Settings.SEED_HALF_RANGE * rng(31),
                        assets,
                        this.scene,
                    );
                    break;
                case "fusion":
                    newSection = new TokamakSection(section.netPowerOutput, assets, this.scene);
                    break;
                case "cylinderHabitat":
                    newSection = new CylinderHabitat(
                        section.surface.agriculture + section.surface.housing,
                        Settings.SEED_HALF_RANGE * rng(13),
                        assets.textures,
                        this.scene,
                    );
                    break;
                case "ringHabitat":
                    newSection = new RingHabitat(
                        section.surface.agriculture + section.surface.housing,
                        Settings.SEED_HALF_RANGE * rng(27),
                        assets.textures,
                        this.scene,
                    );
                    break;
                case "helixHabitat":
                    newSection = new HelixHabitat(
                        section.surface.agriculture + section.surface.housing,
                        Settings.SEED_HALF_RANGE * rng(19),
                        assets.textures,
                        this.scene,
                    );
                    break;
                case "landingBay": {
                    const landingBay = new LandingBay(
                        this.model,
                        rng(37) * Settings.SEED_HALF_RANGE,
                        assets,
                        this.scene,
                    );
                    this.landingBays.push(landingBay);
                    newSection = landingBay;
                    break;
                }
                default:
                    return assertUnreachable(section);
            }

            const newNode = newSection.getTransform();
            const lastNode = this.sections.at(-1);
            if (lastNode !== undefined) {
                this.placeNode(newNode, lastNode.getTransform());
            }

            this.sections.push(newSection);
            newNode.parent = this.root;
        }
    }

    private placeNode(node: TransformNode, parent: TransformNode) {
        // Make sure bounds are current
        parent.computeWorldMatrix(true);
        node.computeWorldMatrix(true);

        const parentBV = parent.getHierarchyBoundingVectors();
        const nodeBV = node.getHierarchyBoundingVectors();

        const deltaY = parentBV.max.y - nodeBV.min.y; // bring node bottom to parent top

        node.translate(Axis.Y, deltaY, Space.WORLD);
    }

    update(parents: ReadonlyArray<Transformable>, cameraWorldPosition: Vector3, deltaSeconds: number) {
        for (const section of this.sections) {
            section.update(cameraWorldPosition, deltaSeconds);
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.lightContainer.dispose();
        for (const section of this.sections) {
            section.dispose();
        }
        this.root.dispose();
    }
}
