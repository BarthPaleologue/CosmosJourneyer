import {
    ActionManager,
    Animation,
    Color3,
    Color4,
    DefaultRenderingPipeline,
    Engine,
    ExecuteCodeAction,
    InstancedMesh,
    Mesh,
    MeshBuilder,
    Scene,
    ScenePerformancePriority,
    StandardMaterial,
    Texture,
    Vector3
} from "@babylonjs/core";
import { PlayerController } from "../controllers/playerController";
import { Keyboard } from "../inputs/keyboard";

import starTexture from "../../asset/textures/starParticle.png";
import blackHoleTexture from "../../asset/textures/blackholeParticleSmall.png";

import { StarSystemDescriptor } from "../descriptors/starSystemDescriptor";
import { StarDescriptor } from "../descriptors/stellarObjects/starDescriptor";
import { BuildData, Cell, Vector3ToString } from "./cell";
import { BodyType } from "../bodies/interfaces";
import { BlackHoleDescriptor } from "../descriptors/stellarObjects/blackHoleDescriptor";
import { StarMapUI } from "./starMapUI";
import { getStellarTypeString } from "../descriptors/stellarObjects/common";

export class StarMap {
    readonly scene: Scene;
    readonly controller: PlayerController;

    /**
     * The position of the center of the starmap in world space.
     */
    private readonly starMapCenterPosition: Vector3;

    private readonly starTemplate: Mesh;
    private readonly blackHoleTemplate: Mesh;

    private readonly starBuildStack: BuildData[] = [];
    private readonly starTrashQueue: InstancedMesh[] = [];

    static readonly GENERATION_CADENCE = 10;
    static readonly DELETION_CADENCE = 100;

    static readonly RENDER_RADIUS = 7;

    private readonly starMapUI: StarMapUI;

    private selectedSystemSeed: number | null = null;

    private readonly loadedCells: Map<string, Cell> = new Map<string, Cell>();

    /**
     * The position of the cell the player is currently in (relative to the global node).
     */
    private currentCellPosition = Vector3.Zero();

    static readonly FADE_OUT_ANIMATION = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    static readonly FADE_OUT_DURATION = 1000;

    static readonly FADE_IN_ANIMATION = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    static readonly FADE_IN_DURATION = 1000;

