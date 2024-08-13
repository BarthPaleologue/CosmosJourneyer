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

import starTexture from "../../asset/textures/starParticle.png";
import blackHoleTexture from "../../asset/textures/blackholeParticleSmall.png";

import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { BuildData, StarSector, vector3ToString } from "./starSector";
import { StarMapUI } from "./starMapUI";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Animation } from "@babylonjs/core/Animations/animation";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import "@babylonjs/core/Animations/animatable";
import "@babylonjs/core/Culling/ray";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../uberCore/transforms/animations/translation";
import { translate } from "../uberCore/transforms/basicTransform";
import { ThickLines } from "../utils/thickLines";
import { Observable } from "@babylonjs/core/Misc/observable";
import { StarModel } from "../stellarObjects/star/starModel";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { SystemSeed } from "../utils/systemSeed";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { View } from "../utils/view";
import { syncCamera } from "../utils/cameraSyncing";
import { AudioInstance } from "../utils/audioInstance";
import { AudioManager } from "../audio/audioManager";
import { AudioMasks } from "../audio/audioMasks";
import { StarMapInputs } from "../inputs/starMapInputs";
import { BodyType } from "../architecture/bodyType";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Sounds } from "../assets/sounds";
import { StarMapControls } from "../starMapControls/starMapControls";
import { CameraRadiusAnimation } from "../uberCore/transforms/animations/radius";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { StellarPathfinder } from "./stellarPathfinder";
import { createNotification } from "../utils/notification";

export class StarMap implements View {
    readonly scene: Scene;
    private readonly controls: StarMapControls;

    private readonly backgroundMusic: AudioInstance;

    private rotationAnimation: TransformRotationAnimation | null = null;
    private translationAnimation: TransformTranslationAnimation | null = null;
    private radiusAnimation: CameraRadiusAnimation | null = null;

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

    private selectedSystemSeed: SystemSeed | null = null;
    private currentSystemSeed: SystemSeed | null = null;

    private readonly loadedStarSectors: Map<string, StarSector> = new Map<string, StarSector>();

    private readonly seedToInstanceMap: Map<string, InstancedMesh> = new Map();
    private readonly instanceToSeedMap: Map<InstancedMesh, string> = new Map();

    private readonly travelLine: ThickLines;
    private readonly thickLines: ThickLines[];

    private readonly stellarPathfinder: StellarPathfinder = new StellarPathfinder();

    public readonly onTargetSetObservable: Observable<SystemSeed> = new Observable();

    /**
     * The position of the star sector the player is currently in (relative to the global node).
     */
    private currentStarSectorCoordinates = Vector3.Zero();

    private cameraPositionToCenter = Vector3.Zero();

    private static readonly FLOATING_ORIGIN_DISTANCE = 1000;

    private static readonly FADE_OUT_ANIMATION = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    private static readonly FADE_OUT_DURATION = 1000;

    private static readonly FADE_IN_ANIMATION = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    private static readonly FADE_IN_DURATION = 1000;

