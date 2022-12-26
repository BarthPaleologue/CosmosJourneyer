import {
    ActionManager,
    Animation,
    BoundingBox,
    Color3,
    Color4,
    DefaultRenderingPipeline,
    Engine,
    ExecuteCodeAction,
    InstancedMesh,
    Matrix,
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
import { BuildData, Cell, StringToVector3, Vector3ToString } from "./cell";

export class StarMap {
    readonly scene: Scene;
    readonly controller: PlayerController;
    private globalNode: TransformNode;
    private starTemplate: Mesh;

    readonly starBuildQueue: BuildData[] = [];
    readonly starTrashQueue: InstancedMesh[] = [];

    readonly cadence = 7;
    readonly cellSize = 1;

    readonly gui: AdvancedDynamicTexture;
    readonly namePlate: Rectangle;
    readonly nameLabel: TextBlock;

    private readonly loadedCells: Map<string, Cell> = new Map<string, Cell>();
    private currentCell = Vector3.Zero();

    constructor(engine: Engine) {
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0, 0, 0, 1);
        this.scene.performancePriority = ScenePerformancePriority.Intermediate;

        this.controller = new PlayerController(this.scene);
        this.controller.speed /= 10;
        this.controller.getActiveCamera().minZ = 0.01;

        this.scene.activeCamera = this.controller.getActiveCamera();
        this.controller.inputs.push(new Keyboard());

        this.scene.activeCamera = this.controller.getActiveCamera();

        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.namePlate = new Rectangle();
        this.namePlate.width = "250px";
        this.namePlate.height = "40px";
        this.namePlate.color = "white";
        this.namePlate.background = "black";

        this.nameLabel = new TextBlock();
        this.nameLabel.text = "TEXTE";

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

            this.currentCell = new Vector3(Math.round(cameraPosition.x), Math.round(cameraPosition.y), Math.round(cameraPosition.z));
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

        this.disposeNextStars(this.cadence * this.controller.getActiveCamera().speed);

        // then generate missing cells
        for (let x = -renderRadius; x <= renderRadius; x++) {
            for (let y = -renderRadius; y <= renderRadius; y++) {
                for (let z = -renderRadius; z <= renderRadius; z++) {
                    const position = this.currentCell.add(new Vector3(x, y, z));
                    const cellString = Vector3ToString(position);

                    if (this.loadedCells.has(cellString)) continue; // already generated
                    // don't generate cells that are not in the frustum
                    const bb = Cell.getBoundingBox(position, this.globalNode.position);
                    if (!this.controller.getActiveCamera().isInFrustum(bb)) continue;

                    this.generateCell(position);
                }
            }
        }

        this.buildNextStars(this.cadence * this.controller.getActiveCamera().speed);

        for(const mesh of this.scene.meshes) {
            if(this.controller.getActiveCamera().isInFrustum(mesh.getBoundingInfo().boundingBox)) {
                mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
            } else {
                mesh.billboardMode = Mesh.BILLBOARDMODE_NONE;
            }
        }

        //console.log(this.starBuildQueue.length, this.starTrashQueue.length);
        if (this.namePlate.linkedMesh == null) this.gui.removeControl(this.namePlate);
    }

    private disposeNextStars(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.starTrashQueue.length > 0) {
                fadeOutThenDispose(this.starTrashQueue[0], 1000);
                this.starTrashQueue.shift();
            }
        }
    }

    private buildNextStars(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.starBuildQueue.length > 0) {
                const data = this.starBuildQueue[0];
                if (this.loadedCells.has(data.cellString)) {
                    const star = this.starTemplate.createInstance(data.name);
                    star.scaling = new Vector3(data.scale, data.scale, data.scale);
                    star.position = data.position;
                    star.parent = this.globalNode;

                    star.isPickable = true;
                    star.actionManager = new ActionManager(this.scene);

                    const starSystem = new StarSystemDescriptor(hashVec3(star.position));

                    const starSeed = starSystem.getStarSeed(0);
                    const starDescriptor = new StarDescriptor(starSeed);
                    const starColor = starDescriptor.getColor();

                    star.actionManager.registerAction(
                        new ExecuteCodeAction(
                            ActionManager.OnPickTrigger, e => {
                                if (this.gui._linkedControls.length == 0) this.gui.addControl(this.namePlate);

                                this.namePlate.linkWithMesh(star);
                                this.nameLabel.text = starSystem.getName();
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