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

import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Culling/ray";

import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Animation } from "@babylonjs/core/Animations/animation";
import { type Camera } from "@babylonjs/core/Cameras/camera";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Observable } from "@babylonjs/core/Misc/observable";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scene } from "@babylonjs/core/scene";

import { type EncyclopaediaGalactica } from "@/backend/encyclopaedia/encyclopaediaGalactica";
import { ItinerarySchema, type Itinerary } from "@/backend/player/serializedPlayer";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type Player } from "@/frontend/player/player";
import { CameraRadiusAnimation } from "@/frontend/uberCore/transforms/animations/radius";
import { TransformRotationAnimation } from "@/frontend/uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "@/frontend/uberCore/transforms/animations/translation";
import { lookAt, translate } from "@/frontend/uberCore/transforms/basicTransform";
import { alertModal } from "@/frontend/ui/dialogModal";
import { createNotification, NotificationIntent, NotificationOrigin } from "@/frontend/ui/notification";
import { type View } from "@/frontend/view";

import { wrapVector3 } from "@/utils/algebra";
import { getRgbFromTemperature } from "@/utils/specrend";
import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { StarMapControls } from "./starMapControls";
import { StarMapInputs } from "./starMapInputs";
import { StarMapUI } from "./starMapUI";
import { StarSectorView, vector3ToString, type BuildData } from "./starSectorView";
import { StellarPathfinder } from "./stellarPathfinder";
import { ThickLines } from "./thickLines";

import blackHoleTexture from "@assets/textures/blackholeParticleSmall.png";
import starTexturePath from "@assets/textures/starParticle.png";

// register cosmos journeyer as part of window object
declare global {
    interface Window {
        StarMap: StarMap;
    }
}

export class StarMap implements View {
    readonly scene: Scene;
    private readonly controls: StarMapControls;

    private rotationAnimation: TransformRotationAnimation | null = null;
    private translationAnimation: TransformTranslationAnimation | null = null;
    private radiusAnimation: CameraRadiusAnimation | null = null;

    private readonly player: Player;

    private readonly encyclopaedia: EncyclopaediaGalactica;

    private readonly starSystemDatabase: StarSystemDatabase;

    /**
     * The position of the center of the starmap in world space.
     */
    private readonly starMapCenterPosition: Vector3;

    private readonly allowedStarSectorRelativeCoordinates: Vector3[] = [];

    private readonly starTemplate: Mesh;
    private readonly blackHoleTemplate: Mesh;

    private readonly starBuildStack: BuildData[] = [];

    private readonly recycledStars: InstancedMesh[] = [];
    private readonly recycledBlackHoles: InstancedMesh[] = [];

    static readonly GENERATION_RATE = 100;
    static readonly RENDER_RADIUS = 6;

    private readonly starMapUI: StarMapUI;

    private selectedSystemCoordinates: StarSystemCoordinates | null = null;
    private currentSystemCoordinates: StarSystemCoordinates | null = null;

    private readonly loadedStarSectors: Map<string, StarSectorView> = new Map<string, StarSectorView>();

    private readonly coordinatesToInstanceMap: Map<string, InstancedMesh> = new Map();
    private readonly instanceToCoordinatesMap: Map<InstancedMesh, string> = new Map();

    private readonly travelLine: ThickLines;

    private readonly stellarPathfinder: StellarPathfinder;

    public readonly onTargetSetObservable: Observable<StarSystemCoordinates> = new Observable();

    /**
     * The position of the star sector the player is currently in (relative to the global node).
     */
    private currentStarSectorCoordinates = Vector3.Zero();

    private cameraPositionToCenter = Vector3.Zero();

    private static readonly FLOATING_ORIGIN_DISTANCE = 1000;

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

    private readonly soundPlayer: ISoundPlayer;