    private static readonly SHIMMER_ANIMATION = new Animation("shimmer", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    private static readonly SHIMMER_DURATION = 1000;

    constructor(engine: AbstractEngine) {
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.scene.useRightHandedSystem = true;

        this.controls = new StarMapControls(this.scene);
        this.controls.getActiveCameras().forEach((camera) => (camera.minZ = 0.01));

        this.controls.getActiveCameras()[0].attachControl();

        this.backgroundMusic = new AudioInstance(Sounds.STAR_MAP_BACKGROUND_MUSIC, AudioMasks.STAR_MAP_VIEW, 1, false, null);
        AudioManager.RegisterSound(this.backgroundMusic);
        this.backgroundMusic.sound.play();

        this.starMapUI = new StarMapUI(engine);

        this.starMapUI.plotItineraryButton.onPointerClickObservable.add(() => {
            Sounds.MENU_SELECT_SOUND.play();
            if (this.currentSystemSeed === null) throw new Error("current system seed is null!");
            if (this.selectedSystemSeed === null) throw new Error("selected system seed is null!");
            this.stellarPathfinder.init(this.currentSystemSeed, this.selectedSystemSeed, 10);
            while (!this.stellarPathfinder.hasFoundPath() && this.stellarPathfinder.getNbIterations() < 100) {
                this.stellarPathfinder.update();
            }
            if (this.stellarPathfinder.hasFoundPath()) {
                const path = this.stellarPathfinder.getPath();
                console.log(path);

                const points = path.map((seed) => {
                    return this.seedToInstanceMap.get(seed.toString()) as InstancedMesh;
                });

                this.travelLine.setPoints(points);
                this.onTargetSetObservable.notifyObservers(path[1]);
            } else {
                createNotification("Could not find a path to the target system", 5000);
            }
        });

        StarMapInputs.map.focusOnCurrentSystem.on("complete", () => {
            this.focusOnCurrentSystem();
        });

        const pipeline = new DefaultRenderingPipeline("pipeline", false, this.scene, this.controls.getActiveCameras());
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.0;
        pipeline.bloomWeight = 1.5;
        pipeline.bloomKernel = 128;
        pipeline.imageProcessing.exposure = 1.0;
        pipeline.imageProcessing.contrast = 1.0;

        this.starMapCenterPosition = Vector3.Zero();

        this.starTemplate = MeshBuilder.CreatePlane("star", { size: 0.15 }, this.scene);
        this.starTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this.starTemplate.isPickable = true;
        this.starTemplate.isVisible = false;
        this.starTemplate.hasVertexAlpha = true;

        const starMaterial = new StandardMaterial("starMaterial", this.scene);
        starMaterial.emissiveTexture = new Texture(starTexture, this.scene);
        starMaterial.opacityTexture = new Texture(starTexture, this.scene);
        starMaterial.opacityTexture.getAlphaFromRGB = true;
        starMaterial.emissiveColor = Color3.White();
        starMaterial.freeze();

        this.starTemplate.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
        this.starTemplate.material = starMaterial;

        this.blackHoleTemplate = MeshBuilder.CreatePlane("blackHole", { size: 0.2 }, this.scene);
        this.blackHoleTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this.blackHoleTemplate.isPickable = true;
        this.blackHoleTemplate.isVisible = false;

        const blackHoleMaterial = new StandardMaterial("blackHoleMaterial", this.scene);
        blackHoleMaterial.diffuseTexture = new Texture(blackHoleTexture, this.scene);
        blackHoleMaterial.diffuseTexture.hasAlpha = true;
        blackHoleMaterial.emissiveColor = new Color3(0.9, 1.0, 1.0);
        blackHoleMaterial.freeze();

        this.blackHoleTemplate.registerInstancedBuffer("color", 4); // 4 is the stride size eg. 4 floats here
        this.blackHoleTemplate.material = blackHoleMaterial;

        StarMap.FADE_OUT_ANIMATION.setKeys([
            {
                frame: 0,
                value: 1
            },
            {
                frame: StarMap.FADE_OUT_DURATION / 60,
                value: 0
            }
        ]);

        StarMap.FADE_IN_ANIMATION.setKeys([
            {
                frame: 0,
                value: 0
            },
            {
                frame: StarMap.FADE_IN_DURATION / 60,
                value: 1
            }
        ]);

        StarMap.SHIMMER_ANIMATION.setKeys([
            {
                frame: 0,
                value: 1.0
            },
            {
                frame: StarMap.SHIMMER_DURATION / 60 / 2,
                value: 1.4
            },
            {
                frame: StarMap.SHIMMER_DURATION / 60,
                value: 1.0
            }
        ]);

        this.travelLine = new ThickLines(
            "travelLine",
            {
                points: [],
                thickness: 0.05,
                color: Color3.Red()
            },
            this.scene
        );
        this.thickLines = [this.travelLine];

        // then generate missing star sectors
        for (let x = -StarMap.RENDER_RADIUS; x <= StarMap.RENDER_RADIUS; x++) {
            for (let y = -StarMap.RENDER_RADIUS; y <= StarMap.RENDER_RADIUS; y++) {
                for (let z = -StarMap.RENDER_RADIUS; z <= StarMap.RENDER_RADIUS; z++) {
                    if (x * x + y * y + z * z > StarMap.RENDER_RADIUS * StarMap.RENDER_RADIUS) continue;
                    this.allowedStarSectorRelativeCoordinates.push(new Vector3(x, y, z));
                }
            }
        }

        this.scene.onBeforeRenderObservable.add(() => {
            const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;

            if (this.rotationAnimation !== null) this.rotationAnimation.update(deltaSeconds);
            if (this.translationAnimation !== null) this.translationAnimation.update(deltaSeconds);
            if (this.radiusAnimation !== null) this.radiusAnimation.update(deltaSeconds);

            this.controls.update(deltaSeconds);

            this.acknowledgeCameraMovement();

            this.updateStarSectors();

            this.thickLines.forEach((bondingLine) => bondingLine.update());
        });
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
            Math.round(this.cameraPositionToCenter.x / StarSector.SIZE),
            Math.round(this.cameraPositionToCenter.y / StarSector.SIZE),
            Math.round(this.cameraPositionToCenter.z / StarSector.SIZE)
        );
    }

