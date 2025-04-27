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

import { Scene } from "@babylonjs/core/scene";
import { isSizeOnScreenEnough } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SpaceStationNodeType } from "../assets/procedural/spaceStation/spaceStationNode";
import { UtilitySection } from "../assets/procedural/spaceStation/utilitySection";
import { HelixHabitat } from "../assets/procedural/spaceStation/helixHabitat";
import { RingHabitat } from "../assets/procedural/spaceStation/ringHabitat";
import { Transformable } from "../architecture/transformable";
import { SolarSection } from "../assets/procedural/spaceStation/solarSection";
import { wheelOfFortune } from "../utils/random";
import { CylinderHabitat } from "../assets/procedural/spaceStation/cylinderHabitat";
import { LandingBay } from "../assets/procedural/spaceStation/landingBay";
import { Settings } from "../settings";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { getOrbitalObjectTypeToI18nString } from "../utils/strings/orbitalObjectTypeToDisplay";
import { OrbitalFacilityBase } from "./orbitalFacility";
import { SpaceElevatorModel } from "./spaceElevatorModel";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { MetalSectionMaterial } from "../assets/procedural/spaceStation/metalSectionMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { SpaceElevatorClimber } from "./spaceElevatorClimber";
import { clamp, remap, triangleWave } from "../utils/math";
import { ObjectTargetCursorType, Targetable, TargetInfo } from "../architecture/targetable";
import { setUpVector } from "../uberCore/transforms/basicTransform";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { DeepReadonly } from "../utils/types";
import { LandingPadManager } from "./landingPad/landingPadManager";
import { getSphereRadiatedEnergyFlux } from "../utils/physics";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { StellarObjectModel } from "../architecture/orbitalObjectModel";
import { RenderingAssets } from "../assets/renderingAssets";

export class SpaceElevator implements OrbitalFacilityBase<OrbitalObjectType.SPACE_ELEVATOR> {
    readonly name: string;

    readonly model: DeepReadonly<SpaceElevatorModel>;

    readonly type = OrbitalObjectType.SPACE_ELEVATOR;

    private readonly solarSections: SolarSection[] = [];
    private readonly utilitySections: UtilitySection[] = [];
    private readonly helixHabitats: HelixHabitat[] = [];
    private readonly ringHabitats: RingHabitat[] = [];
    private readonly cylinderHabitats: CylinderHabitat[] = [];
    private readonly landingBays: LandingBay[] = [];

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