    constructor(
        player: Player,
        engine: AbstractEngine,
        encyclopaedia: EncyclopaediaGalactica,
        starSystemDatabase: StarSystemDatabase,
        soundPlayer: ISoundPlayer,
    ) {
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.scene.useRightHandedSystem = true;
        this.scene.onDisposeObservable.addOnce(() => {
            this.starMapUI.dispose();
        });

        this.soundPlayer = soundPlayer;

        this.controls = new StarMapControls(this.scene);
        this.controls.getCameras().forEach((camera) => (camera.minZ = 0.01));

        this.controls.getActiveCamera().attachControl();

        this.player = player;

        this.encyclopaedia = encyclopaedia;
        this.starSystemDatabase = starSystemDatabase;

        this.stellarPathfinder = new StellarPathfinder(starSystemDatabase);

        this.starMapUI = new StarMapUI(this.scene, this.player, this.starSystemDatabase, this.soundPlayer);
        this.starMapUI.onSystemFocusObservable.add((starSystemCoordinates) => {
            this.focusOnSystem(starSystemCoordinates);
        });

        this.starMapUI.shortHandUIPlotItineraryButton.addEventListener("click", async () => {
            if (this.currentSystemCoordinates === null) {
                await alertModal("current system seed is null!", this.soundPlayer);
                return;
            }
            if (this.selectedSystemCoordinates === null) {
                await alertModal("selected system seed is null!", this.soundPlayer);
                return;
            }

            const playerCurrentSpaceship = this.player.instancedSpaceships.at(0);
            if (playerCurrentSpaceship === undefined) {
                await alertModal("You do not own a spaceship! What have you done???", this.soundPlayer);
                return;
            }

            const warpDrive = playerCurrentSpaceship.getInternals().getWarpDrive();

            if (warpDrive === null) {
                await alertModal(
                    "Your current spaceship has no warp drive! Install a warp drive to plot an itinerary.",
                    this.soundPlayer,
                );
                return;
            }

            const jumpRange = warpDrive.rangeLY;

            if (starSystemCoordinatesEquals(this.selectedSystemCoordinates, this.currentSystemCoordinates)) return;
            this.soundPlayer.playNow(SoundType.CLICK);
            this.stellarPathfinder.init(this.currentSystemCoordinates, this.selectedSystemCoordinates, jumpRange);
        });

        StarMapInputs.map.focusOnCurrentSystem.on("complete", () => {
            this.focusOnCurrentSystem();
        });

        const pipeline = new DefaultRenderingPipeline("pipeline", false, this.scene, this.controls.getCameras());
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.0;
        pipeline.bloomWeight = 1.5;
        pipeline.bloomKernel = 128;
        pipeline.imageProcessing.exposure = 1.0;
        pipeline.imageProcessing.contrast = 1.0;

        this.starMapCenterPosition = Vector3.Zero();

        this.starTemplate = MeshBuilder.CreatePlane("star", { size: 0.6 }, this.scene);
        this.starTemplate.isPickable = true;
        this.starTemplate.isVisible = false;
        this.starTemplate.hasVertexAlpha = true;

        const starTexture = new Texture(starTexturePath, this.scene);

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
        blackHoleMaterial.diffuseTexture = new Texture(blackHoleTexture, this.scene);
        blackHoleMaterial.diffuseTexture.hasAlpha = true;
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

        this.travelLine = new ThickLines(
            "travelLine",
            {
                points: [],
                thickness: 0.05,
                color: Color3.Red(),
            },
            this.scene,
        );

        // then generate missing star sectors
        for (let x = -StarMap.RENDER_RADIUS; x <= StarMap.RENDER_RADIUS; x++) {
            for (let y = -StarMap.RENDER_RADIUS; y <= StarMap.RENDER_RADIUS; y++) {
                for (let z = -StarMap.RENDER_RADIUS; z <= StarMap.RENDER_RADIUS; z++) {
                    if (x * x + y * y + z * z > StarMap.RENDER_RADIUS * StarMap.RENDER_RADIUS) continue;
                    this.allowedStarSectorRelativeCoordinates.push(new Vector3(x, y, z));
                }
            }
        }

        this.scene.onBeforeRenderObservable.add(async () => {
            const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;

            if (this.rotationAnimation !== null) this.rotationAnimation.update(deltaSeconds);
            if (this.translationAnimation !== null) this.translationAnimation.update(deltaSeconds);
            if (this.radiusAnimation !== null) this.radiusAnimation.update(deltaSeconds);

            this.controls.update(deltaSeconds);

            this.acknowledgeCameraMovement();

            this.updateStarSectors();

            // update pathfinder
            const pathfinderMaxIterations = 50_000;
            const pathfinderStepsPerFrame = 10;
            for (let i = 0; i < pathfinderStepsPerFrame; i++) {
                if (!this.stellarPathfinder.hasBeenInit()) break;
                if (this.stellarPathfinder.hasFoundPath()) break;
                if (this.stellarPathfinder.getNbIterations() >= pathfinderMaxIterations) break;

                this.stellarPathfinder.update();

                if (this.stellarPathfinder.hasFoundPath()) {
                    this.soundPlayer.playNow(SoundType.ITINERARY_COMPUTED);
                    const path = this.stellarPathfinder.getPath();
                    if (!path.success) {
                        await alertModal(path.error.message, this.soundPlayer);
                        continue;
                    }

                    const parsedItinerary = ItinerarySchema.safeParse(path.value);
                    if (parsedItinerary.success) {
                        this.drawPath(parsedItinerary.data);
                        this.player.currentItinerary = parsedItinerary.data;
                    } else {
                        createNotification(
                            NotificationOrigin.GENERAL,
                            NotificationIntent.ERROR,
                            `Failed to parse itinerary: ${parsedItinerary.error.message}`,
                            5000,
                            this.soundPlayer,
                        );
                        this.player.currentItinerary = null;
                    }

                    const nextDestination = path.value[1];

                    if (nextDestination !== undefined) {
                        this.onTargetSetObservable.notifyObservers(nextDestination);
                    }
                } else if (this.stellarPathfinder.getNbIterations() >= pathfinderMaxIterations) {
                    createNotification(
                        NotificationOrigin.GENERAL,
                        NotificationIntent.ERROR,
                        `Could not find a path to the target system after ${pathfinderMaxIterations} iterations`,
                        5000,
                        this.soundPlayer,
                    );
                }
            }

            if (this.stellarPathfinder.hasBeenInit() && !this.stellarPathfinder.hasFoundPath()) {
                this.starMapUI.shortHandUIPlotItineraryButton.classList.add("loading");
            } else {
                this.starMapUI.shortHandUIPlotItineraryButton.classList.remove("loading");
            }
        });

        this.scene.onAfterRenderObservable.add(() => {
            const activeCamera = this.scene.activeCamera;
            if (activeCamera === null) throw new Error("No active camera!");
            this.starMapUI.update(activeCamera.globalPosition, this.starMapCenterPosition);
        });

        window.StarMap = this;
    }

