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
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type Scene } from "@babylonjs/core/scene";

import type { ElevatorSectionModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/sections";
import { type SpaceElevatorModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spaceElevatorModel";

import { SpaceElevatorClimber } from "@/frontend/assets/procedural/spaceStation/climber/spaceElevatorClimber";
import { CylinderHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/cylinder/cylinderHabitat";
import { HelixHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/helix/helixHabitat";
import { RingHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/ring/ringHabitat";
import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { MetalSectionMaterial } from "@/frontend/assets/procedural/spaceStation/metalSectionMaterial";
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
import { clamp, remap, triangleWave } from "@/utils/math";
import { assertUnreachable, type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { type OrbitalFacilityBase } from "./orbitalFacility";
import type { StationSection } from "./stationSection";

export class SpaceElevator implements OrbitalFacilityBase<"spaceElevator"> {
    readonly name: string;

    readonly model: DeepReadonly<SpaceElevatorModel>;

    readonly type = "spaceElevator";

    private readonly sections: Array<StationSection> = [];
    readonly landingBays: Array<LandingBay> = [];

    private readonly tether: Mesh;
    private readonly tetherLength: number;
    private readonly tetherMaterial: MetalSectionMaterial;

    private readonly climber: SpaceElevatorClimber;

    private readonly root: TransformNode;

    private readonly scene: Scene;

    private readonly boundingRadius: number;

    private elapsedSeconds = 0;

    readonly targetInfo: TargetInfo;

    private readonly landingPadManager: LandingPadManager;

    private readonly lightContainer: ClusteredLightContainer;

    constructor(model: DeepReadonly<SpaceElevatorModel>, assets: RenderingAssets, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.root = new TransformNode(this.name, scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.scene = scene;

        const tetherThickness = 10;
        this.tetherLength = this.model.tetherLength;

        this.tether = MeshBuilder.CreateCylinder(
            `${this.name} Tether`,
            {
                height: this.tetherLength,
                diameter: tetherThickness,
                tessellation: 6,
            },
            this.scene,
        );
        this.tether.convertToFlatShadedMesh();

        this.tetherMaterial = new MetalSectionMaterial("TetherMaterial", assets.textures.materials.metalPanels, scene);
        this.tether.material = this.tetherMaterial;

        this.climber = new SpaceElevatorClimber(
            assets.materials.solarPanel,
            assets.textures.materials.crate,
            assets.textures.materials.metalPanels,
            scene,
        );
        this.climber.getTransform().parent = this.tether;

        this.climber.getTransform().position.y = this.tetherLength / 2;

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

        this.tether.parent = this.getTransform();

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

        this.lightContainer = new ClusteredLightContainer("SpaceElevatorLightContainer", this.getLights(), scene);
    }

    getLights(): Array<Light> {
        return this.sections.flatMap((section) => section.getLights());
    }

    getLandingPadManager(): LandingPadManager {
        return this.landingPadManager;
    }

    getSubTargets(): ReadonlyArray<Targetable> {
        return [this.climber, ...this.getLandingPadManager().getLandingPads()];
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

    private getSectionFromModel(
        model: ElevatorSectionModel,
        assets: RenderingAssets,
        rng: (step: number) => number,
    ): StationSection {
        switch (model.type) {
            case "utility":
                return new UtilitySection(model, assets, this.scene);
            case "solar":
                return new SolarSection(model, Settings.SEED_HALF_RANGE * rng(31), assets, this.scene);
            case "fusion":
                return new TokamakSection(model, assets, this.scene);
            case "cylinderHabitat":
                return new CylinderHabitat(model, assets.textures, this.scene);
            case "ringHabitat":
                return new RingHabitat(model, assets.textures, this.scene);
            case "helixHabitat":
                return new HelixHabitat(model, assets.textures, this.scene);
            case "landingBay": {
                const landingBay = new LandingBay(model, this.model, assets, this.scene);
                this.landingBays.push(landingBay);
                return landingBay;
            }
            default:
                return assertUnreachable(model);
        }
    }

    private generate(assets: RenderingAssets) {
        const rng = getRngFromSeed(this.model.seed);
        for (const section of this.model.sections) {
            const newSection = this.getSectionFromModel(section, assets, rng);
            const lastNode = this.sections.at(-1)?.getTransform() ?? this.tether;
            this.placeNode(newSection.getTransform(), lastNode);

            this.sections.push(newSection);
            newSection.getTransform().parent = this.root;
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
        const parent = parents[0];
        if (parent === undefined) {
            throw new Error("Space Elevator should have exactly one parent");
        }

        const newUp = this.getTransform().position.subtract(parent.getTransform().position).normalize();
        if (newUp.lengthSquared() < 1e-6) {
            newUp.set(0, 1, 0);
        }
        const currentUp = this.getTransform().up;
        const rotation = Quaternion.FromUnitVectorsToRef(currentUp, newUp, Quaternion.Identity());

        const currentRotation = this.getTransform().rotationQuaternion ?? Quaternion.Identity();
        rotation.multiplyToRef(currentRotation, currentRotation);
        this.getTransform().rotationQuaternion = currentRotation;

        this.elapsedSeconds += deltaSeconds;

        for (const section of this.sections) {
            section.update(cameraWorldPosition, deltaSeconds);
        }

        const climberSpeed = 300 / 3.6; // 300 km/h in m/s
        const roundTripDuration = (2 * this.tetherLength) / climberSpeed;

        this.climber.getTransform().position.y = remap(
            clamp(1.05 * triangleWave(this.elapsedSeconds / roundTripDuration), 0, 1),
            0,
            1,
            this.tetherLength / 2,
            -this.tetherLength / 2,
        );
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        for (const section of this.sections) {
            section.dispose();
        }

        this.tether.dispose();
        this.tetherMaterial.dispose();

        this.climber.dispose();

        this.root.dispose();

        this.lightContainer.dispose();
    }
}
