import starMaterialFragment from "../../../shaders/starMaterial/fragment.glsl";
import starMaterialVertex from "../../../shaders/starMaterial/vertex.glsl";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StarModel } from "./starModel";
import { getInverseRotationQuaternion } from "../../uberCore/transforms/basicTransform";

export class StarMaterial extends ShaderMaterial {
    star: TransformNode;
    starModel: StarModel;
    starSeed: number;

    constructor(star: TransformNode, model: StarModel, scene: Scene) {
        const shaderName = "starMaterial";
        if(Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = starMaterialFragment;
        }
        if(Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = starMaterialVertex;
        }

        super("starColor", scene, shaderName, {
            attributes: ["position"],
            uniforms: ["world", "worldViewProjection", "seed", "starColor", "starPosition", "starInverseRotationQuaternion", "time"]
        });
        this.star = star;
        this.starModel = model;
        this.starSeed = model.seed;
    }

    public update(internalTime: number) {
        this.setFloat("time", internalTime % 100000);
        this.setVector3("starColor", this.starModel.surfaceColor);
        this.setQuaternion("starInverseRotationQuaternion", getInverseRotationQuaternion(this.star));
        this.setFloat("seed", this.starSeed);
        this.setVector3("starPosition", this.star.getAbsolutePosition());
    }
}