    private drawPath(path: DeepReadonly<Itinerary>) {
        const points = path.map((coordinates) => {
            return wrapVector3(this.starSystemDatabase.getSystemGalacticPosition(coordinates));
        });
        this.travelLine.setPoints(points);
    }

    private acknowledgeCameraMovement() {
        const activeCamera = this.scene.activeCamera;
        if (activeCamera === null) throw new Error("No active camera!");
        // floating origin
        if (activeCamera.globalPosition.length() > StarMap.FLOATING_ORIGIN_DISTANCE) {
            this.translateCameraBackToOrigin(activeCamera);
        }

        this.cameraPositionToCenter = activeCamera.globalPosition.subtract(this.starMapCenterPosition);
        this.currentStarSectorCoordinates = new Vector3(
            Math.round(this.cameraPositionToCenter.x / Settings.STAR_SECTOR_SIZE),
            Math.round(this.cameraPositionToCenter.y / Settings.STAR_SECTOR_SIZE),
            Math.round(this.cameraPositionToCenter.z / Settings.STAR_SECTOR_SIZE),
        );
    }

    private translateCameraBackToOrigin(camera: Camera) {
        const translationToOrigin = camera.globalPosition.negate();
        this.controls.getTransform().position.addInPlace(translationToOrigin);
        this.controls.getActiveCamera().getViewMatrix(true);
        this.starMapCenterPosition.addInPlace(translationToOrigin);
        for (const mesh of this.scene.meshes) mesh.position.addInPlace(translationToOrigin);
    }

    /**
     * Register a star sector at the given coordinates, it will be added to the generation queue
     * @param coordinates The coordinates of the sector
     * @param generateNow
     */
    private registerStarSector(coordinates: Vector3, generateNow = false): StarSectorView {
        const starSector = new StarSectorView(coordinates, this.starSystemDatabase);
        this.loadedStarSectors.set(starSector.getKey(), starSector);

        if (!generateNow) this.starBuildStack.push(...starSector.generate());
        else {
            const data = starSector.generate();
            for (const d of data) this.createInstance(d);
        }

        return starSector;
    }

    public setCurrentStarSystem(starSystemCoordinates: StarSystemCoordinates) {
        this.currentSystemCoordinates = starSystemCoordinates;
        this.selectedSystemCoordinates = starSystemCoordinates;

        const sectorCoordinates = new Vector3(
            starSystemCoordinates.starSectorX,
            starSystemCoordinates.starSectorY,
            starSystemCoordinates.starSectorZ,
        );

        if (this.loadedStarSectors.has(vector3ToString(sectorCoordinates))) {
            this.starMapUI.setCurrentSystem(starSystemCoordinates);
            this.focusOnCurrentSystem();
            return;
        }

        this.registerStarSector(sectorCoordinates, true);
        this.starMapUI.setCurrentSystem(starSystemCoordinates);

        const translation = sectorCoordinates
            .subtract(this.currentStarSectorCoordinates)
            .scaleInPlace(Settings.STAR_SECTOR_SIZE);
        translate(this.controls.getTransform(), translation);
        this.controls.getActiveCamera().getViewMatrix(true);
        this.acknowledgeCameraMovement();

        this.focusOnCurrentSystem(true);
    }