    constructor(engine: Engine) {
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.scene.performancePriority = ScenePerformancePriority.Intermediate;

        this.controller = new PlayerController(this.scene);
        this.controller.speed /= 10;
        this.controller.getActiveCamera().minZ = 0.01;

        this.scene.activeCamera = this.controller.getActiveCamera();
        this.controller.inputs.push(new Keyboard());

        this.starMapUI = new StarMapUI();

        this.starMapUI.warpButton.onPointerClickObservable.add(() => {
            if (this.selectedSystemSeed) {
                const url = new URL(`random.html?seed=${encodeURIComponent(this.selectedSystemSeed)}`, window.location.href);
                window.open(url, "_blank")?.focus();
            } else throw new Error("No system selected!");
        });

        const pipeline = new DefaultRenderingPipeline("pipeline", false, this.scene, [this.controller.getActiveCamera()]);
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.0;
        pipeline.bloomWeight = 1.0;
        pipeline.bloomKernel = 128;
        pipeline.imageProcessing.exposure = 1.1;
        pipeline.imageProcessing.contrast = 1.0;

        this.starMapCenterPosition = new Vector3(0, 0, 0);

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

        this.scene.registerBeforeRender(() => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            const playerDisplacementNegated = this.controller.update(deltaTime);

            this.starMapCenterPosition.addInPlace(playerDisplacementNegated);
            for (const mesh of this.scene.meshes) mesh.position.addInPlace(playerDisplacementNegated);

            const cameraPosition = this.starMapCenterPosition.negate();

            this.currentCellPosition = new Vector3(Math.round(cameraPosition.x / Cell.SIZE), Math.round(cameraPosition.y / Cell.SIZE), Math.round(cameraPosition.z / Cell.SIZE));

            this.updateCells();
        });
    }

    /**
     * Register a cell at the given position, it will be added to the generation queue
     * @param position The position of the cell
     */
    private registerCell(position: Vector3) {
        const cell = new Cell(position);
        this.loadedCells.set(cell.getKey(), cell);
        this.starBuildStack.push(...cell.generate());
    }

    private updateCells() {
        // first remove all cells that are too far
        for (const cell of this.loadedCells.values()) {
            const position = cell.position;
            if (position.add(this.starMapCenterPosition).length() > StarMap.RENDER_RADIUS + 1) {
                this.starTrashQueue.push(...cell.meshes);
                this.loadedCells.delete(cell.getKey());
            }
        }

        this.disposeNextStars(StarMap.DELETION_CADENCE * this.controller.getActiveCamera().speed ** 2);

        // then generate missing cells
        for (let x = -StarMap.RENDER_RADIUS; x <= StarMap.RENDER_RADIUS; x++) {
            for (let y = -StarMap.RENDER_RADIUS; y <= StarMap.RENDER_RADIUS; y++) {
                for (let z = -StarMap.RENDER_RADIUS; z <= StarMap.RENDER_RADIUS; z++) {
                    if (x * x + y * y + z * z > StarMap.RENDER_RADIUS * StarMap.RENDER_RADIUS) continue; // skip cells that are too far away (this is a sphere, not a cube)

                    const position = this.currentCellPosition.add(new Vector3(x, y, z));
                    const cellKey = Vector3ToString(position);

                    if (this.loadedCells.has(cellKey)) continue; // already generated

                    // don't generate cells that are not in the frustum
                    const bb = Cell.getBoundingBox(position, this.starMapCenterPosition);
                    if (!this.controller.getActiveCamera().isInFrustum(bb)) continue;

                    this.registerCell(position);
                }
            }
        }

        this.buildNextStars(StarMap.GENERATION_CADENCE * this.controller.getActiveCamera().speed ** 2);

        this.starMapUI.update();
    }

    private disposeNextStars(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.starTrashQueue.length == 0) return;
            this.fadeOutThenDispose(this.starTrashQueue[0]);
            this.starTrashQueue.shift();
        }
    }

    private buildNextStars(n: number): void {
        for (let i = 0; i < n; i++) {
            if (this.starBuildStack.length == 0) return;

            const data = this.starBuildStack.pop() as BuildData;

            if (!this.loadedCells.has(data.cellString)) {
                // if cell was removed in the meantime we build another star
                n++;
                continue;
            }

            const starSystemSeed = data.seed;
            const starSystemDescriptor = new StarSystemDescriptor(starSystemSeed);

            const starSeed = starSystemDescriptor.getStarSeed(0);
            const isStarBlackHole = starSystemDescriptor.getBodyTypeOfStar(0) == BodyType.BLACK_HOLE;

            const starDescriptor = !isStarBlackHole ? new StarDescriptor(starSeed, []) : new BlackHoleDescriptor(starSeed);

            const star = !isStarBlackHole ? this.starTemplate.createInstance(data.name) : this.blackHoleTemplate.createInstance(data.name);
            star.scaling = Vector3.One().scaleInPlace(data.scale);
            star.position = data.position.add(this.starMapCenterPosition);

            if (starDescriptor instanceof StarDescriptor) {
                const starColor = starDescriptor.surfaceColor;
                star.instancedBuffers.color = new Color4(starColor.x, starColor.y, starColor.z, 0.0);
            } else {
                star.instancedBuffers.color = new Color4(1.0, 0.6, 0.3, 0.0);
            }

            star.isPickable = true;
            star.actionManager = new ActionManager(this.scene);

            star.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, (_) => {
                    this.starMapUI.attachUIToMesh(star);
                    this.starMapUI.setUIText(
                        "Seed: " +
                            starSystemDescriptor.seed +
                            "\n" +
                            "Type: " +
                            getStellarTypeString(starDescriptor.stellarType) +
                            "\n" +
                            "Planets: " +
                            starSystemDescriptor.getNbPlanets()
                    );

                    this.selectedSystemSeed = starSystemSeed;
                })
            );

            this.fadeIn(star);

            this.loadedCells.get(data.cellString)?.meshes.push(star);
        }
    }

    private fadeIn(star: InstancedMesh) {
        star.animations.push(StarMap.FADE_IN_ANIMATION);
        star.getScene().beginAnimation(star, 0, StarMap.FADE_IN_DURATION / 60);
    }

    private fadeOutThenDispose(star: InstancedMesh) {
        star.animations.push(StarMap.FADE_OUT_ANIMATION);
        star.getScene().beginAnimation(star, 0, StarMap.FADE_OUT_DURATION / 60, false, 1, () => star.dispose());
    }
}
