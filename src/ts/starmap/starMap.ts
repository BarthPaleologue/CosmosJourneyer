import { DefaultController } from "../spacelegs/defaultController";
import { Keyboard } from "../controller/inputs/keyboard";

import starTexture from "../../asset/textures/starParticle.png";
import blackHoleTexture from "../../asset/textures/blackholeParticleSmall.png";

import { StarSystemModel } from "../model/starSystemModel";
import { StarModel } from "../model/stellarObjects/starModel";
import { BuildData, Cell, Vector3ToString } from "./cell";
import { BlackHoleModel } from "../model/stellarObjects/blackHoleModel";
import { StarMapUI } from "./starMapUI";
import { getStellarTypeString } from "../model/stellarObjects/common";
import { BODY_TYPE } from "../model/common";
import { Scene, ScenePerformancePriority } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Engine } from "@babylonjs/core/Engines/engine";
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
import { TransformRotationAnimation } from "../controller/uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../controller/uberCore/transforms/animations/translation";
import { makeNoise3D } from "fast-simplex-noise";
import { seededSquirrelNoise } from "squirrel-noise";
import { Settings } from "../settings";
import { getForwardDirection, translate } from "../controller/uberCore/transforms/basicTransform";
import { ThickLines } from "../utils/thickLines";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Mouse } from "../controller/inputs/mouse";

export class StarMap {
    readonly scene: Scene;
    private readonly controller: DefaultController;

    private isRunning = true;

    private rotationAnimation: TransformRotationAnimation | null = null;
    private translationAnimation: TransformTranslationAnimation | null = null;

    /**
     * The position of the center of the starmap in world space.
     */
    private readonly starMapCenterPosition: Vector3;

    private readonly allowedCellRelativeCoordinates: Vector3[] = [];

    private readonly starTemplate: Mesh;
    private readonly blackHoleTemplate: Mesh;

    private readonly starBuildStack: BuildData[] = [];

    private readonly recycledStars: InstancedMesh[] = [];
    private readonly recycledBlackHoles: InstancedMesh[] = [];

    static readonly GENERATION_CADENCE = 100;

    static readonly RENDER_RADIUS = 6;

    private readonly starMapUI: StarMapUI;

    private selectedSystemSeed: number | null = null;
    private currentSystemSeed: number | null = null;

    private readonly loadedCells: Map<string, Cell> = new Map<string, Cell>();

    private readonly seedToInstanceMap: Map<number, InstancedMesh> = new Map<number, InstancedMesh>();
    private readonly instanceToSeedMap: Map<InstancedMesh, number> = new Map<InstancedMesh, number>();

    private travelLine: ThickLines;
    private readonly thickLines: ThickLines[];

    public readonly onWarpObservable: Observable<number> = new Observable<number>();

    /**
     * The position of the cell the player is currently in (relative to the global node).
     */
    private currentCellPosition = Vector3.Zero();

    private static readonly FADE_OUT_ANIMATION = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    private static readonly FADE_OUT_DURATION = 1000;

    private static readonly FADE_IN_ANIMATION = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    private static readonly FADE_IN_DURATION = 1000;

