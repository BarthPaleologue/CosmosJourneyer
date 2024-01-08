import { TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { Assets } from "../assets";

export class LandingPad implements Transformable {
    private readonly instanceRoot: TransformNode;

    constructor() {
        this.instanceRoot = Assets.CreateLandingPadInstance();
    }

    getTransform(): TransformNode {
        return this.instanceRoot;
    }
}
