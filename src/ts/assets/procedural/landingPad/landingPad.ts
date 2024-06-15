import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LandingPadMaterial } from "./landingPadMaterial";

export class LandingPad implements Transformable {
    private readonly deck: Mesh;

    private readonly material: LandingPadMaterial;

    constructor(scene: Scene) {
        const width = 40;
        const depth = 60;
        const aspectRatio = width / depth;

        this.material = new LandingPadMaterial(42, aspectRatio, scene);

        this.deck = MeshBuilder.CreateBox("LandingPad", { width: width, depth: depth, height: 0.5 }, scene);
        this.deck.material = this.material;
    }

    update(stellarObjects: Transformable[]): void {
        this.material.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.deck;
    }

    dispose() {
        this.deck.dispose();
        this.material.dispose();
    }
}