    private static readonly SHIMMER_ANIMATION = new Animation("shimmer", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    private static readonly SHIMMER_DURATION = 1000;

    private readonly densityRNG;

    constructor(engine: Engine) {
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.scene.performancePriority = ScenePerformancePriority.Intermediate;
        this.scene.skipPointerMovePicking = false;
        this.scene.useRightHandedSystem = true;

        this.controller = new DefaultController(this.scene);
        this.controller.speed /= 10;
        this.controller.getActiveCamera().minZ = 0.01;

        this.scene.activeCamera = this.controller.getActiveCamera();
        this.controller.addInput(new Keyboard());
        this.controller.addInput(new Mouse(engine.getRenderingCanvas() as HTMLCanvasElement, 0));

        this.starMapUI = new StarMapUI(this.scene);

        this.starMapUI.warpButton.onPointerClickObservable.add(() => {
            this.currentSystemSeed = this.selectedSystemSeed;
            if (this.currentSystemSeed !== null) this.starMapUI.setCurrentStarSystemMesh(this.seedToInstanceMap.get(this.currentSystemSeed) as InstancedMesh);
            this.dispatchWarpCallbacks();
        });

        const pipeline = new DefaultRenderingPipeline("pipeline", false, this.scene, [this.controller.getActiveCamera()]);
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.0;
        pipeline.bloomWeight = 1.2;
        pipeline.bloomKernel = 128;
        pipeline.imageProcessing.exposure = 1.1;
        pipeline.imageProcessing.contrast = 1.0;

        const urlParams = new URLSearchParams(window.location.search);
        const initialStarMapX = Number(urlParams.get("smx"));
        const initialStarMapY = Number(urlParams.get("smy"));
        const initialStarMapZ = Number(urlParams.get("smz"));

        this.starMapCenterPosition = new Vector3(initialStarMapX ?? 0, initialStarMapY ?? 0, initialStarMapZ ?? 0);

        this.starTemplate = MeshBuilder.CreatePlane("star", { size: 0.2 }, this.scene);
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

        this.travelLine = new ThickLines("travelLine", { points: [], thickness: 0.01, color: Color3.Red() }, this.scene);
        this.thickLines = [this.travelLine];

        // then generate missing cells // TODO: make this in parralel
        for (let x = -StarMap.RENDER_RADIUS; x <= StarMap.RENDER_RADIUS; x++) {
            for (let y = -StarMap.RENDER_RADIUS; y <= StarMap.RENDER_RADIUS; y++) {
                for (let z = -StarMap.RENDER_RADIUS; z <= StarMap.RENDER_RADIUS; z++) {
                    if (x * x + y * y + z * z > StarMap.RENDER_RADIUS * StarMap.RENDER_RADIUS) continue;
                    this.allowedCellRelativeCoordinates.push(new Vector3(x, y, z));
                }
            }
        }

        const seedableRNG = seededSquirrelNoise(Settings.UNIVERSE_SEED);
        let step = 0;
        const perlinRNG = makeNoise3D(() => {
            return seedableRNG(step++);
        });
        this.densityRNG = (x: number, y: number, z: number) => (1.0 - Math.abs(perlinRNG(x * 0.2, y * 0.2, z * 0.2))) ** 8;

        this.scene.onBeforeRenderObservable.add(() => {
            if(!this.isRunning) return;

            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (this.rotationAnimation !== null) this.rotationAnimation.update(deltaTime);

            const playerDisplacementNegated = this.controller.update(deltaTime).negate();

            this.controller.getTransform().position = Vector3.Zero();

            if (this.translationAnimation !== null) {
                const oldPosition = this.controller.getTransform().getAbsolutePosition().clone();
                this.translationAnimation.update(deltaTime);
                const newPosition = this.controller.getTransform().getAbsolutePosition().clone();

                const displacementNegated = oldPosition.subtractInPlace(newPosition);

                translate(this.controller.getTransform(), displacementNegated);
                playerDisplacementNegated.addInPlace(displacementNegated);
            }

            this.starMapCenterPosition.addInPlace(playerDisplacementNegated);
            for (const mesh of this.scene.meshes) mesh.position.addInPlace(playerDisplacementNegated);

            const cameraPosition = this.starMapCenterPosition.negate();

            this.currentCellPosition = new Vector3(Math.round(cameraPosition.x / Cell.SIZE), Math.round(cameraPosition.y / Cell.SIZE), Math.round(cameraPosition.z / Cell.SIZE));

            this.updateCells();

            this.thickLines.forEach((bondingLine) => bondingLine.update());
        });
    }

    public setRunning(running: boolean): void {
        this.isRunning = running;
    }

    private dispatchWarpCallbacks() {
        if (this.selectedSystemSeed === null) throw new Error("No system selected!");
        this.onWarpObservable.notifyObservers(this.selectedSystemSeed);
    }

    /**
     * Register a cell at the given position, it will be added to the generation queue
     * @param position The position of the cell
     */
    private registerCell(position: Vector3) {
        const cell = new Cell(position, this.densityRNG(position.x, position.y, position.z));
        this.loadedCells.set(cell.getKey(), cell);
        this.starBuildStack.push(...cell.generate());
    }

    private updateCells() {
        // first remove all cells that are too far
        const currentSystemInstance = this.currentSystemSeed === null ? null : (this.seedToInstanceMap.get(this.currentSystemSeed) as InstancedMesh);
        const selectedSystemInstance = this.selectedSystemSeed === null ? null : (this.seedToInstanceMap.get(this.selectedSystemSeed) as InstancedMesh);
        for (const cell of this.loadedCells.values()) {
            if (currentSystemInstance !== null && cell.starInstances.concat(cell.blackHoleInstances).includes(currentSystemInstance)) continue; // don't remove cells that contain the current system
            if (selectedSystemInstance !== null && cell.starInstances.concat(cell.blackHoleInstances).includes(selectedSystemInstance)) continue; // don't remove cells that contain the selected system

            const position = cell.position;
            if (position.add(this.starMapCenterPosition).length() > StarMap.RENDER_RADIUS + 1) {
                for (const starInstance of cell.starInstances) this.fadeOutThenRecycle(starInstance, this.recycledStars);
                for (const blackHoleInstance of cell.blackHoleInstances) this.fadeOutThenRecycle(blackHoleInstance, this.recycledBlackHoles);

                this.loadedCells.delete(cell.getKey());
            }
        }

        // then generate missing cells
        for (const relativeCoordinate of this.allowedCellRelativeCoordinates) {
            const position = this.currentCellPosition.add(relativeCoordinate);
            const cellKey = Vector3ToString(position);

            if (this.loadedCells.has(cellKey)) continue; // already generated

            // don't generate cells that are not in the frustum
            const bb = Cell.getBoundingBox(position, this.starMapCenterPosition);
            if (!this.controller.getActiveCamera().isInFrustum(bb)) continue;

            this.registerCell(position);
        }

        this.buildNextStars(Math.min(2000, StarMap.GENERATION_CADENCE * this.controller.speed));

        this.starMapUI.update();
    }

    private buildNextStars(n: number): void {
        for (let i = 0; i < n; i++) {
            if (this.starBuildStack.length === 0) return;

            const data = this.starBuildStack.pop() as BuildData;

            if (!this.loadedCells.has(data.cellString)) {
                // if cell was removed in the meantime we build another star
                n++;
                continue;
            }

            const starSystemSeed = data.seed;
            const starSystemModel = new StarSystemModel(starSystemSeed);

            const starSeed = starSystemModel.getStarSeed(0);
            const isStarBlackHole = starSystemModel.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE;

            const starModel = !isStarBlackHole ? new StarModel(starSeed) : new BlackHoleModel(starSeed);

            let instance: InstancedMesh | null = null;
            let recycled = false;

            if (!isStarBlackHole) {
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

            this.seedToInstanceMap.set(starSystemSeed, initializedInstance);
            this.instanceToSeedMap.set(initializedInstance, starSystemSeed);

            initializedInstance.scaling = Vector3.One().scaleInPlace(data.scale);
            initializedInstance.position = data.position.add(this.starMapCenterPosition);

            if (starModel instanceof StarModel) {
                const starColor = starModel.surfaceColor;
                initializedInstance.instancedBuffers.color = new Color4(starColor.x, starColor.y, starColor.z, 0.0);
            } else {
                initializedInstance.instancedBuffers.color = new Color4(1.0, 0.6, 0.3, 0.0);
            }

            if (!recycled) {
                initializedInstance.isPickable = true;
                initializedInstance.actionManager = new ActionManager(this.scene);

                initializedInstance.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                        this.starMapUI.setHoveredStarSystemMesh(initializedInstance);
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
                    let text = "";
                    if (this.currentSystemSeed !== null) {
                        const currentInstance = this.seedToInstanceMap.get(this.currentSystemSeed) as InstancedMesh;
                        const distance = 10 * currentInstance.getAbsolutePosition().subtract(initializedInstance.getAbsolutePosition()).length();
                        text += `Distance: ${distance.toFixed(2)}ly\n`;
                    }
                    text += `Planets: ${starSystemModel.getNbPlanets()}\n`;
                    text += `Type: ${getStellarTypeString(starModel.stellarType)}\n`;
                    text += `Seed: ${starSystemModel.seed}`;

                    this.starMapUI.attachUIToMesh(initializedInstance);
                    this.starMapUI.setSelectedSystem({ name: starSystemModel.getName(), text });

                    this.selectedSystemSeed = starSystemSeed;

                    this.focusCameraOnStar(initializedInstance);

                    if (this.currentSystemSeed !== null) {
                        this.travelLine.setPoints([this.seedToInstanceMap.get(this.currentSystemSeed) as InstancedMesh, initializedInstance]);
                    }
                })
            );

            this.fadeIn(initializedInstance);

            if (isStarBlackHole) this.loadedCells.get(data.cellString)?.blackHoleInstances.push(initializedInstance);
            else this.loadedCells.get(data.cellString)?.starInstances.push(initializedInstance);
        }
    }

