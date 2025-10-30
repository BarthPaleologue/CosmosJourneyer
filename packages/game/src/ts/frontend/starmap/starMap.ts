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

import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Animation } from "@babylonjs/core/Animations/animation";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Observable } from "@babylonjs/core/Misc/observable";
import type { Scene } from "@babylonjs/core/scene";

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import { getRgbFromTemperature } from "@/utils/specrend";

import { Settings } from "@/settings";

import type { StarMapTextures } from "../assets/textures/starMap";
import { StarSectorView, vector3ToString, type BuildData } from "./starSectorView";

export class StarMap {
    private readonly scene: Scene;
    private readonly universeBackend: UniverseBackend;

    private readonly starTemplate: Mesh;
    private readonly blackHoleTemplate: Mesh;

    readonly onSystemPicked = new Observable<StarSystemCoordinates>();
    readonly onSystemHoverStart = new Observable<StarSystemCoordinates>();
    readonly onSystemHoverEnd = new Observable<StarSystemCoordinates>();

    private readonly fadeOutAnimationDuration = 1000;
    private readonly fadeOutAnimationFrameRate = 60;
    private readonly fadeOutAnimation = new Animation(
        "fadeIn",
        "instancedBuffers.color.a",
        this.fadeOutAnimationFrameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
    );

    private readonly fadeInAnimationDuration = 1000;
    private readonly fadeInAnimationFrameRate = 60;
    private readonly fadeInAnimation = new Animation(
        "fadeIn",
        "instancedBuffers.color.a",
        this.fadeInAnimationFrameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
    );

    private readonly shimmerAnimationDuration = 1000;
    private readonly shimmerAnimationFrameRate = 60;
    private readonly shimmerAnimation = new Animation(
        "shimmer",
        "instancedBuffers.color.a",
        this.shimmerAnimationFrameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
    );

    private readonly recycledStars: InstancedMesh[] = [];
    private readonly recycledBlackHoles: InstancedMesh[] = [];

    /** Defines how many new stars are made each frame */
    private readonly starBuildBatchSize = 100;
    private readonly starBuildStack: BuildData[] = [];

    /** Max loaded star sector count in any direction */
    private readonly starSectorLoadRadius = 6;

    /** Max distance at which stars are pickable in Lightyears */
    private readonly pickMaxDistance = 50;

    private readonly loadedStarSectors: Map<string, StarSectorView> = new Map<string, StarSectorView>();

    private readonly coordinatesToInstanceMap: Map<string, InstancedMesh> = new Map();
    private readonly instanceToCoordinatesMap: Map<InstancedMesh, string> = new Map();

    private starSectorSize = Settings.STAR_SECTOR_SIZE;

    constructor(universeBackend: UniverseBackend, textures: StarMapTextures, scene: Scene) {
        this.scene = scene;
        this.universeBackend = universeBackend;

        this.starTemplate = MeshBuilder.CreatePlane("star", { size: 0.6 }, this.scene);
        this.starTemplate.isVisible = false;
        this.starTemplate.hasVertexAlpha = true;
        this.starTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this.starTemplate.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
        this.starTemplate.instancedBuffers["color"] = new Color4(1.0, 1.0, 1.0, 1.0);

        const starMaterial = new StandardMaterial("starMaterial", this.scene);
        starMaterial.emissiveTexture = textures.starSprite;
        starMaterial.transparencyMode = Material.MATERIAL_ALPHABLEND;
        starMaterial.opacityTexture = textures.starSprite;
        starMaterial.opacityTexture.getAlphaFromRGB = true;
        starMaterial.emissiveColor = Color3.White();

        this.starTemplate.material = starMaterial;

        this.blackHoleTemplate = MeshBuilder.CreatePlane("blackHole", { size: 0.8 }, this.scene);
        this.blackHoleTemplate.isVisible = false;
        this.blackHoleTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this.blackHoleTemplate.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
        this.blackHoleTemplate.instancedBuffers["color"] = new Color4(1.0, 1.0, 1.0, 1.0);

        const blackHoleMaterial = new StandardMaterial("blackHoleMaterial", this.scene);
        blackHoleMaterial.transparencyMode = Material.MATERIAL_ALPHABLEND;
        blackHoleMaterial.diffuseTexture = textures.blackHoleSprite;
        blackHoleMaterial.diffuseTexture.hasAlpha = true;
        blackHoleMaterial.useAlphaFromDiffuseTexture = true;
        blackHoleMaterial.emissiveColor = new Color3(0.9, 1.0, 1.0);

        this.blackHoleTemplate.material = blackHoleMaterial;

        this.fadeOutAnimation.setKeys([
            {
                frame: 0,
                value: 1,
            },
            {
                frame: this.fadeOutAnimationDuration / this.fadeOutAnimationFrameRate,
                value: 0,
            },
        ]);

        this.fadeInAnimation.setKeys([
            {
                frame: 0,
                value: 0,
            },
            {
                frame: this.fadeInAnimationDuration / this.fadeInAnimationFrameRate,
                value: 1,
            },
        ]);

        this.shimmerAnimation.setKeys([
            {
                frame: 0,
                value: 1.0,
            },
            {
                frame: this.shimmerAnimationDuration / this.shimmerAnimationFrameRate / 2,
                value: 1.4,
            },
            {
                frame: this.shimmerAnimationDuration / this.shimmerAnimationFrameRate,
                value: 1.0,
            },
        ]);
    }