    constructor(
        model: DeepReadonly<SpaceElevatorModel>,
        stellarObjects: ReadonlyMap<DeepReadonly<StellarObjectModel>, number>,
        assets: RenderingAssets,
        scene: Scene
    ) {
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
                tessellation: 6
            },
            this.scene
        );
        this.tether.convertToFlatShadedMesh();

        this.tetherMaterial = new MetalSectionMaterial("TetherMaterial", assets.textures.materials.metalPanels, scene);
        this.tether.material = this.tetherMaterial;

        this.climber = new SpaceElevatorClimber(
            assets.materials.solarPanel,
            assets.textures.materials.crate,
            assets.textures.materials.metalPanels,
            scene
        );
        this.climber.getTransform().parent = this.tether;

        this.climber.getTransform().position.y = this.tetherLength / 2;

        this.generate(stellarObjects, assets);

        // Now that landing bays are generated, create the landing pad manager with all pads
        this.landingPadManager = new LandingPadManager(
            this.landingBays.flatMap((landingBay) => {
                return landingBay.landingPads;
            })
        );

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
            maxDistance: 0.0
        };
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

    private generate(stellarObjects: ReadonlyMap<DeepReadonly<StellarObjectModel>, number>, assets: RenderingAssets) {
        let totalStellarFlux = 0;
        stellarObjects.forEach((distance, model) => {
            totalStellarFlux += getSphereRadiatedEnergyFlux(model.blackBodyTemperature, model.radius, distance);
        });

        const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(
            this.model.solarPanelEfficiency,
            this.model.population * this.model.energyConsumptionPerCapitaKWh,
            totalStellarFlux
        );

        const housingSurfaceHa = (100 * this.model.population) / this.model.populationDensity; // convert km² to ha
        let agricultureSurfaceHa = 0;
        this.model.agricultureMix.forEach(([fraction, cropType]) => {
            const requiredDailyKCal = this.model.population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE;

            const KCalPerHa =
                Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO *
                this.model.nbHydroponicLayers *
                getEdibleEnergyPerHaPerDay(cropType);

            agricultureSurfaceHa += (fraction * requiredDailyKCal) / KCalPerHa;
        });
        const totalHabitatSurfaceM2 = (housingSurfaceHa + agricultureSurfaceHa) * 1000; // convert ha to m²

        let lastNode: TransformNode = this.tether;

        const rng = getRngFromSeed(this.model.seed);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(564) * 5), rng, assets);

        const habitatType = wheelOfFortune(
            [
                [SpaceStationNodeType.RING_HABITAT, 0.5],
                [SpaceStationNodeType.HELIX_HABITAT, 0.3],
                [SpaceStationNodeType.CYLINDER_HABITAT, 0.2]
            ],
            rng(17)
        );

        let newNode: TransformNode | null = null;
        if (habitatType === SpaceStationNodeType.HELIX_HABITAT) {
            const helixHabitat = new HelixHabitat(
                totalHabitatSurfaceM2,
                Settings.SEED_HALF_RANGE * rng(19),
                assets.textures,
                this.scene
            );
            this.helixHabitats.push(helixHabitat);
            newNode = helixHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.RING_HABITAT) {
            const ringHabitat = new RingHabitat(
                totalHabitatSurfaceM2,
                Settings.SEED_HALF_RANGE * rng(27),
                assets.textures,
                this.scene
            );
            this.ringHabitats.push(ringHabitat);
            newNode = ringHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.CYLINDER_HABITAT) {
            const cylinderHabitat = new CylinderHabitat(
                totalHabitatSurfaceM2,
                Settings.SEED_HALF_RANGE * rng(13),
                assets.textures,
                this.scene
            );
            this.cylinderHabitats.push(cylinderHabitat);
            newNode = cylinderHabitat.getTransform();
        }

        if (newNode === null) {
            throw new Error("Node creation failed");
        }

        this.placeNode(newNode, lastNode);
        newNode.parent = this.root;
        lastNode = newNode;

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng, assets);

        const solarSection = new SolarSection(
            solarPanelSurfaceM2,
            Settings.SEED_HALF_RANGE * rng(31),
            assets,
            this.scene
        );
        solarSection.getTransform().parent = this.getTransform();
        this.placeNode(solarSection.getTransform(), lastNode);
        lastNode = solarSection.getTransform();
        this.solarSections.push(solarSection);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng, assets);

        const landingBay = new LandingBay(this.model, rng(37) * Settings.SEED_HALF_RANGE, assets, this.scene);

        this.landingBays.push(landingBay);
        this.placeNode(landingBay.getTransform(), lastNode);
        landingBay.getTransform().parent = this.getTransform();
    }

    private addUtilitySections(
        lastNode: TransformNode,
        nbSections: number,
        rng: (index: number) => number,
        assets: RenderingAssets
    ): TransformNode {
        let newLastNode = lastNode;
        for (let i = 0; i < nbSections; i++) {
            const utilitySection = new UtilitySection(
                rng(132 + 10 * this.utilitySections.length) * Settings.SEED_HALF_RANGE,
                assets,
                this.scene
            );
            this.utilitySections.push(utilitySection);

            this.placeNode(utilitySection.getTransform(), newLastNode);

            utilitySection.getTransform().parent = this.getTransform();

            newLastNode = utilitySection.getTransform();
        }

        return newLastNode;
    }

    private placeNode(node: TransformNode, parent: TransformNode) {
        const previousBoundingVectors = parent.getHierarchyBoundingVectors();
        const previousBoundingExtendSize = previousBoundingVectors.max.subtract(previousBoundingVectors.min).scale(0.5);

        const newBoundingVectors = node.getHierarchyBoundingVectors();
        const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

        const previousSectionSizeY = previousBoundingExtendSize.y;
        const newSectionY = newBoundingExtendSize.y;

        node.position = parent.position.add(parent.up.scale(previousSectionSizeY + newSectionY));
    }

    update(parents: ReadonlyArray<Transformable>, cameraWorldPosition: Vector3, deltaSeconds: number) {
        if (parents.length !== 1) {
            throw new Error("Space Elevator should have exactly one parent");
        }

        const parent = parents[0];
        const upDirection = this.getTransform().position.subtract(parent.getTransform().position).normalize();
        setUpVector(this.getTransform(), upDirection);

        this.elapsedSeconds += deltaSeconds;

        this.helixHabitats.forEach((helixHabitat) => helixHabitat.update(cameraWorldPosition, deltaSeconds));
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.update(cameraWorldPosition, deltaSeconds));
        this.cylinderHabitats.forEach((cylinderHabitat) => cylinderHabitat.update(cameraWorldPosition, deltaSeconds));
        this.landingBays.forEach((landingBay) => landingBay.update(cameraWorldPosition, deltaSeconds));

        const climberSpeed = 300 / 3.6; // 300 km/h in m/s
        const roundTripDuration = (2 * this.tetherLength) / climberSpeed;

        this.climber.getTransform().position.y = remap(
            clamp(1.05 * triangleWave(this.elapsedSeconds / roundTripDuration), 0, 1),
            0,
            1,
            -this.tetherLength / 2,
            this.tetherLength / 2
        );
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.solarSections.forEach((solarSection) => solarSection.dispose());
        this.utilitySections.forEach((utilitySection) => utilitySection.dispose());
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.dispose());
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.dispose());
        this.cylinderHabitats.forEach((cylinderHabitat) => cylinderHabitat.dispose());
        this.landingBays.forEach((landingBay) => landingBay.dispose());
        this.tether.dispose();
        this.tetherMaterial.dispose();

        this.climber.dispose();

        this.root.dispose();
    }
}