    private updateStarSectors() {
        const activeCamera = this.scene.activeCamera;
        if (activeCamera === null) throw new Error("No active camera!");
        const activeCameraPosition = activeCamera.globalPosition;

        // first remove all star sectors that are too far
        const currentSystemInstance =
            this.currentSystemCoordinates === null
                ? null
                : (this.coordinatesToInstanceMap.get(JSON.stringify(this.currentSystemCoordinates)) as InstancedMesh);
        const selectedSystemInstance =
            this.selectedSystemCoordinates === null
                ? null
                : (this.coordinatesToInstanceMap.get(JSON.stringify(this.selectedSystemCoordinates)) as InstancedMesh);
        for (const starSector of this.loadedStarSectors.values()) {
            // only set as pickable if the distance is less than 40 light years
            const pickableThresholdLy = 45;
            starSector.starInstances.forEach((starInstance) => {
                starInstance.isPickable =
                    Vector3.DistanceSquared(starInstance.position, activeCameraPosition) <
                    pickableThresholdLy * pickableThresholdLy;
            });
            starSector.blackHoleInstances.forEach((blackHoleInstance) => {
                blackHoleInstance.isPickable =
                    Vector3.DistanceSquared(blackHoleInstance.position, activeCameraPosition) <
                    pickableThresholdLy * pickableThresholdLy;
            });

            if (
                currentSystemInstance !== null &&
                starSector.starInstances.concat(starSector.blackHoleInstances).includes(currentSystemInstance)
            )
                continue; // don't remove star sector that contains the current system
            if (
                selectedSystemInstance !== null &&
                starSector.starInstances.concat(starSector.blackHoleInstances).includes(selectedSystemInstance)
            )
                continue; // don't remove star sector that contains the selected system

            const position = starSector.position;
            if (
                position.subtract(this.cameraPositionToCenter).length() / Settings.STAR_SECTOR_SIZE >
                StarMap.RENDER_RADIUS + 1
            ) {
                for (const starInstance of starSector.starInstances)
                    this.fadeOutThenRecycle(starInstance, this.recycledStars);
                for (const blackHoleInstance of starSector.blackHoleInstances)
                    this.fadeOutThenRecycle(blackHoleInstance, this.recycledBlackHoles);

                this.loadedStarSectors.delete(starSector.getKey());
            }
        }

        // then generate missing sectors
        for (const relativeCoordinate of this.allowedStarSectorRelativeCoordinates) {
            const coordinates = this.currentStarSectorCoordinates.add(relativeCoordinate);
            const sectorKey = vector3ToString(coordinates);

            if (this.loadedStarSectors.has(sectorKey)) continue; // already generated

            // don't generate star sectors that are not in the frustum
            const bb = StarSectorView.GetBoundingBox(
                coordinates.scale(Settings.STAR_SECTOR_SIZE),
                this.starMapCenterPosition,
            );
            if (!activeCamera.isInFrustum(bb)) continue;

            this.registerStarSector(coordinates);
        }

        this.buildNextStars(Math.min(2000, StarMap.GENERATION_RATE * this.controls.getSpeed()));
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

    private createInstance(data: BuildData) {
        const starSystemCoordinates = data.coordinates;
        const starSystemModel = this.starSystemDatabase.getSystemModelFromCoordinates(starSystemCoordinates);
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

        if (stellarObjectModel.type !== OrbitalObjectType.BLACK_HOLE) {
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

        this.coordinatesToInstanceMap.set(JSON.stringify(starSystemCoordinates), initializedInstance);
        this.instanceToCoordinatesMap.set(initializedInstance, JSON.stringify(starSystemCoordinates));

        initializedInstance.position = data.position.add(this.starMapCenterPosition);

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
                this.starMapUI.setHoveredSystem(starSystemCoordinates);
                this.soundPlayer.playNow(SoundType.HOVER);
            }),
        );

