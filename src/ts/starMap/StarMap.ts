import {
    BoundingBox,
    Color4,
    Engine, InstancedMesh, Matrix,
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

function Vector3ToString(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
}

function StringToVector3(s: string): Vector3 {
    const [x, y, z] = s.split(",").map(Number);
    return new Vector3(x, y, z);
}

export class StarMap {
    readonly scene: Scene;
    readonly controller: PlayerController;
    private globalNode: TransformNode;
    private starTemplate: Mesh;

    private readonly loadedCells: Map<string, InstancedMesh[]> = new Map<string, InstancedMesh[]>();
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

        this.globalNode = new TransformNode("node", this.scene);

        this.starTemplate = MeshBuilder.CreatePlane("star", { width: 0.2, height: 0.2 }, this.scene);
        this.starTemplate.billboardMode = Mesh.BILLBOARDMODE_ALL;
        this.starTemplate.convertToUnIndexedMesh();
        this.starTemplate.isVisible = false;

        const starMaterial = new StandardMaterial("starMaterial", this.scene);
        starMaterial.emissiveTexture = new Texture(starTexture, this.scene);
        starMaterial.opacityTexture = new Texture(starTexture, this.scene);
        starMaterial.opacityTexture.getAlphaFromRGB = true;
        starMaterial.freeze();

        this.starTemplate.material = starMaterial;

        this.globalNode.position.addInPlace(new Vector3(0, 0, 10));

        this.scene.registerBeforeRender(() => {
            const cameraPosition = this.globalNode.position.negate();
            this.currentCell = new Vector3(Math.round(cameraPosition.x), Math.round(cameraPosition.y), Math.round(cameraPosition.z));

            this.updateCells();

            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
            this.globalNode.position.addInPlace(this.controller.update(deltaTime));
        });
    }

    private generateCell(cell: Vector3) {
        const cellString = Vector3ToString(cell);

        if (this.loadedCells.has(cellString)) return; // already generated

        // don't generate cells that are not in the frustum
        //const bb = new BoundingBox(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5), Matrix.Translation(cell.x, cell.y, cell.z));
        //if(!this.controller.getActiveCamera().isInFrustum(bb)) return;

        this.loadedCells.set(cellString, []);

        const seed = hashVec3(cell);
        const rng = seededSquirrelNoise(seed);
        const nbStars = rng(0) * 10;
        for (let i = 0; i < nbStars; i++) {
            const star = this.starTemplate.createInstance(`starInstance|${cell.x}|${cell.y}|${cell.z}|${i}`);
            star.position = new Vector3(centeredRand(rng, 10 * i + 1) / 2, centeredRand(rng, 10 * i + 2) / 2, centeredRand(rng, 10 * i + 3) / 2).addInPlace(cell);
            star.parent = this.globalNode;
            (this.loadedCells.get(cellString) as InstancedMesh[]).push(star);
        }
    }

    private updateCells() {
        const renderRadius = 3;

        // first remove all cells that are too far
        for (const [cellString, meshes] of this.loadedCells) {
            const cell = StringToVector3(cellString);
            if (cell.subtract(this.currentCell).length() > renderRadius) {
                for (const mesh of meshes) mesh.dispose();
                this.loadedCells.delete(cellString);
            }
        }

        // then generate missing cells
        for (let x = -renderRadius; x <= renderRadius; x++) {
            for (let y = -renderRadius; y <= renderRadius; y++) {
                for (let z = -renderRadius; z <= renderRadius; z++) {
                    const cell = this.currentCell.add(new Vector3(x, y, z));
                    const cellString = Vector3ToString(cell);
                    if(this.loadedCells.has(cellString)) continue;
                    this.generateCell(cell);
                }
            }
        }
    }
}