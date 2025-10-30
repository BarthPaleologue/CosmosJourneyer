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
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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

    private static readonly FADE_OUT_ANIMATION = new Animation(
        "fadeIn",
        "instancedBuffers.color.a",
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    private static readonly FADE_OUT_DURATION = 1000;

    private static readonly FADE_IN_ANIMATION = new Animation(
        "fadeIn",
        "instancedBuffers.color.a",
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    private static readonly FADE_IN_DURATION = 1000;

    private static readonly SHIMMER_ANIMATION = new Animation(
        "shimmer",
        "instancedBuffers.color.a",
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    private static readonly SHIMMER_DURATION = 1000;

    private readonly starBuildStack: BuildData[] = [];

    private readonly recycledStars: InstancedMesh[] = [];
    private readonly recycledBlackHoles: InstancedMesh[] = [];

    static readonly GENERATION_RATE = 1000;
    static readonly RENDER_RADIUS = 6;

    private readonly loadedStarSectors: Map<string, StarSectorView> = new Map<string, StarSectorView>();

    private readonly coordinatesToInstanceMap: Map<string, InstancedMesh> = new Map();
    private readonly instanceToCoordinatesMap: Map<InstancedMesh, string> = new Map();

    constructor(universeBackend: UniverseBackend, textures: StarMapTextures, scene: Scene) {
        this.scene = scene;
        this.universeBackend = universeBackend;

        this.starTemplate = MeshBuilder.CreatePlane("star", { size: 0.6 }, this.scene);
        this.starTemplate.isPickable = true;
        this.starTemplate.isVisible = false;
        this.starTemplate.hasVertexAlpha = true;

        const starTexture = textures.starSprite;

        const starMaterial = new StandardMaterial("starMaterial", this.scene);
        starMaterial.emissiveTexture = starTexture;
        starMaterial.transparencyMode = 2;
        starMaterial.opacityTexture = starTexture;
        starMaterial.opacityTexture.getAlphaFromRGB = true;
        starMaterial.emissiveColor = Color3.White();
        starMaterial.freeze();

        this.starTemplate.material = starMaterial;

        this.starTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;

        this.starTemplate.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
        this.starTemplate.instancedBuffers["color"] = new Color4(1.0, 1.0, 1.0, 1.0);

        this.blackHoleTemplate = MeshBuilder.CreatePlane("blackHole", { size: 0.8 }, this.scene);
        this.blackHoleTemplate.isPickable = true;
        this.blackHoleTemplate.isVisible = false;

        const blackHoleMaterial = new StandardMaterial("blackHoleMaterial", this.scene);
        blackHoleMaterial.transparencyMode = 2;
        blackHoleMaterial.diffuseTexture = textures.blackHoleSprite;
        blackHoleMaterial.diffuseTexture.hasAlpha = true;
        blackHoleMaterial.useAlphaFromDiffuseTexture = true;
        blackHoleMaterial.emissiveColor = new Color3(0.9, 1.0, 1.0);
        blackHoleMaterial.freeze();

        this.blackHoleTemplate.material = blackHoleMaterial;

        this.blackHoleTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;

        this.blackHoleTemplate.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
        this.blackHoleTemplate.instancedBuffers["color"] = new Color4(1.0, 1.0, 1.0, 1.0);

        StarMap.FADE_OUT_ANIMATION.setKeys([
            {
                frame: 0,
                value: 1,
            },
            {
                frame: StarMap.FADE_OUT_DURATION / 60,
                value: 0,
            },
        ]);

        StarMap.FADE_IN_ANIMATION.setKeys([
            {
                frame: 0,
                value: 0,
            },
            {
                frame: StarMap.FADE_IN_DURATION / 60,
                value: 1,
            },
        ]);

        StarMap.SHIMMER_ANIMATION.setKeys([
            {
                frame: 0,
                value: 1.0,
            },
            {
                frame: StarMap.SHIMMER_DURATION / 60 / 2,
                value: 1.4,
            },
            {
                frame: StarMap.SHIMMER_DURATION / 60,
                value: 1.0,
            },
        ]);
    }

    private buildNextStars(n: number): void {
        for (let i = 0; i < n; i++) {
            const data = this.starBuildStack.pop();
            if (data === undefined) return;

            if (!this.loadedStarSectors.has(data.sectorString)) {
                // if star sector was removed in the meantime we build another star
                n++;
                continue;
            }

            this.createInstance(data);
        }
    }

    /**
     * Register a star sector at the given coordinates, it will be added to the generation queue
     * @param coordinates The coordinates of the sector
     * @param generateNow
     */
    private registerStarSector(coordinates: Vector3, generateNow = false): StarSectorView {
        const starSector = new StarSectorView(coordinates, this.universeBackend);
        this.loadedStarSectors.set(starSector.getKey(), starSector);

        if (!generateNow) this.starBuildStack.push(...starSector.generate());
        else {
            const data = starSector.generate();
            for (const d of data) this.createInstance(d);
        }

        return starSector;
    }

    private coordinatesToString(coordinates: StarSystemCoordinates): string {
        return JSON.stringify(coordinates);
    }

    private createInstance(data: BuildData) {
        const starSystemCoordinates = data.coordinates;
        const starSystemModel = this.universeBackend.getSystemModelFromCoordinates(starSystemCoordinates);
        if (starSystemModel === null) {
            throw new Error(
                `Could not find star system model for coordinates ${JSON.stringify(starSystemCoordinates)}`,
            );
        }

        //TODO: when implementing binary star systems, this will need to be updated to display all stellar objects and not just the first one
        const stellarObjectModel = starSystemModel.stellarObjects[0];

        const instanceName = `${starSystemModel.name} Billboard instance`;

        let instance: InstancedMesh | null = null;
        let recycled = false;

        if (stellarObjectModel.type !== "blackHole") {
            const recycledStar = this.recycledStars.shift();
            if (recycledStar !== undefined) {
                instance = recycledStar;
                instance.name = instanceName;
                recycled = true;
            } else instance = this.starTemplate.createInstance(instanceName);
        } else {
            const recycledBlackHole = this.recycledBlackHoles.shift();
            if (recycledBlackHole !== undefined) {
                instance = recycledBlackHole;
                instance.name = instanceName;
                recycled = true;
            } else instance = this.blackHoleTemplate.createInstance(instanceName);
        }

        const initializedInstance = instance;
        initializedInstance.billboardMode = Mesh.BILLBOARDMODE_ALL;

        this.coordinatesToInstanceMap.set(this.coordinatesToString(starSystemCoordinates), initializedInstance);
        this.instanceToCoordinatesMap.set(initializedInstance, this.coordinatesToString(starSystemCoordinates));

        initializedInstance.position.copyFrom(data.position);

        const objectColor = getRgbFromTemperature(stellarObjectModel.blackBodyTemperature);
        initializedInstance.instancedBuffers["color"] = new Color4(objectColor.r, objectColor.g, objectColor.b, 0.0);

        if (recycled) {
            initializedInstance.setEnabled(true);
        }

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

        if (stellarObjectModel.type === "blackHole")
            this.loadedStarSectors.get(data.sectorString)?.blackHoleInstances.push(initializedInstance);
        else this.loadedStarSectors.get(data.sectorString)?.starInstances.push(initializedInstance);
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

    update(camera: Camera) {
        const cameraPosition = camera.getWorldMatrix().getTranslation();

        const currentStarSectorCoordinates = new Vector3(
            Math.round(cameraPosition.x / Settings.STAR_SECTOR_SIZE),
            Math.round(cameraPosition.y / Settings.STAR_SECTOR_SIZE),
            Math.round(cameraPosition.z / Settings.STAR_SECTOR_SIZE),
        );

        for (const starSector of this.loadedStarSectors.values()) {
            const pickMaxDistance = 45;
            for (const instance of [...starSector.starInstances, ...starSector.blackHoleInstances]) {
                const distance2 = Vector3.DistanceSquared(instance.position, cameraPosition);
                instance.isPickable = distance2 < pickMaxDistance ** 2;
            }

            // remove all star sectors that are too far
            const distanceToCamera = Vector3.Distance(starSector.position, cameraPosition);
            if (distanceToCamera / Settings.STAR_SECTOR_SIZE > StarMap.RENDER_RADIUS + 1) {
                this.disposeStarSector(starSector);
            }
        }

        // then generate missing sectors
        for (let x = -StarMap.RENDER_RADIUS; x <= StarMap.RENDER_RADIUS; x++) {
            for (let y = -StarMap.RENDER_RADIUS; y <= StarMap.RENDER_RADIUS; y++) {
                for (let z = -StarMap.RENDER_RADIUS; z <= StarMap.RENDER_RADIUS; z++) {
                    if (x * x + y * y + z * z > StarMap.RENDER_RADIUS * StarMap.RENDER_RADIUS) continue;
                    const relativeCoordinate = new Vector3(x, y, z);
                    const coordinates = currentStarSectorCoordinates.add(relativeCoordinate);
                    const sectorKey = vector3ToString(coordinates);

                    if (this.loadedStarSectors.has(sectorKey)) {
                        continue;
                    }

                    // don't generate star sectors that are not in the frustum
                    const bb = StarSectorView.GetBoundingBox(coordinates.scale(Settings.STAR_SECTOR_SIZE));
                    if (!camera.isInFrustum(bb)) {
                        continue;
                    }

                    this.registerStarSector(coordinates);
                }
            }
        }

        this.buildNextStars(StarMap.GENERATION_RATE);
    }

    private fadeIn(instance: InstancedMesh) {
        instance.animations = [StarMap.FADE_IN_ANIMATION];
        instance.getScene().beginAnimation(instance, 0, StarMap.FADE_IN_DURATION / 60, false, 1, () => {
            instance.animations = [StarMap.SHIMMER_ANIMATION];
            instance
                .getScene()
                .beginAnimation(instance, 0, StarMap.SHIMMER_DURATION / 60, true, 0.1 + Math.random() * 0.2);
        });
    }

    private fadeOutThenRecycle(instance: InstancedMesh, recyclingList: Array<InstancedMesh>) {
        instance.animations = [StarMap.FADE_OUT_ANIMATION];
        instance.getScene().beginAnimation(instance, 0, StarMap.FADE_OUT_DURATION / 60, false, 1, () => {
            instance.setEnabled(false);

            this.instanceToCoordinatesMap.delete(instance);
            recyclingList.push(instance);

            const coordinatesKey = this.instanceToCoordinatesMap.get(instance);
            if (coordinatesKey !== undefined) {
                this.coordinatesToInstanceMap.delete(coordinatesKey);
            }
        });
    }
}
