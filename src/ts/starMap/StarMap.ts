import {
    ActionManager,
    Animation,
    BoundingBox, Color3,
    Color4, DefaultRenderingPipeline,
    Engine, ExecuteCodeAction, InstancedMesh, Matrix,
    Mesh,
    MeshBuilder,
    Scene, ScenePerformancePriority,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import { PlayerController } from "../controllers/playerController";
import { Keyboard } from "../inputs/keyboard";

import starTexture from "../../asset/textures/starParticle.png";
import { hashVec3 } from "../utils/hashVec3";
import { seededSquirrelNoise } from "squirrel-noise";
import { centeredRand } from "extended-random";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";

function Vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

function StringToVector3(s: string): Vector3 {
    const [x, y, z] = s.split(",").map(Number);
    return new Vector3(x, y, z);
}

type BuildData = {
    name: string;
    cellString: string;
    scale: number;
    position: Vector3;
}

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

    private readonly loadedCells: { [key: string]: InstancedMesh[] } = {};
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

    private generateCell(cell: Vector3) {
        const cellString = Vector3ToString(cell);

        if (Object.keys(this.loadedCells).includes(cellString)) return; // already generated
        //console.log(Object.keys(this.loadedCells).includes(cellString), cellString, Object.keys(this.loadedCells));

        // don't generate cells that are not in the frustum
        const bb = new BoundingBox(new Vector3(-this.cellSize / 2, -this.cellSize / 2, -this.cellSize / 2), new Vector3(this.cellSize / 2, this.cellSize / 2, this.cellSize / 2), Matrix.Translation(cell.x + this.globalNode.position.x, cell.y + this.globalNode.position.y, cell.z + this.globalNode.position.z));
        if (!this.controller.getActiveCamera().isInFrustum(bb)) return;

        this.loadedCells[cellString] = [];

        /*const wire = MeshBuilder.CreateBox(cellString + "Wire", { width: 1, height: 1, depth: 1 }, this.scene);
        const wireMaterial = new StandardMaterial("wireMaterial", this.scene);
        wireMaterial.wireframe = true;
        wireMaterial.emissiveColor = Color3.Random();
        wire.material = wireMaterial;
        wire.position = cell;
        wire.parent = this.globalNode;*/

        const seed = hashVec3(cell);
        const rng = seededSquirrelNoise(seed);
        const density = 10;
        const nbStars = rng(0) * density;
        for (let i = 0; i < nbStars; i++) {
            this.starBuildQueue.push({
                name: `starInstance|${cell.x}|${cell.y}|${cell.z}|${i}`,
                cellString: cellString,
                scale: 0.5 + rng(100 * i) / 2,
                position: new Vector3(centeredRand(rng, 10 * i + 1) / 2, centeredRand(rng, 10 * i + 2) / 2, centeredRand(rng, 10 * i + 3) / 2).addInPlace(cell)
            });
        }
    }

    private updateCells() {
        const renderRadius = 3;

        // first remove all cells that are too far
        for (const cellString of Object.keys(this.loadedCells)) {
            const cell = StringToVector3(cellString);
            if (cell.add(this.globalNode.position).length() > renderRadius * 2) {
                this.starTrashQueue.push(...this.loadedCells[cellString]);
                delete this.loadedCells[cellString];
                //this.scene.getMeshById(cellString + "Wire")?.dispose();
            }
        }

        this.disposeNextStars(this.cadence * this.controller.getActiveCamera().speed);

        // then generate missing cells
        for (let x = -renderRadius; x <= renderRadius; x++) {
            for (let y = -renderRadius; y <= renderRadius; y++) {
                for (let z = -renderRadius; z <= renderRadius; z++) {
                    const cell = this.currentCell.add(new Vector3(x, y, z));
                    this.generateCell(cell);
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
                if (this.loadedCells[data.cellString]) {
                    const star = this.starTemplate.createInstance(data.name);
                    star.scaling = new Vector3(data.scale, data.scale, data.scale);
                    star.position = data.position;
                    star.parent = this.globalNode;

                    star.isPickable = true;
                    star.actionManager = new ActionManager(this.scene);

                    star.actionManager.registerAction(
                        new ExecuteCodeAction(
                            ActionManager.OnPickTrigger, e => {
                                if (this.gui._linkedControls.length == 0) this.gui.addControl(this.namePlate);

                                this.namePlate.linkWithMesh(star);
                                this.nameLabel.text = e.source.name;
                            }
                        )
                    );

                    star.instancedBuffers.color = new Color4(0.5, 0.2, 0.8, 0.0).scale(2.5);

                    //fade the star in
                    fadeIn(star, 1000);

                    this.loadedCells[data.cellString].push(star);
                }
                this.starBuildQueue.shift();
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

function fadeOutThenDispose(star: InstancedMesh, duration: number) {
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