    public translateCameraBackToOrigin(camera: Camera) {
        const translationToOrigin = camera.globalPosition.negate();
        this.controls.getTransform().position.addInPlace(translationToOrigin);
        this.controls.getActiveCameras().forEach((camera) => camera.getViewMatrix(true));
        this.starMapCenterPosition.addInPlace(translationToOrigin);
        for (const mesh of this.scene.meshes) mesh.position.addInPlace(translationToOrigin);
    }

    /**
     * Register a star sector at the given coordinates, it will be added to the generation queue
     * @param coordinates The coordinates of the sector
     * @param generateNow
     */
    private registerStarSector(coordinates: Vector3, generateNow = false): StarSector {
        const starSector = new StarSector(coordinates);
        this.loadedStarSectors.set(starSector.getKey(), starSector);

        if (!generateNow) this.starBuildStack.push(...starSector.generate());
        else {
            const data = starSector.generate();
            for (const d of data) this.createInstance(d);
        }

        return starSector;
    }

    public setCurrentStarSystem(starSystemSeed: SystemSeed) {
        this.currentSystemSeed = starSystemSeed;
        this.selectedSystemSeed = starSystemSeed;

        const sectorCoordinates = new Vector3(starSystemSeed.starSectorX, starSystemSeed.starSectorY, starSystemSeed.starSectorZ);

        if (this.loadedStarSectors.has(vector3ToString(sectorCoordinates))) {
            this.starMapUI.setCurrentStarSystemMesh(this.seedToInstanceMap.get(this.currentSystemSeed.toString()) as InstancedMesh);
            this.focusOnCurrentSystem();
            return;
        }

        this.registerStarSector(sectorCoordinates, true);
        this.starMapUI.setCurrentStarSystemMesh(this.seedToInstanceMap.get(this.currentSystemSeed.toString()) as InstancedMesh);

        const translation = sectorCoordinates.subtract(this.currentStarSectorCoordinates).scaleInPlace(StarSector.SIZE);
        translate(this.controls.getTransform(), translation);
        this.controls.getActiveCameras().forEach((camera) => camera.getViewMatrix(true));
        this.acknowledgeCameraMovement();

        this.focusOnCurrentSystem(true);
    }

