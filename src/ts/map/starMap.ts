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
    TransformNode,
    Vector3
} from "@babylonjs/core";
import { PlayerController } from "../controllers/playerController";
import { Keyboard } from "../inputs/keyboard";

import starTexture from "../../asset/textures/starParticle.png";
import { hashVec3 } from "../utils/hashVec3";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";
import { StarSystemDescriptor } from "../descriptors/starSystemDescriptor";
import { StarDescriptor } from "../descriptors/starDescriptor";
import { BuildData, Cell, Vector3ToString } from "./cell";

export class StarMap {
    readonly scene: Scene;
    readonly controller: PlayerController;

    private readonly globalNode: TransformNode;
    private readonly starTemplate: Mesh;

    private readonly starBuildQueue: BuildData[] = [];
    private readonly starTrashQueue: InstancedMesh[] = [];

    static readonly GENERATION_CADENCE = 7;

    private readonly gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    private readonly namePlate: Rectangle;
    private readonly nameLabel = new TextBlock();

    private readonly loadedCells: Map<string, Cell> = new Map<string, Cell>();
    private currentCellPosition = Vector3.Zero();

    constructor(engine: Engine) {
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.scene.performancePriority = ScenePerformancePriority.Intermediate;

        this.controller = new PlayerController(this.scene);
        this.controller.speed /= 10;
        this.controller.getActiveCamera().minZ = 0.01;

        this.scene.activeCamera = this.controller.getActiveCamera();
        this.controller.inputs.push(new Keyboard());

        this.namePlate = new Rectangle();
        this.namePlate.width = "250px";
        this.namePlate.height = "40px";
        this.namePlate.color = "white";
        this.namePlate.background = "black";
        this.namePlate.addControl(this.nameLabel);
        this.namePlate.linkOffsetY = -50;

        const pipeline = new DefaultRenderingPipeline("pipeline", false, this.scene, [this.controller.getActiveCamera()]);
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.0;
        pipeline.bloomWeight = 1.0;
        pipeline.bloomKernel = 128;
        pipeline.imageProcessing.contrast = 1.7;

        this.globalNode = new TransformNode("node", this.scene);

        this.starTemplate = MeshBuilder.CreatePlane("star", { width: 0.2, height: 0.2 }, this.scene);
        this.starTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this.starTemplate.convertToUnIndexedMesh();
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

        this.scene.registerBeforeRender(() => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
            this.globalNode.position.addInPlace(this.controller.update(deltaTime));
            const cameraPosition = this.globalNode.position.negate();

            this.currentCellPosition = new Vector3(Math.round(cameraPosition.x), Math.round(cameraPosition.y), Math.round(cameraPosition.z));
            this.updateCells();
        });
    }

    private generateCell(position: Vector3) {
        const cell = new Cell(position);
        this.loadedCells.set(cell.uniqueString(), cell);
        this.starBuildQueue.push(...cell.generate());
    }

    private updateCells() {
        const renderRadius = 4;

        // first remove all cells that are too far
        for (const cell of this.loadedCells.values()) {
            const position = cell.position;
            if (position.add(this.globalNode.position).length() > renderRadius * 2) {
                this.starTrashQueue.push(...cell.meshes);
                this.loadedCells.delete(cell.uniqueString());
            }
        }

        this.disposeNextStars(StarMap.GENERATION_CADENCE * this.controller.getActiveCamera().speed);

        // then generate missing cells
        for (let x = -renderRadius; x <= renderRadius; x++) {
            for (let y = -renderRadius; y <= renderRadius; y++) {
                for (let z = -renderRadius; z <= renderRadius; z++) {
                    const position = this.currentCellPosition.add(new Vector3(x, y, z));
                    const cellString = Vector3ToString(position);

                    if (this.loadedCells.has(cellString)) continue; // already generated
                    // don't generate cells that are not in the frustum
                    const bb = Cell.getBoundingBox(position, this.globalNode.position);
                    if (!this.controller.getActiveCamera().isInFrustum(bb)) continue;

                    this.generateCell(position);
                }
            }
        }

        this.buildNextStars(StarMap.GENERATION_CADENCE * this.controller.getActiveCamera().speed);

        for (const mesh of this.scene.meshes) {
            if (this.controller.getActiveCamera().isInFrustum(mesh.getBoundingInfo().boundingBox)) {
                mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
            } else {
                mesh.billboardMode = Mesh.BILLBOARDMODE_NONE;
            }
        }
        if (this.namePlate.linkedMesh == null) this.gui.removeControl(this.namePlate);
    }

    private disposeNextStars(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.starTrashQueue.length == 0) return;
            fadeOutThenDispose(this.starTrashQueue[0], 1000);
            this.starTrashQueue.shift();
        }
    }

    private buildNextStars(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.starBuildQueue.length == 0) return;
            const data = this.starBuildQueue[0];
            if (!this.loadedCells.has(data.cellString)) return; // if cell was removed in the meantime

            const star = this.starTemplate.createInstance(data.name);
            star.scaling = new Vector3(1, 1, 1).scaleInPlace(data.scale);
            star.position = data.position;
            star.parent = this.globalNode;

            star.isPickable = true;
            star.actionManager = new ActionManager(this.scene);

            const starSystemDescriptor = new StarSystemDescriptor(hashVec3(star.position));

            const starSeed = starSystemDescriptor.getStarSeed(0);
            const starDescriptor = new StarDescriptor(starSeed);
            const starColor = starDescriptor.surfaceColor;

            star.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnPickTrigger, (_) => {
                        if (this.gui._linkedControls.length == 0) this.gui.addControl(this.namePlate);

                        this.namePlate.linkWithMesh(star);
                        this.nameLabel.text = starSystemDescriptor.getName();
                    }
                )
            );

            star.instancedBuffers.color = new Color4(starColor.x, starColor.y, starColor.z, 0.0);

            //fade the star in
            fadeIn(star, 1000);

            this.loadedCells.get(data.cellString)?.meshes.push(star);

            this.starBuildQueue.shift();
        }
    }
}

//fade the star in
function fadeIn(star: InstancedMesh, duration: number) {
    const fadeInAnimation = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    fadeInAnimation.setKeys([{
        frame: 0,
        value: 0
    }, {
        frame: duration / 60,
        value: 1
    }]);

    star.animations.push(fadeInAnimation);
    star.getScene().beginAnimation(star, 0, duration / 60);
}

export function fadeOutThenDispose(star: InstancedMesh, duration: number) {
    const fadeOutAnimation = new Animation("fadeIn", "instancedBuffers.color.a", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    fadeOutAnimation.setKeys([{
        frame: 0,
        value: 1
    }, {
        frame: duration / 60,
        value: 0
    }]);

    star.animations.push(fadeOutAnimation);
    star.getScene().beginAnimation(star, 0, duration / 60);
    setTimeout(() => star.dispose(), duration);
}