        initializedInstance.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                this.starMapUI.setHoveredSystem(null);
            }),
        );

        initializedInstance.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                this.soundPlayer.playNow(SoundType.TARGET_LOCK);

                this.starMapUI.setSelectedSystem(starSystemModel, this.currentSystemCoordinates);

                this.selectedSystemCoordinates = starSystemCoordinates;

                this.focusOnSystem(starSystemCoordinates);
            }),
        );

        this.fadeIn(initializedInstance);

        if (stellarObjectModel.type === OrbitalObjectType.BLACK_HOLE)
            this.loadedStarSectors.get(data.sectorString)?.blackHoleInstances.push(initializedInstance);
        else this.loadedStarSectors.get(data.sectorString)?.starInstances.push(initializedInstance);
    }

    public focusOnCurrentSystem(skipAnimation = false) {
        if (this.currentSystemCoordinates === null) {
            console.warn("No current system seed!");
            return;
        }
        this.focusOnSystem(this.currentSystemCoordinates, skipAnimation);
    }

    public focusOnSystem(starSystemCoordinates: StarSystemCoordinates, skipAnimation = false) {
        const starSystemPosition = wrapVector3(
            this.starSystemDatabase.getSystemGalacticPosition(starSystemCoordinates),
        ).add(this.starMapCenterPosition);

        const cameraDir = this.controls.thirdPersonCamera.getDirection(
            Vector3.Forward(this.scene.useRightHandedSystem),
        );

        const cameraToStarDir = starSystemPosition.subtract(this.controls.thirdPersonCamera.globalPosition).normalize();

        const rotationAngle = Math.acos(Vector3.Dot(cameraDir, cameraToStarDir));

        const animationDurationSeconds = 1;

        // if the rotation axis has a length different from 1, it means the cross product was made between very close vectors : no rotation is needed
        if (skipAnimation) {
            lookAt(this.controls.getTransform(), starSystemPosition, this.scene.useRightHandedSystem);
            this.controls.getTransform().computeWorldMatrix(true);
        } else if (rotationAngle > 0.02) {
            const rotationAxis = Vector3.Cross(cameraDir, cameraToStarDir).normalize();
            this.rotationAnimation = new TransformRotationAnimation(
                this.controls.getTransform(),
                rotationAxis,
                rotationAngle,
                animationDurationSeconds,
            );
        }

        const transformToStarDir = starSystemPosition
            .subtract(this.controls.getTransform().getAbsolutePosition())
            .normalize();
        const distance = starSystemPosition.subtract(this.controls.getTransform().getAbsolutePosition()).length();
        const targetPosition = this.controls
            .getTransform()
            .getAbsolutePosition()
            .add(transformToStarDir.scaleInPlace(distance));

        // if the transform is already in the right position, do not animate
        if (skipAnimation) this.controls.getTransform().position = targetPosition;
        else if (targetPosition.subtract(this.controls.getTransform().getAbsolutePosition()).lengthSquared() > 0.1) {
            this.translationAnimation = new TransformTranslationAnimation(
                this.controls.getTransform(),
                targetPosition,
                animationDurationSeconds,
            );
        }

        const targetRadius = 10;
        if (skipAnimation) this.controls.thirdPersonCamera.radius = targetRadius;
        else {
            this.radiusAnimation = new CameraRadiusAnimation(
                this.controls.thirdPersonCamera,
                targetRadius,
                animationDurationSeconds,
            );
        }

        this.selectedSystemCoordinates = starSystemCoordinates;
        const starSystemModel = this.starSystemDatabase.getSystemModelFromCoordinates(starSystemCoordinates);
        if (starSystemModel === null)
            throw new Error(
                `Could not find star system model for coordinates ${JSON.stringify(starSystemCoordinates)}`,
            );
        this.starMapUI.setSelectedSystem(starSystemModel, this.currentSystemCoordinates);
        this.starMapUI.setHoveredSystem(null);
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

    private fadeOutThenRecycle(instance: InstancedMesh, recyclingList: InstancedMesh[]) {
        instance.animations = [StarMap.FADE_OUT_ANIMATION];
        instance.getScene().beginAnimation(instance, 0, StarMap.FADE_OUT_DURATION / 60, false, 1, () => {
            instance.setEnabled(false);

            const seed = this.instanceToCoordinatesMap.get(instance);
            if (seed === undefined) throw new Error("No seed for instance!");
            this.coordinatesToInstanceMap.delete(seed);
            this.instanceToCoordinatesMap.delete(instance);

            recyclingList.push(instance);
        });
    }

    public render() {
        this.scene.render();
    }

    public attachControl() {
        this.scene.attachControl();
        this.starMapUI.htmlRoot.classList.remove("hidden");
        if (this.player.currentItinerary !== null) {
            this.drawPath(this.player.currentItinerary);
        }
    }

    public detachControl() {
        this.scene.detachControl();
        this.starMapUI.htmlRoot.classList.add("hidden");
    }

    public getMainScene(): Scene {
        return this.scene;
    }
}