    private buildNextStars(batchSize: number): void {
        let builtCount = 0;
        while (builtCount < batchSize) {
            const data = this.starBuildStack.pop();
            if (data === undefined) {
                break;
            }

            if (!this.loadedStarSectors.has(data.sectorString)) {
                // Skip instances whose sector was unloaded before they got built.
                continue;
            }

            this.createInstance(data);
            builtCount++;
        }
    }

    private coordinatesToString(coordinates: StarSystemCoordinates): string {
        return JSON.stringify(coordinates);
    }

    private createInstance(data: BuildData) {
        const starSystemCoordinates = data.coordinates;
        const starSystemModel = this.universeBackend.getSystemModelFromCoordinates(starSystemCoordinates);
        if (starSystemModel === null) {
            console.warn(`Could not find star system model for coordinates ${JSON.stringify(starSystemCoordinates)}`);
            return;
        }

        //TODO: when implementing binary star systems, this will need to be updated to display all stellar objects and not just the first one
        const stellarObjectModel = starSystemModel.stellarObjects[0];

        const instanceName = `${starSystemModel.name} Billboard instance`;

        let instance: InstancedMesh | null = null;
        if (stellarObjectModel.type !== "blackHole") {
            const recycledStar = this.recycledStars.pop();
            if (recycledStar !== undefined) {
                instance = recycledStar;
                instance.name = instanceName;
            } else {
                instance = this.starTemplate.createInstance(instanceName);
            }
        } else {
            const recycledBlackHole = this.recycledBlackHoles.pop();
            if (recycledBlackHole !== undefined) {
                instance = recycledBlackHole;
                instance.name = instanceName;
            } else {
                instance = this.blackHoleTemplate.createInstance(instanceName);
            }
        }

        const initializedInstance = instance;
        initializedInstance.billboardMode = Mesh.BILLBOARDMODE_ALL;

        this.coordinatesToInstanceMap.set(this.coordinatesToString(starSystemCoordinates), initializedInstance);
        this.instanceToCoordinatesMap.set(initializedInstance, this.coordinatesToString(starSystemCoordinates));

        initializedInstance.position.copyFrom(data.position);

        const objectColor = getRgbFromTemperature(stellarObjectModel.blackBodyTemperature);
        initializedInstance.instancedBuffers["color"] = new Color4(objectColor.r, objectColor.g, objectColor.b, 0.0);

        initializedInstance.setEnabled(true);
        initializedInstance.isPickable = true;
        initializedInstance.actionManager?.dispose();
        initializedInstance.actionManager = new ActionManager(this.scene);

        initializedInstance.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                this.onSystemHoverStart.notifyObservers(starSystemCoordinates);
            }),
        );

        initializedInstance.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                this.onSystemHoverEnd.notifyObservers(starSystemCoordinates);
            }),
        );

        initializedInstance.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                this.onSystemPicked.notifyObservers(starSystemCoordinates);
            }),
        );

        this.fadeIn(initializedInstance);

        if (stellarObjectModel.type === "blackHole") {
            this.loadedStarSectors.get(data.sectorString)?.blackHoleInstances.push(initializedInstance);
        } else {
            this.loadedStarSectors.get(data.sectorString)?.starInstances.push(initializedInstance);
        }
    }

    private disposeStarSector(starSector: StarSectorView) {
        for (const starInstance of starSector.starInstances) {
            this.fadeOutThenRecycle(starInstance, this.recycledStars);
        }
        for (const blackHoleInstance of starSector.blackHoleInstances) {
            this.fadeOutThenRecycle(blackHoleInstance, this.recycledBlackHoles);
        }

        this.loadedStarSectors.delete(starSector.getKey());
    }

    public update(camera: Camera) {
        const cameraPosition = camera.getWorldMatrix().getTranslation();

        const currentStarSectorCoordinates = new Vector3(
            Math.round(cameraPosition.x / this.starSectorSize),
            Math.round(cameraPosition.y / this.starSectorSize),
            Math.round(cameraPosition.z / this.starSectorSize),
        );

        for (const starSector of this.loadedStarSectors.values()) {
            for (const instance of starSector.starInstances) {
                const distance2 = Vector3.DistanceSquared(instance.position, cameraPosition);
                instance.isPickable = distance2 < this.pickMaxDistance ** 2;
            }

            for (const instance of starSector.blackHoleInstances) {
                const distance2 = Vector3.DistanceSquared(instance.position, cameraPosition);
                instance.isPickable = distance2 < this.pickMaxDistance ** 2;
            }

            // remove all star sectors that are too far
            const distanceToCamera = Vector3.Distance(starSector.position, cameraPosition);
            if (distanceToCamera / this.starSectorSize > this.starSectorLoadRadius + 1) {
                this.disposeStarSector(starSector);
            }
        }

        // then generate missing sectors
        const tempVector1 = new Vector3();
        const tempVector2 = new Vector3();
        for (let x = -this.starSectorLoadRadius; x <= this.starSectorLoadRadius; x++) {
            for (let y = -this.starSectorLoadRadius; y <= this.starSectorLoadRadius; y++) {
                for (let z = -this.starSectorLoadRadius; z <= this.starSectorLoadRadius; z++) {
                    if (x * x + y * y + z * z > this.starSectorLoadRadius * this.starSectorLoadRadius) {
                        continue;
                    }

                    const coordinates = tempVector1.copyFromFloats(x, y, z).addInPlace(currentStarSectorCoordinates);
                    const sectorKey = vector3ToString(coordinates);

                    if (this.loadedStarSectors.has(sectorKey)) {
                        continue;
                    }

                    // don't generate star sectors that are not in the frustum
                    const bb = StarSectorView.GetBoundingBox(
                        coordinates.scaleToRef(this.starSectorSize, tempVector2),
                        this.starSectorSize,
                    );
                    if (!camera.isInFrustum(bb)) {
                        continue;
                    }

                    const starSector = new StarSectorView(coordinates, this.starSectorSize, this.universeBackend);
                    this.loadedStarSectors.set(starSector.getKey(), starSector);
                    this.starBuildStack.push(...starSector.generate());
                }
            }
        }

        this.buildNextStars(this.starBuildBatchSize);
    }

    private fadeIn(instance: InstancedMesh) {
        instance.animations = [this.fadeInAnimation];
        instance
            .getScene()
            .beginAnimation(instance, 0, this.fadeInAnimationDuration / this.fadeInAnimationFrameRate, false, 1, () => {
                this.startShimmering(instance);
            });
    }

    private startShimmering(mesh: AbstractMesh) {
        mesh.animations = [this.shimmerAnimation];
        mesh.getScene().beginAnimation(
            mesh,
            0,
            this.shimmerAnimationDuration / this.shimmerAnimationFrameRate,
            true,
            0.1 + Math.random() * 0.2,
        );
    }

    private fadeOutThenRecycle(instance: InstancedMesh, recyclingList: Array<InstancedMesh>) {
        instance.animations = [this.fadeOutAnimation];
        instance
            .getScene()
            .beginAnimation(
                instance,
                0,
                this.fadeOutAnimationDuration / this.fadeOutAnimationFrameRate,
                false,
                1,
                () => {
                    instance.setEnabled(false);

                    const coordinatesKey = this.instanceToCoordinatesMap.get(instance);
                    if (coordinatesKey !== undefined) {
                        this.coordinatesToInstanceMap.delete(coordinatesKey);
                    }

                    this.instanceToCoordinatesMap.delete(instance);
                    recyclingList.push(instance);
                },
            );
    }
}
