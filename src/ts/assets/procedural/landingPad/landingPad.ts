import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PBRMetallicRoughnessMaterial, PhysicsShapeType, Scene } from "@babylonjs/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LandingPadMaterial } from "./landingPadMaterial";
import { Textures } from "../../textures";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

export class LandingPad implements Transformable {
    private readonly deck: Mesh;
    private readonly deckAggregate: PhysicsAggregate;

    private readonly deckMaterial: LandingPadMaterial;

    private readonly crates: Mesh[] = [];
    private readonly crateAggregates: PhysicsAggregate[] = [];
    private readonly crateMaterial: PBRMetallicRoughnessMaterial;

    constructor(padNumber: number, scene: Scene) {
        const width = 40;
        const depth = width * 1.618;
        const aspectRatio = width / depth;

        this.deckMaterial = new LandingPadMaterial(padNumber, aspectRatio, scene);

        this.deck = MeshBuilder.CreateBox("LandingPad", { width: width, depth: depth, height: 0.5 }, scene);
        this.deck.material = this.deckMaterial;

        this.deckAggregate = new PhysicsAggregate(this.deck, PhysicsShapeType.BOX, { mass: 0, friction: 10 }, scene);

        this.crateMaterial = new PBRMetallicRoughnessMaterial("crateMaterial", scene);
        this.crateMaterial.baseTexture = Textures.CRATE_ALBEDO;
        this.crateMaterial.normalTexture = Textures.CRATE_NORMAL;
        this.crateMaterial.metallicRoughnessTexture = Textures.CRATE_METALLIC_ROUGHNESS;
        //this.crateMaterial.occlusionTexture = Textures.CRATE_AMBIENT_OCCLUSION;

        const nbBoxes = Math.floor(Math.random() * 30);
        for (let i = 0; i < nbBoxes; i++) {
            const corner1 = Math.random() < 0.5 ? -1 : 1;
            const corner2 = Math.random() < 0.5 ? -1 : 1;

            const crateSize = Math.random() < 0.2 ? 0.5 : 1;
            const crate = MeshBuilder.CreateBox("crate", { size: crateSize }, scene);
            crate.material = this.crateMaterial;
            crate.parent = this.deck;
            crate.position.y += 0.25 + crateSize / 2;

            do {
                crate.position.x = (corner1 * (width - 10 * Math.random() - 3)) / 2;
                crate.position.z = (corner2 * (depth - 10 * Math.random() - 3)) / 2;
                crate.rotation.y = Math.random() * Math.PI * 2;
            } while (!this.crates.every((otherCrate) => Vector3.Distance(crate.position, otherCrate.position) > 1.5));

            const crateAggregate = new PhysicsAggregate(crate, PhysicsShapeType.BOX, { mass: 100 + Math.random() * 300 }, scene);

            this.crates.push(crate);
            this.crateAggregates.push(crateAggregate);
        }
    }

    update(stellarObjects: Transformable[]): void {
        this.deckMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.deck;
    }

    dispose() {
        this.deck.dispose();
        this.deckAggregate.dispose();
        this.deckMaterial.dispose();
        this.crates.forEach((box) => box.dispose());
        this.crateAggregates.forEach((crateAggregate) => crateAggregate.dispose());
        this.crateMaterial.dispose();
    }
}