    private updateStarSectors() {
        // first remove all star sectors that are too far
        const currentSystemInstance = this.currentSystemSeed === null ? null : (this.seedToInstanceMap.get(this.currentSystemSeed.toString()) as InstancedMesh);
        const selectedSystemInstance = this.selectedSystemSeed === null ? null : (this.seedToInstanceMap.get(this.selectedSystemSeed.toString()) as InstancedMesh);
        for (const starSector of this.loadedStarSectors.values()) {
            if (currentSystemInstance !== null && starSector.starInstances.concat(starSector.blackHoleInstances).includes(currentSystemInstance)) continue; // don't remove star sector that contains the current system
            if (selectedSystemInstance !== null && starSector.starInstances.concat(starSector.blackHoleInstances).includes(selectedSystemInstance)) continue; // don't remove star sector that contains the selected system

            const position = starSector.position;
            if (position.subtract(this.cameraPositionToCenter).length() / StarSector.SIZE > StarMap.RENDER_RADIUS + 1) {
                for (const starInstance of starSector.starInstances) this.fadeOutThenRecycle(starInstance, this.recycledStars);
                for (const blackHoleInstance of starSector.blackHoleInstances) this.fadeOutThenRecycle(blackHoleInstance, this.recycledBlackHoles);

                this.loadedStarSectors.delete(starSector.getKey());
            }
        }

        // then generate missing sectors
        for (const relativeCoordinate of this.allowedStarSectorRelativeCoordinates) {
            const coordinates = this.currentStarSectorCoordinates.add(relativeCoordinate);
            const sectorKey = vector3ToString(coordinates);

            if (this.loadedStarSectors.has(sectorKey)) continue; // already generated

            // don't generate star sectors that are not in the frustum
            const bb = StarSector.GetBoundingBox(coordinates.scale(StarSector.SIZE), this.starMapCenterPosition);
            let isInFrustrum = false;
            this.controls.getActiveCameras().forEach((camera) => {
                isInFrustrum = isInFrustrum || camera.isInFrustum(bb);
            });
            if (!isInFrustrum) continue;

            this.registerStarSector(coordinates);
        }

        this.buildNextStars(Math.min(2000, StarMap.GENERATION_RATE * this.controls.getSpeed()));

        const activeCamera = this.scene.activeCamera;
        if (activeCamera === null) throw new Error("No active camera!");

        this.starMapUI.update(activeCamera.globalPosition);
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
        const starSystemSeed = data.seed;
        const starSystemModel = new SeededStarSystemModel(starSystemSeed);

        const starSeed = starSystemModel.getStellarObjectSeed(0);
        const stellarObjectType = starSystemModel.getBodyTypeOfStellarObject(0);

        let starModel: StarModel | BlackHoleModel | NeutronStarModel | null = null;
        switch (stellarObjectType) {
            case BodyType.STAR:
                starModel = new StarModel(starSeed, starSystemModel);
                break;
            case BodyType.BLACK_HOLE:
                starModel = new BlackHoleModel(starSeed, starSystemModel);
                break;
            case BodyType.NEUTRON_STAR:
                starModel = new NeutronStarModel(starSeed, starSystemModel);
                break;
            default:
                throw new Error("Unknown stellar object type!");
        }
        if (starModel === null) throw new Error("Star model is null!");

        let instance: InstancedMesh | null = null;
        let recycled = false;

        if (stellarObjectType === BodyType.STAR || stellarObjectType === BodyType.NEUTRON_STAR) {
            if (this.recycledStars.length > 0) {
                instance = this.recycledStars[0];
                this.recycledStars.shift();
                recycled = true;
            } else instance = this.starTemplate.createInstance(data.name);
        } else {
            if (this.recycledBlackHoles.length > 0) {
                instance = this.recycledBlackHoles[0];
                this.recycledBlackHoles.shift();
                recycled = true;
            } else instance = this.blackHoleTemplate.createInstance(data.name);
        }

        const initializedInstance = instance;

        this.seedToInstanceMap.set(starSystemSeed.toString(), initializedInstance);
        this.instanceToSeedMap.set(initializedInstance, starSystemSeed.toString());

        initializedInstance.scaling = Vector3.One().scaleInPlace(data.scale);
        initializedInstance.position = data.position.add(this.starMapCenterPosition);

        if (starModel.bodyType === BodyType.STAR || starModel.bodyType === BodyType.NEUTRON_STAR) {
            const starColor = starModel.color;
            initializedInstance.instancedBuffers.color = new Color4(starColor.r, starColor.g, starColor.b, 0.0);
        } else {
            initializedInstance.instancedBuffers.color = new Color4(1.0, 0.6, 0.3, 0.0);
        }

        if (!recycled) {
            initializedInstance.isPickable = true;
            initializedInstance.actionManager = new ActionManager(this.scene);

            initializedInstance.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                    if (this.starMapUI.isHovered()) return;
                    this.starMapUI.setHoveredStarSystemMesh(initializedInstance);
                    Sounds.MENU_HOVER_SOUND.play();
                })
            );

            initializedInstance.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                    this.starMapUI.setHoveredStarSystemMesh(null);
                })
            );
        } else {
            initializedInstance.setEnabled(true);
            initializedInstance.actionManager?.unregisterAction(initializedInstance.actionManager.actions[2]);
        }

        initializedInstance.actionManager?.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                if (this.starMapUI.isHovered()) return;

                Sounds.STAR_MAP_CLICK_SOUND.play();

                this.starMapUI.attachUIToMesh(initializedInstance);
                this.starMapUI.setSelectedSystem(starSystemModel, this.currentSystemSeed !== null ? new SeededStarSystemModel(this.currentSystemSeed) : null);

                this.selectedSystemSeed = starSystemSeed;

                this.focusCameraOnStar(initializedInstance);

                if (this.currentSystemSeed !== null) {
                    this.travelLine.setPoints([this.seedToInstanceMap.get(this.currentSystemSeed.toString()) as InstancedMesh, initializedInstance]);
                }
            })
        );

        this.fadeIn(initializedInstance);

        if (starModel.bodyType === BodyType.BLACK_HOLE) this.loadedStarSectors.get(data.sectorString)?.blackHoleInstances.push(initializedInstance);
        else this.loadedStarSectors.get(data.sectorString)?.starInstances.push(initializedInstance);
    }

    private focusCameraOnStar(starInstance: InstancedMesh, skipAnimation = false) {
        const cameraDir = this.controls.thirdPersonCamera.getDirection(Vector3.Forward(this.scene.useRightHandedSystem));

        const cameraToStarDir = starInstance.position.subtract(this.controls.thirdPersonCamera.globalPosition).normalize();

        const rotationAngle = Math.acos(Vector3.Dot(cameraDir, cameraToStarDir));

        const animationDurationSeconds = 1;

        // if the rotation axis has a length different from 1, it means the cross product was made between very close vectors : no rotation is needed
        if (skipAnimation) {
            this.controls.getTransform().lookAt(starInstance.position);
            this.controls.getTransform().computeWorldMatrix(true);
        } else if (rotationAngle > 0.02) {
            const rotationAxis = Vector3.Cross(cameraDir, cameraToStarDir).normalize();
            this.rotationAnimation = new TransformRotationAnimation(this.controls.getTransform(), rotationAxis, rotationAngle, animationDurationSeconds);
        }

        const transformToStarDir = starInstance.position.subtract(this.controls.getTransform().getAbsolutePosition()).normalize();
        const distance = starInstance.position.subtract(this.controls.getTransform().getAbsolutePosition()).length();
        const targetPosition = this.controls.getTransform().getAbsolutePosition().add(transformToStarDir.scaleInPlace(distance));

        // if the transform is already in the right position, do not animate
        if (skipAnimation) this.controls.getTransform().position = targetPosition;
        else if (targetPosition.subtract(this.controls.getTransform().getAbsolutePosition()).lengthSquared() > 0.1) {
            this.translationAnimation = new TransformTranslationAnimation(this.controls.getTransform(), targetPosition, animationDurationSeconds);
        }

        const targetRadius = 10;
        if (skipAnimation) this.controls.thirdPersonCamera.radius = targetRadius;
        else {
            this.radiusAnimation = new CameraRadiusAnimation(this.controls.thirdPersonCamera, targetRadius, animationDurationSeconds);
        }

        this.starMapUI.setHoveredStarSystemMesh(null);
    }

    public focusOnCurrentSystem(skipAnimation = false) {
        console.log("focus on current system");
        if (this.currentSystemSeed === null) return console.warn("No current system seed!");

        const instance = this.seedToInstanceMap.get(this.currentSystemSeed.toString());
        if (instance === undefined) throw new Error("The current system has no instance!");

        const currentSystemModel = new SeededStarSystemModel(this.currentSystemSeed);

        this.starMapUI.attachUIToMesh(instance);
        this.starMapUI.setSelectedSystem(currentSystemModel, this.currentSystemSeed !== null ? new SeededStarSystemModel(this.currentSystemSeed) : null);

        this.focusCameraOnStar(instance, skipAnimation);
    }

    private fadeIn(instance: InstancedMesh) {
        instance.animations = [StarMap.FADE_IN_ANIMATION];
        instance.getScene().beginAnimation(instance, 0, StarMap.FADE_IN_DURATION / 60, false, 1, () => {
            instance.animations = [StarMap.SHIMMER_ANIMATION];
            instance.getScene().beginAnimation(instance, 0, StarMap.SHIMMER_DURATION / 60, true, 0.1 + Math.random() * 0.2);
        });
    }

    private fadeOutThenRecycle(instance: InstancedMesh, recyclingList: InstancedMesh[]) {
        instance.animations = [StarMap.FADE_OUT_ANIMATION];
        instance.getScene().beginAnimation(instance, 0, StarMap.FADE_OUT_DURATION / 60, false, 1, () => {
            if (this.starMapUI.getCurrentPickedMesh() === instance) this.starMapUI.detachUIFromMesh();
            if (this.starMapUI.getCurrentHoveredMesh() === instance) this.starMapUI.setHoveredStarSystemMesh(null);
            instance.setEnabled(false);

            const seed = this.instanceToSeedMap.get(instance);
            if (seed === undefined) throw new Error("No seed for instance!");
            this.seedToInstanceMap.delete(seed);
            this.instanceToSeedMap.delete(instance);

            recyclingList.push(instance);
        });
    }

    public render() {
        this.scene.render();
        syncCamera(this.controls.getActiveCameras()[0], this.starMapUI.uiCamera);
        this.starMapUI.scene.render();
    }

    public attachControl() {
        this.scene.attachControl();
        this.starMapUI.scene.attachControl();
        this.starMapUI.htmlRoot.classList.remove("hidden");
    }

    public detachControl() {
        this.scene.detachControl();
        this.starMapUI.scene.detachControl();
        this.starMapUI.htmlRoot.classList.add("hidden");
    }

    public getMainScene(): Scene {
        return this.scene;
    }
}