    private focusCameraOnStar(starInstance: InstancedMesh) {
        const cameraDir = getForwardDirection(this.controller.getTransform());
        const starDir = starInstance.position.subtract(this.controller.getTransform().getAbsolutePosition()).normalize();

        const rotationAngle = Math.acos(Vector3.Dot(cameraDir, starDir));

        // if the rotation axis has a length different from 1, it means the cross product was made between very close vectors : no rotation is needed
        if (rotationAngle > 0.02) {
            const rotationAxis = Vector3.Cross(cameraDir, starDir).normalize();
            this.rotationAnimation = new TransformRotationAnimation(this.controller.getTransform(), rotationAxis, rotationAngle, 1);
        }

        const distance = starInstance.position.subtract(this.controller.getTransform().getAbsolutePosition()).length();
        const targetPosition = this.controller
            .getTransform()
            .getAbsolutePosition()
            .add(starDir.scaleInPlace(distance - 0.8));

        // if the transform is already in the right position, do not animate
        if (targetPosition.subtract(this.controller.getTransform().getAbsolutePosition()).lengthSquared() > 0.1) {
            this.translationAnimation = new TransformTranslationAnimation(this.controller.getTransform(), targetPosition, 1);
        }

        this.starMapUI.setHoveredStarSystemMesh(null);
    }

    public focusOnCurrentSystem() {
        if (this.currentSystemSeed === null) return console.warn("No current system seed!");

        const instance = this.seedToInstanceMap.get(this.currentSystemSeed) as InstancedMesh;

        this.focusCameraOnStar(instance);
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

            const seed = this.instanceToSeedMap.get(instance) as number;
            this.seedToInstanceMap.delete(seed);
            this.instanceToSeedMap.delete(instance);

            recyclingList.push(instance);
        });
    }
}
